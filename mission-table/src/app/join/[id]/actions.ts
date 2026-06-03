'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export type JoinGroupResult =
  | { success: true }
  | { success: false; error: string };

const resend = new Resend(process.env.RESEND_API_KEY);

export async function joinGroup(
  groupId: string,
  formData: FormData,
): Promise<JoinGroupResult> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const phone = (formData.get('phone') as string)?.trim();
  const church = (formData.get('church') as string | null)?.trim() || null;
  const city = (formData.get('city') as string | null)?.trim() || null;
  const state = (formData.get('state') as string | null)?.trim() || null;

  if (!name || !email || !phone) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  // Fetch host email from the group (server-side only)
  const { data: groupData } = await supabase
    .from('groups')
    .select('hosts (email, name)')
    .eq('id', groupId)
    .single() as unknown as { data: { hosts: { email: string; name: string } | { email: string; name: string }[] | null } | null };

  const hostRaw = groupData?.hosts;
  const host = Array.isArray(hostRaw) ? hostRaw[0] : hostRaw;

  // Upsert member on email
  const { data: member, error: memberError } = await supabase
    .from('members')
    .upsert({ name, email, phone, church, city, state }, { onConflict: 'email' })
    .select('id')
    .single();

  if (memberError || !member) {
    return { success: false, error: 'Failed to save your info. Please try again.' };
  }

  // Insert membership (status: pending)
  const { error: membershipError } = await supabase.from('memberships').insert({
    group_id: groupId,
    member_id: member.id,
    status: 'pending',
  });

  if (membershipError) {
    return { success: false, error: 'Failed to join group. Please try again.' };
  }

  const locationLine = [city, state].filter(Boolean).join(', ');

  // Email host
  if (host?.email) {
    await resend.emails.send({
      from: 'Mission Table <noreply@missiontable.org>',
      to: host.email,
      subject: `New join request from ${name}`,
      html: `
        <p>Hi ${host.name},</p>
        <p>Someone has requested to join your Mission Table group.</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 16px 4px 0"><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Phone</strong></td><td>${phone}</td></tr>
          ${church ? `<tr><td style="padding:4px 16px 4px 0"><strong>Church</strong></td><td>${church}</td></tr>` : ''}
          ${locationLine ? `<tr><td style="padding:4px 16px 4px 0"><strong>Location</strong></td><td>${locationLine}</td></tr>` : ''}
        </table>
        <p>Please reach out to them within 3 days to welcome them to the group.</p>
      `,
    });
  }

  // Email member confirmation
  await resend.emails.send({
    from: 'Mission Table <noreply@missiontable.org>',
    to: email,
    subject: 'You requested to join a Mission Table group',
    html: `
      <p>Hi ${name},</p>
      <p>Your request to join a Mission Table group has been received. Your host will reach out within 3 days to welcome you.</p>
      <p>If you have any questions in the meantime, email us at <a href="mailto:projectmissiontable@gmail.com">projectmissiontable@gmail.com</a>.</p>
      <p>— The Mission Table Team</p>
    `,
  });

  return { success: true };
}
