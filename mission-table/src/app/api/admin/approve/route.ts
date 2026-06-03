import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const groupId = req.nextUrl.searchParams.get('groupId');

  if (!token || token !== process.env.ADMIN_APPROVE_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!groupId) {
    return new NextResponse('Missing groupId', { status: 400 });
  }

  const { error } = await supabase
    .from('groups')
    .update({ status: 'active' })
    .eq('id', groupId)
    .eq('status', 'pending');

  if (error) {
    return new NextResponse('Failed to approve group', { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:400px">
      <h2>✓ Group Approved</h2>
      <p>The group is now live on its country page.</p>
      <a href="https://missiontable.org/browse">View the site →</a>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } },
  );
}
