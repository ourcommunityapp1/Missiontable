'use server';

import { supabase } from '@/lib/supabase';

export type UpdateKitResult =
  | { success: true }
  | { success: false; error: string };

export async function updateKit(kitId: string, formData: FormData): Promise<UpdateKitResult> {
  const meetingDate = formData.get('meeting_date') as string;
  const recipeName = (formData.get('recipe_name') as string)?.trim() || null;
  const recipeUrl = (formData.get('recipe_url') as string)?.trim() || null;
  const sideDish = (formData.get('side_dish') as string)?.trim() || null;
  const scriptureText = (formData.get('scripture_text') as string)?.trim() || null;
  const scriptureReference = (formData.get('scripture_reference') as string)?.trim() || null;
  const commentary = (formData.get('commentary') as string)?.trim() || null;
  const prayerRequests = (formData.get('prayer_requests') as string)?.trim() || null;
  const gatheringPrompt = (formData.get('gathering_prompt') as string)?.trim() || null;

  if (!meetingDate) {
    return { success: false, error: 'Please select a meeting date.' };
  }

  const { error } = await supabase
    .from('kits')
    .update({
      meeting_date: meetingDate,
      recipe_name: recipeName,
      recipe_url: recipeUrl,
      side_dish: sideDish,
      scripture_text: scriptureText,
      scripture_reference: scriptureReference,
      commentary,
      prayer_requests: prayerRequests,
      gathering_prompt: gatheringPrompt,
    })
    .eq('id', kitId);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A kit already exists for that date.' };
    }
    return { success: false, error: 'Failed to save changes. Please try again.' };
  }

  return { success: true };
}
