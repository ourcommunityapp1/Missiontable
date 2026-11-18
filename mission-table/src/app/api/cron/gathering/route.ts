import { NextResponse, type NextRequest } from 'next/server';
import { runGatheringLoop } from '@/lib/gathering';

export const dynamic = 'force-dynamic';

/**
 * Sends the automatic "Are you in?" / thank-you emails and host reminders that are due.
 * Called hourly by the Netlify scheduled function in netlify/functions/gathering-loop.mts.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET`.
 * Query (for testing): dry=1 (report only, never sends), preview=1 (include first email's HTML),
 * group=<id> (limit to one group), now=<ISO time> (pretend it's this time; only with group=).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const groupId = sp.get('group') ?? undefined;
  const nowParam = sp.get('now');
  if (nowParam && !groupId) return NextResponse.json({ error: 'now= requires group=' }, { status: 400 });
  const now = nowParam ? new Date(nowParam) : undefined;
  if (now && Number.isNaN(now.getTime())) return NextResponse.json({ error: 'Invalid now=' }, { status: 400 });

  const actions = await runGatheringLoop({
    now,
    groupId,
    dryRun: sp.get('dry') === '1',
    preview: sp.get('preview') === '1',
  });
  return NextResponse.json({ ok: true, ranAt: (now ?? new Date()).toISOString(), actions });
}
