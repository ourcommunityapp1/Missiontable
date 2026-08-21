'use server';

import { supabase } from '@/lib/supabase';
import { getMembersForGroup } from '@/lib/queries';
import { esc } from '@/lib/escapeHtml';
import { trackServer } from '@/lib/mixpanelServer';
import type { KitRow } from '@/lib/database.types';
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
    .select('name, email, member_token')
    .eq('id', membership.member_id)
    .single() as unknown as { data: { name: string; email: string; member_token: string } | null };

  if (member?.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const groupUrl = `https://missiontable.org/group/${groupId}?token=${member.member_token}`;
      await resend.emails.send({
        from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
        to: member.email,
        subject: "You've been approved — welcome to your Mission Table group",
        html: `
          <p>Hi ${esc(member.name)},</p>
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
      await trackServer('member_approved', member.member_token, { group_id: groupId });
    } catch (err) {
      console.error('Member welcome email failed:', err);
    }
  }
}

export async function resendKit(kitId: string, groupId: string, groupDisplayName: string) {
  const { data: kit } = await supabase
    .from('kits')
    .select('*')
    .eq('id', kitId)
    .single() as unknown as { data: KitRow | null };

  if (!kit) throw new Error('Kit not found');

  const { data: groupData } = await supabase
    .from('groups')
    .select('hosts (email)')
    .eq('id', groupId)
    .single() as unknown as { data: { hosts: { email: string } | { email: string }[] | null } | null };

  const hostRaw = groupData?.hosts;
  const hostEmail = (Array.isArray(hostRaw) ? hostRaw[0] : hostRaw)?.email ?? null;

  const members = await getMembersForGroup(groupId);
  if (members.accepted.length === 0 && !hostEmail) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dateLabel = new Date(kit.meeting_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function buildHtml(k: KitRow, groupUrl: string) {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
        <h2 style="font-size:24px;margin-bottom:4px">${esc(groupDisplayName)} — ${dateLabel} Kit</h2>
        <p style="color:#888;margin-top:0;margin-bottom:20px">Your monthly gathering kit is ready.</p>

        <div style="border:2px solid #000;padding:20px;margin-bottom:32px;background:#FBF9F4">
          <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.5">
            Your group page is where you can see who else is gathering with you, find this kit anytime, and receive future kits from your host.
          </p>
          <a href="${groupUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;font-size:14px;display:inline-block;letter-spacing:0.05em">
            VIEW YOUR GROUP PAGE →
          </a>
        </div>

        ${k.recipe_name ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:0">Recipe</h3>
        <p style="margin:4px 0">${k.recipe_url ? `<a href="${esc(k.recipe_url)}" style="color:#000;font-weight:bold">${esc(k.recipe_name)}</a>` : esc(k.recipe_name)}</p>
        ${k.side_dish ? `<p style="color:#555;font-size:14px">Side dish: ${esc(k.side_dish)}</p>` : ''}
        ` : ''}

        ${k.scripture_text ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Scripture</h3>
        <blockquote style="border-left:3px solid #000;margin:8px 0;padding:0 0 0 16px;font-style:italic;color:#333">${esc(k.scripture_text)}</blockquote>
        ${k.scripture_reference ? `<p style="font-size:13px;color:#555;margin-top:4px">— ${esc(k.scripture_reference)}</p>` : ''}
        ` : ''}

        ${k.commentary ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Commentary</h3>
        <p style="white-space:pre-line">${esc(k.commentary)}</p>
        ` : ''}

        ${k.prayer_requests ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Prayer Requests</h3>
        <p style="white-space:pre-line">${esc(k.prayer_requests)}</p>
        ` : ''}

        ${k.gathering_prompt ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Gathering Prompt</h3>
        <p style="white-space:pre-line">${esc(k.gathering_prompt)}</p>
        ` : ''}
      </div>
    `;
  }

  try {
    for (const member of members.accepted) {
      const memberGroupUrl = `https://missiontable.org/group/${groupId}?token=${member.member_token}`;
      await resend.emails.send({
        from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
        to: member.email,
        subject: `${groupDisplayName} — ${dateLabel} Kit`,
        html: buildHtml(kit, memberGroupUrl),
      });
      await trackServer('kit_email_sent', member.member_token, {
        group_id: groupId,
        kit_id: kitId,
        meeting_date: kit.meeting_date,
        resend: true,
      });
    }
    if (hostEmail) {
      await resend.emails.send({
        from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
        to: hostEmail,
        subject: `[Your copy] ${groupDisplayName} — ${dateLabel} Kit`,
        html: buildHtml(kit, `https://missiontable.org/group/${groupId}`),
      });
    }
  } catch (err) {
    console.error('Kit resend failed:', err);
  }
}
