'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { sendChatMessage, deleteChatMessage } from '@/lib/chatActions';
import { CHAT_MAX_LENGTH, outsideChatLabel, type ChatAs, type ChatMessage, type ChatPage } from '@/lib/chatTypes';

type Props = {
  groupId: string;
  token: string;
  as: ChatAs;
  /** The group's WhatsApp/GroupMe link, if it has one. */
  outsideChatLink?: string | null;
  /** Conversation starters shown while there are no messages yet. */
  prompts?: string[];
  /** Group activity (meals, field updates…) shown between messages by time. */
  feed?: { id: string; at: string; node: React.ReactNode }[];
  /** Jump to the newest message when the chat opens (off for the Home feed, which opens at the top). */
  scrollToEndOnLoad?: boolean;
};

type Item = ChatMessage & { pending?: boolean; failed?: boolean };

const REFRESH_MS = 4_000;
const CLUSTER_MS = 5 * 60_000;

async function fetchChat(body: Record<string, unknown>): Promise<ChatPage | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as ChatPage) : null;
  } catch {
    return null;
  }
}

/** Upserts incoming messages by id, drops removed ones, keeps time order. */
function merge(current: Item[], incoming: ChatMessage[]): Item[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) {
    if (m.deleted) byId.delete(m.id);
    else byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).filter((p) => /[A-Za-z]/.test(p)).slice(0, 2).map((p) => p.replace(/[^A-Za-z]/g, '')[0]?.toUpperCase() ?? '').join('');
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const URL_RE = /(https?:\/\/[^\s<]+)/g;

/** Message text with web links made tappable. */
function Body({ text, mine }: { text: string; mine: boolean }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const trail = part.match(/[.,!?;:)\]]+$/)?.[0] ?? '';
        const href = trail ? part.slice(0, -trail.length) : part;
        return (
          <Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className={`underline underline-offset-2 ${mine ? 'text-cream' : 'text-black'}`}
            >
              {href}
            </a>
            {trail}
          </Fragment>
        );
      })}
    </>
  );
}

