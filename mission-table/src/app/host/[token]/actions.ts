'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export async function updateChatLink(groupId: string, chatLink: string | null) {
  const { error } = await supabase
    .from('groups')
    .update({ chat_link: chatLink || null })
    .eq('id', groupId);

  if (error) throw new Error('Failed to update chat link');
}

export async function approveMember(membershipId: string, groupId: string) {
  const { error } = await supabase
    .from('memberships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .eq('group_id', groupId);

  if (error) throw new Error('Failed to approve member');

  // Fetch member info for welcome email
  const { data: membership } = await supabase
    .from('memberships')
    .select('member_id')
    .eq('id', membershipId)
    .single() as unknown as { data: { member_id: string } | null };

  if (!membership) return;

  const { data: member } = await supabase
    .from('members')
    .select('name, email')
    .eq('id', membership.member_id)
    .single() as unknown as { data: { name: string; email: string } | null };

  if (member?.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const groupUrl = `https://missiontable.org/group/${groupId}`;
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
}
