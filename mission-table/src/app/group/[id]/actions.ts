'use server';

import { supabase } from '@/lib/supabase';
import { getMemberIdForToken, isMeetingDatePast } from '@/lib/queries';
import { trackServer } from '@/lib/mixpanelServer';

export async function lookupMemberAccess(
  groupId: string,
  email: string,
): Promise<{ token: string } | { error: string }> {
  const { data: member } = await supabase
    .from('members')
    .select('id, member_token')
    .eq('email', email.toLowerCase().trim())
    .single() as unknown as { data: { id: string; member_token: string } | null };

  if (!member) return { error: 'No membership found for that email.' };

  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('member_id', member.id)
    .eq('status', 'accepted') as unknown as { count: number | null };

  if (!count) return { error: 'No membership found for that email.' };

  return { token: member.member_token };
}

export type ToggleResult =
  | { success: true; active: boolean; count: number }
  | { success: false; error: string };

export async function toggleKitAttendance(token: string, kitId: string): Promise<ToggleResult> {
  const { data: kit } = await supabase
    .from('kits')
    .select('group_id, meeting_date')
    .eq('id', kitId)
    .single() as unknown as { data: { group_id: string; meeting_date: string } | null };

  if (!kit) return { success: false, error: 'Meal not found.' };
  if (!isMeetingDatePast(kit.meeting_date)) {
    return { success: false, error: "You can mark yourself gathered once the gathering date has passed." };
  }

  const memberId = await getMemberIdForToken(kit.group_id, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };

  const { count: existing } = await supabase
    .from('kit_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('kit_id', kitId)
    .eq('member_id', memberId) as unknown as { count: number | null };

  const willBeActive = !existing;

  if (willBeActive) {
    await supabase.from('kit_attendance').insert({ kit_id: kitId, member_id: memberId });
  } else {
    await supabase.from('kit_attendance').delete().eq('kit_id', kitId).eq('member_id', memberId);
  }

  const { count } = await supabase
    .from('kit_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('kit_id', kitId) as unknown as { count: number | null };

  await trackServer('meal_gathered_toggled', token, { group_id: kit.group_id, kit_id: kitId, gathered: willBeActive });

  return { success: true, active: willBeActive, count: count ?? 0 };
}

export async function toggleFieldPostReaction(token: string, postId: string): Promise<ToggleResult> {
  const { data: post } = await supabase
    .from('field_posts')
    .select('group_id')
    .eq('id', postId)
    .single() as unknown as { data: { group_id: string } | null };

  if (!post) return { success: false, error: 'Post not found.' };

  const memberId = await getMemberIdForToken(post.group_id, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };

  const { count: existing } = await supabase
    .from('field_post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('member_id', memberId) as unknown as { count: number | null };

  const willBeActive = !existing;

  if (willBeActive) {
    await supabase.from('field_post_reactions').insert({ post_id: postId, member_id: memberId });
  } else {
    await supabase.from('field_post_reactions').delete().eq('post_id', postId).eq('member_id', memberId);
  }

  const { count } = await supabase
    .from('field_post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId) as unknown as { count: number | null };

  await trackServer('field_post_reaction_toggled', token, { group_id: post.group_id, post_id: postId, reacted: willBeActive });

  return { success: true, active: willBeActive, count: count ?? 0 };
}

export type AddCommentResult =
  | { success: true; comment: { id: string; body: string; created_at: string; member_id: string; memberName: string } }
  | { success: false; error: string };

export async function addFieldPostComment(token: string, postId: string, body: string): Promise<AddCommentResult> {
  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: 'Write something first.' };
  if (trimmed.length > 2000) return { success: false, error: 'Comment is too long.' };

  const { data: post } = await supabase
    .from('field_posts')
    .select('group_id')
    .eq('id', postId)
    .single() as unknown as { data: { group_id: string } | null };

  if (!post) return { success: false, error: 'Post not found.' };

  const memberId = await getMemberIdForToken(post.group_id, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };

  const { data: member } = await supabase
    .from('members')
    .select('name')
    .eq('id', memberId)
    .single() as unknown as { data: { name: string } | null };

  const { data: inserted, error } = await supabase
    .from('field_post_comments')
    .insert({ post_id: postId, member_id: memberId, body: trimmed })
    .select('id, body, created_at, member_id')
    .single() as unknown as { data: { id: string; body: string; created_at: string; member_id: string } | null; error: unknown };

  if (error || !inserted) return { success: false, error: 'Failed to post comment. Please try again.' };

  await trackServer('field_post_comment_added', token, { group_id: post.group_id, post_id: postId });

  return { success: true, comment: { ...inserted, memberName: member?.name ?? 'You' } };
}

export async function deleteFieldPostComment(
  token: string,
  postId: string,
  commentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: post } = await supabase
    .from('field_posts')
    .select('group_id')
    .eq('id', postId)
    .single() as unknown as { data: { group_id: string } | null };

  if (!post) return { success: false, error: 'Post not found.' };

  const memberId = await getMemberIdForToken(post.group_id, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };

  const { data: comment } = await supabase
    .from('field_post_comments')
    .select('member_id')
    .eq('id', commentId)
    .single() as unknown as { data: { member_id: string } | null };

  if (!comment) return { success: false, error: 'Comment not found.' };
  if (comment.member_id !== memberId) return { success: false, error: 'You can only delete your own comment.' };

  await supabase.from('field_post_comments').delete().eq('id', commentId);

  return { success: true };
}