function Starters({ prompts, onPick }: { prompts: string[]; onPick: (p: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar sm:flex-wrap">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(p)}
          className="flex-none sm:flex-initial min-h-[40px] px-3 border-2 border-black bg-cream font-inter text-[13px] text-black text-left hover:bg-black hover:text-cream"
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default function ChatPanel({ groupId, token, as, outsideChatLink, prompts = [], feed = [], scrollToEndOnLoad = true }: Props) {
  const [messages, setMessages] = useState<Item[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [newBelow, setNewBelow] = useState(0);
  const [composing, setComposing] = useState(false);

  const cursor = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const refreshing = useRef(false);
  const latest = useRef<Item[]>([]);
  useEffect(() => { latest.current = messages; }, [messages]);

  const scrollToEnd = useCallback((smooth = false) => {
    requestAnimationFrame(() => bottom.current?.scrollIntoView({ block: 'end', behavior: smooth ? 'smooth' : 'auto' }));
    setNewBelow(0);
  }, []);

  /** True when the end of the chat is on screen (or nearly). */
  const atEnd = () => {
    const el = bottom.current;
    return !el || el.getBoundingClientRect().top < window.innerHeight + 160;
  };

  const refresh = useCallback(async () => {
    if (refreshing.current || !cursor.current || document.visibilityState !== 'visible') return;
    refreshing.current = true;
    try {
      const page = await fetchChat({ groupId, token, as, since: cursor.current, markRead: true });
      if (!page) return;
      cursor.current = page.cursor;
      if (page.messages.length === 0) return;
      const wasAtEnd = atEnd();
      const known = new Set(latest.current.map((m) => m.id));
      const added = page.messages.filter((m) => !m.deleted && !m.mine && !known.has(m.id)).length;
      setMessages((cur) => merge(cur, page.messages));
      if (added > 0) {
        if (wasAtEnd) scrollToEnd(true);
        else setNewBelow((n) => n + added);
      }
    } finally {
      refreshing.current = false;
    }
  }, [groupId, token, as, scrollToEnd]);

  // First page, then keep refreshing while the chat is open and the app is in front.
  useEffect(() => {
    let cancelled = false;
    void fetchChat({ groupId, token, as, markRead: true }).then((page) => {
      if (cancelled) return;
      if (!page) { setStatus('error'); return; }
      cursor.current = page.cursor;
      setMessages(page.messages);
      setHasMore(page.hasMore);
      setStatus('ready');
      if (page.messages.length > 0 && scrollToEndOnLoad) scrollToEnd();
    });
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [groupId, token, as, refresh, scrollToEnd, scrollToEndOnLoad]);

  // Grow the box with the text, up to about five lines.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  async function loadOlder() {
    const first = messages[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    const page = await fetchChat({ groupId, token, as, before: first.createdAt });
    setLoadingOlder(false);
    if (!page) { setError('Could not load earlier messages.'); return; }
    // Keep the same messages on screen while older ones are added above.
    const before = document.documentElement.scrollHeight;
    setMessages((cur) => merge(cur, page.messages));
    setHasMore(page.hasMore);
    requestAnimationFrame(() => window.scrollBy(0, document.documentElement.scrollHeight - before));
  }

  async function deliver(tempId: string, text: string) {
    const res = await sendChatMessage(groupId, token, as, text);
    if (!res.success) {
      setMessages((cur) => cur.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setError(res.error);
      return;
    }
    setMessages((cur) => merge(cur.filter((m) => m.id !== tempId), [res.message]));
  }

  function send(text = draft) {
    const body = text.trim();
    if (!body) return;
    if (body.length > CHAT_MAX_LENGTH) { setError(`Messages can be up to ${CHAT_MAX_LENGTH} characters.`); return; }
    setError('');
    setDraft('');
    const tempId = `temp-${Date.now()}`;
    setMessages((cur) => [
      ...cur,
      { id: tempId, authorId: 'me', authorName: 'You', role: as === 'host' ? 'host' : 'member', body, createdAt: new Date().toISOString(), deleted: false, mine: true, canDelete: false, pending: true },
    ]);
    scrollToEnd(true);
    void deliver(tempId, body);
  }

  function retry(m: Item) {
    setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, failed: false, pending: true } : x)));
    setError('');
    void deliver(m.id, m.body);
  }

  async function remove(m: Item) {
    if (!window.confirm(m.mine ? 'Remove your message?' : `Remove this message from ${m.authorName}?`)) return;
    setSelected(null);
    const prev = messages;
    setMessages((cur) => cur.filter((x) => x.id !== m.id));
    const res = await deleteChatMessage(groupId, token, as, m.id);
    if (!res.success) { setMessages(prev); setError(res.error ?? 'Could not remove it.'); }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends on computers; on phones Enter adds a line and the button sends.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault();
      send();
    }
  }

  type Row = { type: 'msg'; id: string; at: string; m: Item } | { type: 'feed'; id: string; at: string; node: React.ReactNode };
  const rows: Row[] = [
    ...messages.map((m): Row => ({ type: 'msg', id: m.id, at: m.createdAt, m })),
    ...feed.map((f): Row => ({ type: 'feed', id: f.id, at: f.at, node: f.node })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="flex flex-col">
      {outsideChatLink && (
        <p className="font-inter text-xs text-warm mb-4">
          Your group also has a{' '}
          <a href={outsideChatLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-black underline underline-offset-2">
            {outsideChatLabel(outsideChatLink)}
          </a>
          .
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => void loadOlder()}
          disabled={loadingOlder}
          className="self-center mb-4 min-h-[40px] px-4 border-2 border-black font-inter font-semibold text-[11px] tracking-[0.08em] uppercase hover:bg-black hover:text-cream disabled:opacity-50"
        >
          {loadingOlder ? 'Loading…' : 'Earlier messages'}
        </button>
      )}

      <div aria-live="polite" aria-relevant="additions" className="flex flex-col min-w-0">
        {status === 'loading' && feed.length === 0 && <p className="font-inter text-sm text-warm py-10 text-center">Loading messages…</p>}
        {status === 'error' && (
          <p className="font-inter text-sm text-warm py-6 text-center">Couldn’t load messages. Check your connection and try again.</p>
        )}
        {status === 'ready' && messages.length === 0 && feed.length === 0 && (
          <div className="border-2 border-black bg-cream-dark p-6 flex flex-col gap-4">
            <div>
              <p className="font-fraunces font-semibold text-[22px] leading-tight text-black">Start the conversation</p>
              <p className="font-inter text-sm text-warm mt-1">Everyone in the group, including the hosts, can read and reply here.</p>
            </div>
            {prompts.length > 0 && <Starters prompts={prompts} onPick={(p) => { setDraft(p); input.current?.focus(); }} />}
          </div>
        )}

        {rows.map((row, i) => {
          const prevRow = rows[i - 1];
          const newDay = !prevRow || new Date(prevRow.at).toDateString() !== new Date(row.at).toDateString();
          const separator = newDay && (
            <div className="flex items-center gap-3 my-4" role="separator">
              <span className="flex-1 h-px bg-black/20" />
              <span className="font-inter font-semibold text-[10px] tracking-[0.12em] uppercase text-warm">{dayLabel(row.at)}</span>
              <span className="flex-1 h-px bg-black/20" />
            </div>
          );
          if (row.type === 'feed') {
            return (
              <Fragment key={row.id}>
                {separator}
                <div className="mt-3 min-w-0">{row.node}</div>
              </Fragment>
            );
          }
          const m = row.m;
          const prev = prevRow?.type === 'msg' ? prevRow.m : null;
          const startsCluster = newDay || !prev || prev.authorId !== m.authorId || Date.parse(m.createdAt) - Date.parse(prev.createdAt) > CLUSTER_MS;
          const isSelected = selected === m.id;
          const roleTag = m.role === 'host' ? 'Host' : m.role === 'cohost' ? 'Co-host' : null;
          return (
            <Fragment key={m.id}>
              {separator}
              <div className={`flex gap-2 min-w-0 ${m.mine ? 'justify-end' : 'justify-start'} ${startsCluster ? 'mt-3' : 'mt-1'}`}>
                {!m.mine && (
                  <div className="w-8 flex-none">
                    {startsCluster && (
                      <div
                        aria-hidden="true"
                        className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-fraunces text-[11px] ${roleTag ? 'bg-black text-cream' : 'bg-cream-dark text-black'}`}
                      >
                        {initialsOf(m.authorName)}
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex flex-col min-w-0 max-w-[82%] sm:max-w-[70%] ${m.mine ? 'items-end' : 'items-start'}`}>
                  {startsCluster && (
                    <p className="font-inter text-[11px] text-warm mb-1 flex flex-wrap items-center gap-x-1.5">
                      {!m.mine && <span className="font-semibold text-black">{m.authorName}</span>}
                      {!m.mine && roleTag && (
                        <span className="font-bold text-[9px] tracking-[0.1em] uppercase border border-black px-1 leading-[14px] text-black">{roleTag}</span>
                      )}
                      <span>{timeLabel(m.createdAt)}</span>
                    </p>
                  )}
                  <div
                    role={m.canDelete ? 'button' : undefined}
                    tabIndex={m.canDelete ? 0 : undefined}
                    aria-expanded={m.canDelete ? isSelected : undefined}
                    aria-label={m.canDelete ? `Message${m.mine ? '' : ` from ${m.authorName}`}: ${m.body}. Options` : undefined}
                    onClick={() => m.canDelete && setSelected(isSelected ? null : m.id)}
                    onKeyDown={(e) => { if (m.canDelete && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelected(isSelected ? null : m.id); } }}
                    className={`px-3.5 py-2.5 border-2 border-black font-inter text-[15px] leading-[1.45] whitespace-pre-wrap [overflow-wrap:anywhere] ${
                      m.mine ? 'bg-black text-cream' : 'bg-cream text-black'
                    } ${m.pending ? 'opacity-60' : ''} ${m.canDelete ? 'cursor-pointer' : ''} ${isSelected ? 'outline outline-2 outline-offset-2 outline-accent' : ''}`}
                  >
                    <Body text={m.body} mine={m.mine} />
                  </div>
                  {m.failed && (
                    <button type="button" onClick={() => retry(m)} className="mt-1 min-h-[32px] font-inter text-xs font-semibold text-[#8A3A12] underline underline-offset-2">
                      Not sent · Tap to retry
                    </button>
                  )}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => void remove(m)}
                      className="mt-1 min-h-[36px] px-3 border-2 border-black bg-cream font-inter text-xs font-semibold text-black hover:bg-black hover:text-cream"
                    >
                      Remove message
                    </button>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {newBelow > 0 && (
        <button
          type="button"
          onClick={() => scrollToEnd(true)}
          className="sticky bottom-[88px] z-20 self-center mt-3 min-h-[36px] px-4 bg-accent text-cream font-inter text-xs font-semibold shadow-md"
        >
          {newBelow} new message{newBelow === 1 ? '' : 's'} ↓
        </button>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="sticky bottom-0 z-10 bg-cream mt-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t-2 border-black"
      >
        {error && <p role="alert" className="font-inter text-xs text-[#8A3A12] mb-2">{error}</p>}
        {status === 'ready' && messages.length === 0 && feed.length > 0 && prompts.length > 0 && !draft && composing && (
          <div className="mb-2"><Starters prompts={prompts} onPick={(p) => { setDraft(p); input.current?.focus(); }} /></div>
        )}
        <div className="flex items-end gap-2">
          <label className="flex-1 min-w-0">
            <span className="sr-only">Message the group</span>
            <textarea
              ref={input}
              rows={1}
              value={draft}
              maxLength={CHAT_MAX_LENGTH}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setComposing(true)}
              onBlur={() => setComposing(false)}
              placeholder="Message the group"
              className="block w-full resize-none border-2 border-black bg-cream px-3 py-2.5 font-inter text-base leading-[1.35] text-black outline-none focus:bg-white min-h-[48px]"
            />
          </label>
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex-none min-h-[48px] px-4 bg-black text-cream font-inter font-semibold text-[13px] tracking-[0.06em] uppercase disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
      <div ref={bottom} aria-hidden="true" />
    </div>
  );
}
