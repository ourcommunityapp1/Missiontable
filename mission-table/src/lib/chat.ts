import 'server-only';
import { supabase } from './supabase';
import { getMemberIdForToken, authorizeHostForGroup } from './queries';
import type { GroupChatMessageRow } from './database.types';
import type { ChatAs, ChatMessage, ChatPage, ChatRole } from './chatTypes';
import { CHAT_MAX_LENGTH } from './chatTypes';

/**
 * Group chat ships switched off until its database migration (008) is applied
 * and tested. Turn it on with GROUP_CHAT=on in the hosting environment.
 */
export function chatEnabled(): boolean {
  return process.env.GROUP_CHAT === 'on';
}

/** Who is reading or writing: a member (member_token) or a host/co-host (host_token) of the group. */
export type ChatViewer = { kind: ChatAs; id: string; token: string; groupId: string };

const UUID = /^[0-9a-f-]{36}$/i;

export async function resolveChatViewer(groupId: unknown, token: unknown, as: unknown): Promise<ChatViewer | null> {
  if (!chatEnabled()) return null;
  if (typeof groupId !== 'string' || typeof token !== 'string' || !UUID.test(groupId) || !token) return null;
  if (as === 'host') {
    const hostId = await authorizeHostForGroup(token, groupId);
    return hostId ? { kind: 'host', id: hostId, token, groupId } : null;
  }
  if (as === 'member') {
    const memberId = await getMemberIdForToken(groupId, token);
    return memberId ? { kind: 'member', id: memberId, token, groupId } : null;
  }
  return null;
}

const COLUMNS = 'id, group_id, member_id, host_id, body, created_at, deleted_at, deleted_by';

