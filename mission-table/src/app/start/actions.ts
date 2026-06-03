'use server';

import { supabase } from '@/lib/supabase';

export type StartGroupResult =
  | { success: true; countrySlug: string }
  | { success: false; error: string };

export async function startGroup(formData: FormData): Promise<StartGroupResult> {
  const name = formData.get('name') as string;
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

  if (!name || !email || !hostType || !countrySlug || !groupType || !rhythmType || !meetingTime || !timezone || !startDate) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  // Upsert host — reuse existing record if email already exists
  const { data: host, error: hostError } = await supabase
    .from('hosts')
    .upsert({ name, email, phone, host_type: hostType }, { onConflict: 'email' })
    .select('id')
    .single();

  if (hostError || !host) {
    return { success: false, error: `Debug: ${hostError?.message ?? 'host is null'} | url: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) ?? 'missing'}` };
  }

  // end_date stored for future admin use — set far out so groups don't expire
  const start = new Date(startDate);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 50);
  const endDate = end.toISOString().split('T')[0];

  const { error: groupError } = await supabase.from('groups').insert({
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
  });

  if (groupError) {
    return { success: false, error: 'Failed to create group. Please try again.' };
  }

  return { success: true, countrySlug };
}
