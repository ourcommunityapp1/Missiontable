'use server';

import { supabase } from '@/lib/supabase';
import { getHostByToken } from '@/lib/queries';
import { trackServer } from '@/lib/mixpanelServer';

export type CreateFieldPostResult =
  | { success: true }
  | { success: false; error: string };

export async function createFieldPost(
  token: string,
  groupId: string,
  formData: FormData,
): Promise<CreateFieldPostResult> {
  const data = await getHostByToken(token);
  if (!data) return { success: false, error: 'Could not verify your host account.' };

  const group = data.groups.find((g) => g.id === groupId);
  if (!group) return { success: false, error: 'That group was not found on your account.' };

  const authorLabel = (formData.get('author_label') as string)?.trim();
  const body = (formData.get('body') as string)?.trim();
  const photoUrl = (formData.get('photo_url') as string)?.trim() || null;
  const videoUrl = (formData.get('video_url') as string)?.trim() || null;

  if (!authorLabel) return { success: false, error: 'Please add who this update is from.' };
  if (!body) return { success: false, error: 'Please write an update.' };

  const { data: post, error } = await supabase
    .from('field_posts')
    .insert({
      group_id: groupId,
      host_id: data.host.id,
      author_label: authorLabel,
      body,
      photo_url: photoUrl,
      video_url: videoUrl,
    })
    .select('id')
    .single() as unknown as { data: { id: string } | null; error: unknown };

  if (error || !post) return { success: false, error: 'Failed to publish. Please try again.' };

  await trackServer('field_post_created', token, {
    group_id: groupId,
    post_id: post.id,
    has_video: !!videoUrl,
  });

  return { success: true };
}
