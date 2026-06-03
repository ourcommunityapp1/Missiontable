'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

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
    .select('id')
    .single();

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

  // Notify admin — errors are caught so a mail failure never blocks submission
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const approveUrl = `https://missiontable.org/api/admin/approve?token=${process.env.ADMIN_APPROVE_SECRET}&groupId=${group.id}`;

    await resend.emails.send({
      from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
      to: 'projectmissiontable@gmail.com',
      subject: `New group pending approval: ${groupName}`,
      html: `
        <p>A new group has been submitted and is waiting for your approval.</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 16px 4px 0"><strong>Group Name</strong></td><td>${groupName}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Country</strong></td><td>${countrySlug}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Host</strong></td><td>${name}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Host Email</strong></td><td>${email}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Type</strong></td><td>${groupType}</td></tr>
          ${city ? `<tr><td style="padding:4px 16px 4px 0"><strong>Location</strong></td><td>${city}${state ? `, ${state}` : ''}</td></tr>` : ''}
        </table>
        <br>
        <a href="${approveUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;display:inline-block">
          Approve This Group →
        </a>
        <p style="color:#888;font-size:12px;margin-top:16px">
          Only click if you've reviewed this submission. The group will go live immediately.
        </p>
      `,
    });
  } catch (err) {
    console.error('Admin notification email failed:', err);
  }

  return { success: true, countrySlug };
}