async function hydrate(rows: GroupChatMessageRow[], viewer: ChatViewer): Promise<ChatMessage[]> {
  if (rows.length === 0) return [];
  const memberIds = [...new Set(rows.map((r) => r.member_id).filter((x): x is string => !!x))];
  const hostIds = [...new Set(rows.map((r) => r.host_id).filter((x): x is string => !!x))];

  const [membersRes, hostsRes, groupRes] = await Promise.all([
    memberIds.length
      ? supabase.from('members').select('id, name').in('id', memberIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    hostIds.length
      ? supabase.from('hosts').select('id, name').in('id', hostIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    hostIds.length
      ? supabase.from('groups').select('host_id').eq('id', viewer.groupId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]) as unknown as [
    { data: { id: string; name: string }[] | null },
    { data: { id: string; name: string }[] | null },
    { data: { host_id: string } | null },
  ];

  const memberNames = new Map((membersRes.data ?? []).map((m) => [m.id, m.name]));
  const hostNames = new Map((hostsRes.data ?? []).map((h) => [h.id, h.name]));
  const primaryHostId = groupRes.data?.host_id ?? null;

  return rows.map((r) => {
    const authorId = (r.member_id ?? r.host_id)!;
    const role: ChatRole = r.host_id ? (r.host_id === primaryHostId ? 'host' : 'cohost') : 'member';
    const name = r.host_id ? hostNames.get(r.host_id) : memberNames.get(r.member_id!);
    const mine = authorId === viewer.id;
    const deleted = !!r.deleted_at;
    return {
      id: r.id,
      authorId,
      authorName: name?.trim() || (r.host_id ? 'Host' : 'A member'),
      role,
      body: deleted ? '' : r.body,
      createdAt: r.created_at,
      deleted,
      mine,
      canDelete: !deleted && (mine || viewer.kind === 'host'),
    };
  });
}

const PAGE = 60;
/** Refreshes re-read a few seconds before the cursor so rows committed late are not missed. */
const OVERLAP_MS = 5_000;

/**
 * The newest page of messages, a page older than `before`, or — with `since` —
 * everything created or removed after that cursor (for refreshing an open chat).
 */
export async function loadChat(viewer: ChatViewer, opts: { since?: string; before?: string } = {}): Promise<ChatPage> {
  const cursor = new Date().toISOString();

  if (opts.since && !Number.isNaN(Date.parse(opts.since))) {
    const from = new Date(Date.parse(opts.since) - OVERLAP_MS).toISOString();
    const { data } = await supabase
      .from('group_chat_messages')
      .select(COLUMNS)
      .eq('group_id', viewer.groupId)
      .or(`created_at.gt.${from},deleted_at.gt.${from}`)
      .order('created_at', { ascending: true })
      .limit(200) as unknown as { data: GroupChatMessageRow[] | null };
    return { messages: await hydrate(data ?? [], viewer), hasMore: false, cursor };
  }

  let q = supabase
    .from('group_chat_messages')
    .select(COLUMNS)
    .eq('group_id', viewer.groupId)
    .is('deleted_at', null);
  if (opts.before && !Number.isNaN(Date.parse(opts.before))) q = q.lt('created_at', new Date(opts.before).toISOString());
  const { data } = await q.order('created_at', { ascending: false }).limit(PAGE + 1) as unknown as { data: GroupChatMessageRow[] | null };
  const rows = data ?? [];
  const hasMore = rows.length > PAGE;
  const page = rows.slice(0, PAGE).reverse();
  return { messages: await hydrate(page, viewer), hasMore, cursor };
}

export async function markChatRead(viewer: ChatViewer): Promise<void> {
  await supabase
    .from('group_chat_reads')
    .upsert({ group_id: viewer.groupId, reader_id: viewer.id, last_read_at: new Date().toISOString() }, { onConflict: 'group_id,reader_id' });
}

/** Messages from other people since this reader last had the chat open. Never throws. */
export async function getChatUnread(groupId: string, readerId: string): Promise<number> {
  try {
    const { data: read } = await supabase
      .from('group_chat_reads')
      .select('last_read_at')
      .eq('group_id', groupId)
      .eq('reader_id', readerId)
      .maybeSingle() as unknown as { data: { last_read_at: string } | null };
    let q = supabase
      .from('group_chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .or(`member_id.is.null,member_id.neq.${readerId}`)
      .or(`host_id.is.null,host_id.neq.${readerId}`);
    if (read) q = q.gt('created_at', read.last_read_at);
    const { count } = await q as unknown as { count: number | null };
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type SendResult = { success: true; message: ChatMessage } | { success: false; error: string };

const BURST_WINDOW_MS = 30_000;
const BURST_MAX = 8;

export async function postChatMessage(viewer: ChatViewer, rawBody: unknown): Promise<SendResult> {
  if (typeof rawBody !== 'string') return { success: false, error: 'Write a message first.' };
  const body = rawBody.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (!body) return { success: false, error: 'Write a message first.' };
  if (body.length > CHAT_MAX_LENGTH) return { success: false, error: `Messages can be up to ${CHAT_MAX_LENGTH} characters.` };

  const authorCol = viewer.kind === 'host' ? 'host_id' : 'member_id';
  const { count: recent } = await supabase
    .from('group_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', viewer.groupId)
    .eq(authorCol, viewer.id)
    .gt('created_at', new Date(Date.now() - BURST_WINDOW_MS).toISOString()) as unknown as { count: number | null };
  if ((recent ?? 0) >= BURST_MAX) return { success: false, error: 'You’re sending messages quickly. Wait a moment and try again.' };

  const { data, error } = await supabase
    .from('group_chat_messages')
    .insert(viewer.kind === 'host' ? { group_id: viewer.groupId, body, host_id: viewer.id } : { group_id: viewer.groupId, body, member_id: viewer.id })
    .select(COLUMNS)
    .single() as unknown as { data: GroupChatMessageRow | null; error: unknown };
  if (error || !data) return { success: false, error: 'Could not send. Please try again.' };

  await markChatRead(viewer);
  const [message] = await hydrate([data], viewer);
  return { success: true, message };
}

export async function removeChatMessage(viewer: ChatViewer, messageId: unknown): Promise<{ success: boolean; error?: string }> {
  if (typeof messageId !== 'string' || !UUID.test(messageId)) return { success: false, error: 'Message not found.' };
  const { data: row } = await supabase
    .from('group_chat_messages')
    .select(COLUMNS)
    .eq('id', messageId)
    .eq('group_id', viewer.groupId)
    .maybeSingle() as unknown as { data: GroupChatMessageRow | null };
  if (!row) return { success: false, error: 'Message not found.' };
  if (row.deleted_at) return { success: true };

  const mine = (viewer.kind === 'host' ? row.host_id : row.member_id) === viewer.id;
  if (!mine && viewer.kind !== 'host') return { success: false, error: 'You can only remove your own messages.' };

  const { error } = await supabase
    .from('group_chat_messages')
    .update({ deleted_at: new Date().toISOString(), deleted_by: viewer.id })
    .eq('id', messageId);
  return error ? { success: false, error: 'Could not remove it. Please try again.' } : { success: true };
}
