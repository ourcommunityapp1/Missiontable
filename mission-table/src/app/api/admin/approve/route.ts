import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { approveGroup } from '@/lib/admin';
import { esc } from '@/lib/escapeHtml';

// Legacy approve link from older admin emails. Opening the link (GET) only shows
// a confirmation page; approving needs the button (POST), so email link
// scanners can't approve a group by "clicking" it. New emails link to /admin/<token>.

function page(body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Approve group</title></head>
     <body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#FBF9F4;color:#1C1B1B;padding:32px 20px;max-width:440px;margin:0 auto">${body}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

function authorized(token: string | null) {
  return !!token && !!process.env.ADMIN_APPROVE_SECRET && token === process.env.ADMIN_APPROVE_SECRET;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const groupId = req.nextUrl.searchParams.get('groupId') ?? '';
  if (!authorized(token)) return page('<h2>Not authorized</h2>', 401);
  const { data: g } = await supabase.from('groups').select('name, country_slug, status').eq('id', groupId).maybeSingle() as unknown as {
    data: { name: string | null; country_slug: string; status: string } | null;
  };
  if (!g) return page('<h2>Group not found</h2>', 404);
  if (g.status !== 'pending') return page(`<h2>${esc(g.name ?? 'This group')} is already ${esc(g.status === 'active' ? 'live' : g.status)}</h2><p><a href="https://missiontable.org/country/${esc(g.country_slug)}">View the country page →</a></p>`);
  return page(`
    <h2 style="font-family:Georgia,serif">Approve ${esc(g.name ?? 'this group')}?</h2>
    <p>It will appear on the ${esc(g.country_slug)} page right away, and the host gets a “you're live” email.</p>
    <form method="POST">
      <input type="hidden" name="token" value="${esc(token!)}">
      <input type="hidden" name="groupId" value="${esc(groupId)}">
      <button type="submit" style="background:#000;color:#fff;border:0;padding:14px 24px;font-weight:bold;font-size:15px;cursor:pointer">Approve this group</button>
    </form>`);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = form.get('token') as string | null;
  const groupId = (form.get('groupId') as string | null) ?? '';
  if (!authorized(token)) return page('<h2>Not authorized</h2>', 401);
  const res = await approveGroup(groupId, null);
  if (!res.success) return page(`<h2>Couldn’t approve</h2><p>${esc(res.error)}</p>`, 400);
  return page(`<h2>Group approved</h2><p>It’s live on its country page${res.emailed ? ', and the host has been emailed' : '. The host email could not be sent; let them know yourself'}.</p><p><a href="https://missiontable.org/browse">View the site →</a></p>`);
}
