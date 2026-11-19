import { NextResponse, type NextRequest } from 'next/server';
import { authorizeHostForGroup, getGroupHosts } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { appEmailHtml } from '@/lib/appEmail';

export const dynamic = 'force-dynamic';

/** Preview of the "Put the group on your phone" email, for the group's hosts. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const groupId = req.nextUrl.searchParams.get('group') ?? '';
  if (!(await authorizeHostForGroup(token, groupId))) return new NextResponse('Not found', { status: 404 });
  const { data: group } = await supabase.from('groups').select('name, country_slug').eq('id', groupId).maybeSingle() as unknown as {
    data: { name: string | null; country_slug: string } | null;
  };
  if (!group) return new NextResponse('Not found', { status: 404 });
  const hosts = await getGroupHosts(groupId);
  const html = appEmailHtml({
    groupName: group.name ?? 'your group',
    hostFirstName: hosts[0]?.name.split(/\s+/)[0] ?? 'your host',
    countrySlug: group.country_slug,
    appUrl: '#preview',
  });
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email preview</title></head><body style="margin:0">${html}</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' } },
  );
}
