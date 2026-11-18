import { NextResponse, type NextRequest } from 'next/server';
import { resolveChatViewer, loadChat, markChatRead } from '@/lib/chat';

export const dynamic = 'force-dynamic';

/**
 * Reads a group's chat. POST so tokens stay out of URLs and logs.
 * Body: { groupId, token, as: 'member' | 'host', since?, before?, markRead? }
 *   - no since/before: newest page
 *   - before=<ISO>: the page of older messages
 *   - since=<cursor>: messages created or removed since the last read (open chats refresh with this)
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const viewer = await resolveChatViewer(body.groupId, body.token, body.as);
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await loadChat(viewer, {
    since: typeof body.since === 'string' ? body.since : undefined,
    before: typeof body.before === 'string' ? body.before : undefined,
  });
  if (body.markRead === true) await markChatRead(viewer);
  return NextResponse.json(page, { headers: { 'Cache-Control': 'no-store' } });
}
