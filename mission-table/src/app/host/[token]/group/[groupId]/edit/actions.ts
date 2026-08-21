'use server';

import { supabase } from '@/lib/supabase';
import type { RhythmType } from '@/lib/database.types';

export type UpdateGroupResult =
  | { success: true }
  | { success: false; error: string };

export async function updateGroup(
  groupId: string,
  formData: FormData,
): Promise<UpdateGroupResult> {
  const name = (formData.get('name') as string)?.trim() || null;
  const city = (formData.get('city') as string)?.trim() || null;
  const state = (formData.get('state') as string)?.trim() || null;
  const rhythmType = formData.get('rhythm_type') as RhythmType;
  const dayOfMonthRaw = (formData.get('day_of_month') as string)?.trim();
  const dayOfMonth = dayOfMonthRaw ? parseInt(dayOfMonthRaw) : null;
  const weekOfMonthRaw = (formData.get('week_of_month') as string)?.trim();
  const weekOfMonth = weekOfMonthRaw ? parseInt(weekOfMonthRaw) : null;
  const dayOfWeek = (formData.get('day_of_week') as string)?.trim() || null;
  const meetingTime = (formData.get('meeting_time') as string)?.trim();
  const timezone = (formData.get('timezone') as string)?.trim();
  const maxSizeRaw = (formData.get('max_size') as string)?.trim();
  const maxSize = maxSizeRaw ? parseInt(maxSizeRaw) : null;
  const startDate = (formData.get('start_date') as string)?.trim();

  if (!rhythmType || !meetingTime || !timezone || !startDate) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  const { error } = await supabase
    .from('groups')
    .update({
      name,
      city,
      state,
      rhythm_type: rhythmType,
      day_of_month: rhythmType === 'date_of_month' ? dayOfMonth : null,
      week_of_month: rhythmType === 'day_of_week_pattern' ? weekOfMonth : null,
      day_of_week: rhythmType === 'day_of_week_pattern' ? dayOfWeek : null,
      meeting_time: meetingTime,
      timezone,
      max_size: maxSize,
      start_date: startDate,
    })
    .eq('id', groupId);

  if (error) return { success: false, error: 'Failed to save changes. Please try again.' };
  return { success: true };
}
