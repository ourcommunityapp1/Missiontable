// Client-safe types and helpers for group chat.

export type ChatRole = 'member' | 'host' | 'cohost';
export type ChatAs = 'member' | 'host';

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  role: ChatRole;
  /** Empty when the message was removed. */
  body: string;
  createdAt: string;
  deleted: boolean;
  mine: boolean;
  canDelete: boolean;
};

export type ChatPage = {
  messages: ChatMessage[];
  /** True when older messages exist before the first one returned. */
  hasMore: boolean;
  /** Pass back as `since` on the next refresh. */
  cursor: string;
};

export const CHAT_MAX_LENGTH = 2000;

/** "WhatsApp group" etc. for a group's outside chat link. */
export function outsideChatLabel(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('whatsapp')) return 'WhatsApp group';
  if (u.includes('groupme')) return 'GroupMe';
  if (u.includes('signal')) return 'Signal group';
  if (u.includes('t.me') || u.includes('telegram')) return 'Telegram group';
  return 'Outside chat';
}
