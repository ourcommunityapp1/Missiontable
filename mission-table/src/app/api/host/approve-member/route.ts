import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

function html(heading: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background: #FBF9F4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { border: 2px solid #000; padding: 40px; max-width: 480px; background: #FBF9F4; }
    h1 { font-size: 28px; margin: 0 0 12px; }
    p { color: #555; margin: 0 0 20px; }
    a { color: #000; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    <p>${body}</p>
    <p><a href="javascript:history.back()">← Back to dashboard</a></p>
  </div>
</body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const membershipId = searchParams.get('membershipId');

  if (!token || !membershipId) {
    return new NextResponse(html('Missing Parameters', 'This approval link is invalid or incomplete.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fetch membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id, status, member_id, group_id')
    .eq('id', membershipId)
    .single() as unknown as { data: { id: string; status: string; member_id: string; group_id: string } | null };

  if (!membership) {
    return new NextResponse(html('Not Found', 'This approval link is invalid.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fetch group host_id
  const { data: group } = await supabase
    .from('groups')
    .select('host_id')
    .eq('id', membership.group_id)
    .single() as unknown as { data: { host_id: string } | null };

  if (!group) {
    return new NextResponse(html('Not Found', 'Group not found.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Verify token matches host
  const { data: hostData } = await supabase
    .from('hosts')
    .select('host_token')
    .eq('id', group.host_id)
    .single() as unknown as { data: { host_token: string } | null };

  if (!hostData || hostData.host_token !== token) {
    return new NextResponse(html('Unauthorized', 'This link is not valid for this group.'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (membership.status === 'accepted') {
    return new NextResponse(html('Already Approved', 'This member has already been approved.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Flip membership to accepted
  const { error: updateError } = await supabase
    .from('memberships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', membershipId);

  if (updateError) {
    return new NextResponse(html('Error', 'Failed to approve member. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fetch member info to send welcome email
  const { data: member } = await supabase
    .from('members')
    .select('name, email')
    .eq('id', membership.member_id)
    .single() as unknown as { data: { name: string; email: string } | null };

  if (member?.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const groupUrl = `https://missiontable.org/group/${membership.group_id}`;
      await resend.emails.send({
        from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
        to: member.email,
        subject: "You've been approved — welcome to your Mission Table group",
        html: `
          <p>Hi ${member.name},</p>
          <p>Great news — your host has approved your request to join the Mission Table group!</p>
          <p>You can view your group page, see who else is in the group, and find the monthly kit here:</p>
          <p>
            <a href="${groupUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;display:inline-block">
              View Your Group →
            </a>
          </p>
          <p>Your host will send a monthly kit before each gathering with a recipe, scripture, and prayer requests. Keep an eye on your inbox!</p>
          <p>— The Mission Table Team</p>
        `,
      });
    } catch (err) {
      console.error('Member welcome email failed:', err);
    }
  }

  const memberName = member?.name ?? 'The member';
  return new NextResponse(
    html('Member Approved ✓', `${memberName} has been approved and sent a welcome email with the group link.`),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
