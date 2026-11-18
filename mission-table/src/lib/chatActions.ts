'use server';

import { resolveChatViewer, postChatMessage, removeChatMessage, type SendResult } from './chat';
import { trackServer } from './mixpanelServer';
import type { ChatAs } from './chatTypes';

// Server actions are public endpoints: every call re-checks the token against the group.

export async function sendChatMessage(groupId: string, token: string, as: ChatAs, body: string): Promise<SendResult> {
  const viewer = await resolveChatViewer(groupId, token, as);
  if (!viewer) return { success: false, error: 'Could not verify your membership.' };
  const res = await postChatMessage(viewer, body);
  if (res.success) await trackServer('chat_message_sent', token, { group_id: groupId, author_kind: viewer.kind });
  return res;
}

export async function deleteChatMessage(groupId: string, token: string, as: ChatAs, messageId: string): Promise<{ success: boolean; error?: string }> {
  const viewer = await resolveChatViewer(groupId, token, as);
  if (!viewer) return { success: false, error: 'Could not verify your membership.' };
  const res = await removeChatMessage(viewer, messageId);
  if (res.success) await trackServer('chat_message_removed', token, { group_id: groupId, author_kind: viewer.kind });
  return res;
}
