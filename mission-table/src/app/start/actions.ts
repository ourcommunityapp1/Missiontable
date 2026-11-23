'use server';

import { supabase } from '@/lib/supabase';
import { esc } from '@/lib/escapeHtml';
import { Resend } from 'resend';
import { notifyAdmins } from '@/lib/admin';
import { countries } from '@/data/countries';

export type StartGroupResult =
  | { success: true; countrySlug: string }
  | { success: false; error: string };

export async function startGroup(formData: FormData): Promise<StartGroupResult> {
  const name = formData.get('name') as string;
  const groupName = (formData.get('group_name') as string)?.trim() || null;
  const email = formData.get('email') as string;
  const phone = (formData.get('phone') as string) || null;
  const hostType = formData.get('host_type') as 'individual' | 'church' | 'organization';
  const countrySlug = formData.get('country_slug') as string;
  const groupType = formData.get('group_type') as 'in-person' | 'virtual';
  const city = (formData.get('city') as string | null)?.trim() || null;
  const state = (formData.get('state') as string | null)?.trim() || null;
  const rhythmType = formData.get('rhythm_type') as 'date_of_month' | 'day_of_week_pattern';
  const dayOfMonthRaw = (formData.get('day_of_month') as string | null)?.trim();
  const dayOfMonth = dayOfMonthRaw ? parseInt(dayOfMonthRaw) : null;
  const weekOfMonthRaw = (formData.get('week_of_month') as string | null)?.trim();
  const weekOfMonth = weekOfMonthRaw ? parseInt(weekOfMonthRaw) : null;
  const dayOfWeek = (formData.get('day_of_week') as string | null)?.trim() || null;
  const meetingTime = formData.get('meeting_time') as string;
  const timezone = formData.get('timezone') as string;
  const maxSize = formData.get('max_size') ? parseInt(formData.get('max_size') as string) : null;
  const startDate = formData.get('start_date') as string;

  if (!name || !email || !groupName || !hostType || !countrySlug || !groupType || !rhythmType || !meetingTime || !timezone || !startDate) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  // Upsert host — reuse existing record if email already exists
  const { data: host, error: hostError } = await supabase
    .from('hosts')
    .upsert({ name, email, phone, host_type: hostType }, { onConflict: 'email' })
    .select('id, host_token')
    .single() as unknown as { data: { id: string; host_token: string } | null; error: unknown };

  if (hostError || !host) {
    return { success: false, error: 'Failed to save host info. Please try again.' };
  }

  // end_date stored for future admin use — set far out so groups don't expire
  const start = new Date(startDate);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 50);
  const endDate = end.toISOString().split('T')[0];

  const { data: group, error: groupError } = await supabase.from('groups').insert({
    name: groupName,
    country_slug: countrySlug,
    host_id: host.id,
    group_type: groupType,
    city,
    state,
    rhythm_type: rhythmType,
    day_of_month: dayOfMonth,
    week_of_month: weekOfMonth,
    day_of_week: dayOfWeek,
    meeting_time: meetingTime,
    timezone,
    max_size: maxSize,
    start_date: startDate,
    end_date: endDate,
    status: 'pending',
  }).select('id').single();

  if (groupError || !group) {
    return { success: false, error: 'Failed to create group. Please try again.' };
  }

  // Send emails — errors are caught so a mail failure never blocks submission
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dashboardUrl = `https://missiontable.org/host/${host.host_token}`;

    await resend.emails.send({
      from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
      to: email,
      subject: 'Your Mission Table group has been submitted',
      html: `
        <p>Hi ${esc(name)},</p>
        <p>Thank you for submitting your Mission Table group! A Mission Table admin reviews every new group, usually within 2 days, and we'll email you as soon as it's live.</p>
        <p>Once it's live, your group is listed on its country page and people can ask to join.</p>
        <p><strong>Bookmark your host dashboard link:</strong></p>
        <p>
          <a href="${dashboardUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;display:inline-block">
            Open Your Host Dashboard →
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:16px">
          This link is your private dashboard — save it. You'll use it to approve members and send monthly kits.
        </p>
        <p>— The Mission Table Team</p>
      `,
    });
  } catch (err) {
    console.error('Host confirmation email failed:', err);
  }

  // Notify every admin, each with a link to their own dashboard (approve or decline there).
  try {
    const countryName = countries.find((c) => c.slug === countrySlug)?.name ?? countrySlug;
    const sent = await notifyAdmins(`New group waiting for approval: ${groupName ?? countryName}`, (dashboardUrl) => `
      <p>A new group was submitted and is waiting for review.</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 16px 4px 0"><strong>Group</strong></td><td>${esc(groupName ?? '(no name)')}</td></tr>
        <tr><td style="padding:4px 16px 4px 0"><strong>Country</strong></td><td>${esc(countryName)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0"><strong>Host</strong></td><td>${esc(name)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0"><strong>Host email</strong></td><td>${esc(email)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0"><strong>Type</strong></td><td>${esc(groupType)}</td></tr>
        ${city ? `<tr><td style="padding:4px 16px 4px 0"><strong>Location</strong></td><td>${esc(city)}${state ? `, ${esc(state)}` : ''}</td></tr>` : ''}
      </table>
      <br>
      <a href="${dashboardUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;display:inline-block">
        Review in your admin dashboard →
      </a>
      <p style="color:#888;font-size:12px;margin-top:16px">The host was told we usually review within 2 days.</p>
    `);
    if (sent === 0) console.error('Admin notification: no email could be sent for group', group.id);
  } catch (err) {
    console.error('Admin notification email failed:', err);
  }

  return { success: true, countrySlug };
}
