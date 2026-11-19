'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getMemberIdForToken, getMembersForGroup } from '@/lib/queries';
import { trackServer } from '@/lib/mixpanelServer';
import {
  SITE_URL, gatheringOnOrAfter, gatheringBefore, localNow, sendEmail, inviteEmailHtml, inviteResponseHtml, type Rhythm,
} from '@/lib/gathering';
import { getMemberProfile, getInviteForMember } from '@/lib/memberApp';
import { placeLabel, bestChurchLabel } from '@/lib/people';
import { esc } from '@/lib/escapeHtml';
import type { MealInviteRow } from '@/lib/database.types';

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

type GroupForLoop = Rhythm & { id: string; name: string | null; timezone: string; country_slug: string };

async function loadGroup(groupId: string): Promise<GroupForLoop | null> {
  const { data } = await supabase
    .from('groups')
    .select('id, name, timezone, country_slug, rhythm_type, day_of_month, week_of_month, day_of_week')
    .eq('id', groupId)
    .eq('status', 'active')
    .maybeSingle() as unknown as { data: GroupForLoop | null };
  return data;
}

function clean(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────

export async function setRsvp(token: string, groupId: string, date: string, status: 'in' | 'out'): Promise<Result<{ inCount: number }>> {
  if (status !== 'in' && status !== 'out') return { success: false, error: 'Invalid answer.' };
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const group = await loadGroup(groupId);
  if (!group) return { success: false, error: 'Group not found.' };

  // Only the upcoming gathering can be answered.
  const today = localNow(group.timezone).date;
  const next = gatheringOnOrAfter(group, today);
  if (!next || date !== next) return { success: false, error: 'That gathering has already happened.' };

  const { error } = await supabase
    .from('gathering_rsvps')
    .upsert({ group_id: groupId, member_id: memberId, meeting_date: date, status, responded_at: new Date().toISOString() }, { onConflict: 'group_id,member_id,meeting_date' });
  if (error) return { success: false, error: 'Could not save your answer. Please try again.' };

  const { count } = await supabase
    .from('gathering_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId).eq('meeting_date', date).eq('status', 'in') as unknown as { count: number | null };

  await trackServer('gathering_rsvp_set', token, { group_id: groupId, meeting_date: date, status });
  // No revalidatePath: the page applies the result itself, and a refresh would restore the email-link URL.
  return { success: true, inCount: count ?? 0 };
}

// ─── Our table ────────────────────────────────────────────────────────────────

const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function saveTablePost(token: string, groupId: string, formData: FormData): Promise<Result> {
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const group = await loadGroup(groupId);
  if (!group) return { success: false, error: 'Group not found.' };

  // Posts belong to today's gathering if there is one, otherwise the most recent one.
  const today = localNow(group.timezone).date;
  const todays = gatheringOnOrAfter(group, today);
  const date = todays === today ? today : gatheringBefore(group, today);
  if (!date) return { success: false, error: 'There is no gathering to share yet.' };

  const prayer = clean(formData.get('prayer'), 280);
  const photo = formData.get('photo');
  const hasPhoto = photo instanceof File && photo.size > 0;
  if (!prayer && !hasPhoto && !formData.has('prayer')) return { success: false, error: 'Add a photo or a line of prayer.' };

  const { data: existing } = await supabase
    .from('table_posts').select('id, photo_path').eq('group_id', groupId).eq('member_id', memberId).eq('meeting_date', date)
    .maybeSingle() as unknown as { data: { id: string; photo_path: string | null } | null };

  let photoPath = existing?.photo_path ?? null;
  if (hasPhoto) {
    const file = photo as File;
    const ext = PHOTO_TYPES[file.type];
    if (!ext) return { success: false, error: 'Photos must be JPEG, PNG or WebP.' };
    if (file.size > 5 * 1024 * 1024) return { success: false, error: 'That photo is too large (5 MB max).' };
    const path = `${groupId}/${randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('table-photos').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (upErr) {
      console.error('Table photo upload failed:', upErr);
      return { success: false, error: 'Could not upload your photo. Please try again.' };
    }
    if (existing?.photo_path) await supabase.storage.from('table-photos').remove([existing.photo_path]);
    photoPath = path;
  }

  if (!prayer && !photoPath) return { success: false, error: 'Add a photo or a line of prayer.' };
  const row = { group_id: groupId, member_id: memberId, meeting_date: date, photo_path: photoPath, prayer };
  const { error } = await supabase.from('table_posts').upsert(row, { onConflict: 'group_id,member_id,meeting_date' });
  if (error) return { success: false, error: 'Could not share your table. Please try again.' };

  await trackServer('table_post_shared', token, { group_id: groupId, meeting_date: date, has_photo: !!photoPath, has_prayer: !!prayer });
  revalidatePath(`/group/${groupId}`);
  return { success: true };
}

// ─── Eat together ─────────────────────────────────────────────────────────────

export type InviteInput = {
  placeType: 'home' | 'restaurant';
  placeName?: string; addressLine?: string; city?: string; state?: string; zip?: string;
  arriveTime?: string; food?: 'cook' | 'potluck' | 'order' | ''; seats?: number; note?: string;
  guestIds: string[];
};

export async function createInvite(token: string, groupId: string, input: InviteInput): Promise<Result<{ inviteId: string; sent: number }>> {
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const group = await loadGroup(groupId);
  if (!group) return { success: false, error: 'Group not found.' };

  const date = gatheringOnOrAfter(group, localNow(group.timezone).date);
  if (!date) return { success: false, error: 'There is no upcoming gathering.' };

  const { data: existing } = await supabase
    .from('meal_invites').select('id').eq('group_id', groupId).eq('inviter_member_id', memberId)
    .eq('meeting_date', date).is('cancelled_at', null).limit(1) as unknown as { data: { id: string }[] | null };
  if (existing?.length) return { success: false, error: 'You already have an invitation for this gathering. Open it to invite more people.' };

  const placeType = input.placeType === 'restaurant' ? 'restaurant' : 'home';
  const placeName = clean(input.placeName, 120);
  const addressLine = clean(input.addressLine, 160);
  const city = clean(input.city, 80);
  if (placeType === 'restaurant' && !placeName) return { success: false, error: 'Add the restaurant name.' };
  if (!addressLine || !city) return { success: false, error: 'Add the street address and city.' };

  const { accepted } = await getMembersForGroup(groupId);
  const validIds = new Set(accepted.map((m) => m.id));
  const guestIds = [...new Set(input.guestIds ?? [])].filter((id) => id !== memberId && validIds.has(id));
  if (guestIds.length === 0) return { success: false, error: 'Choose at least one person to invite.' };
  if (guestIds.length > 30) return { success: false, error: 'You can invite up to 30 people.' };

  const seats = Number.isFinite(input.seats) ? Math.max(1, Math.min(50, Math.round(Number(input.seats)))) : null;
  const food = input.food === 'cook' || input.food === 'potluck' || input.food === 'order' ? input.food : null;

  const { data: inv, error } = await supabase.from('meal_invites').insert({
    group_id: groupId,
    inviter_member_id: memberId,
    meeting_date: date,
    place_type: placeType,
    place_name: placeType === 'restaurant' ? placeName : null,
    address_line: addressLine,
    city,
    state: clean(input.state, 40),
    zip: clean(input.zip, 12),
    arrive_time: clean(input.arriveTime, 20),
    food,
    seats,
    note: clean(input.note, 600),
  }).select('*').single() as unknown as { data: MealInviteRow | null; error: unknown };
  if (error || !inv) return { success: false, error: 'Could not create your invitation. Please try again.' };

  const { error: gErr } = await supabase.from('meal_invite_guests').insert(guestIds.map((id) => ({ invite_id: inv.id, member_id: id })));
  if (gErr) {
    await supabase.from('meal_invites').delete().eq('id', inv.id);
    return { success: false, error: 'Could not create your invitation. Please try again.' };
  }

  const sent = await emailInvitedGuests(group, inv, memberId, accepted, guestIds);

  await trackServer('meal_invite_sent', token, { group_id: groupId, invite_id: inv.id, guests: guestIds.length, place_type: placeType });
  revalidatePath(`/group/${groupId}`);
  return { success: true, inviteId: inv.id, sent };
}

type AcceptedMember = Awaited<ReturnType<typeof getMembersForGroup>>['accepted'][number];

async function emailInvitedGuests(group: GroupForLoop, inv: MealInviteRow, inviterId: string, accepted: AcceptedMember[], guestIds: string[]): Promise<number> {
  const inviter = await getMemberProfile(inviterId);
  const allChurches = accepted.map((m) => m.church);
  const inviterMeta = [placeLabel(inviter?.city ?? null, inviter?.state ?? null), bestChurchLabel(inviter?.church, allChurches)].filter(Boolean).join(' · ');
  const groupName = group.name ?? 'Your Mission Table group';
  let sent = 0;
  for (const m of accepted.filter((a) => guestIds.includes(a.id))) {
    const ok = await sendEmail({
      to: m.email,
      replyTo: inviter?.email,
      subject: `${inviter?.name ?? 'A member'} invited you to eat together on ${new Date(`${inv.meeting_date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`,
      html: inviteEmailHtml({
        groupName,
        inviterName: inviter?.name ?? 'A member',
        inviterMeta,
        inv,
        detailsUrl: `${SITE_URL}/group/${inv.group_id}/invites/${inv.id}?token=${m.member_token}`,
      }),
    });
    if (ok) sent += 1;
  }
  return sent;
}

export async function addInviteGuests(token: string, groupId: string, inviteId: string, guestIds: string[]): Promise<Result<{ added: number }>> {
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const group = await loadGroup(groupId);
  if (!group) return { success: false, error: 'Group not found.' };
  const inv = await getInviteForMember(inviteId, memberId);
  if (!inv || inv.group_id !== groupId || inv.inviter_member_id !== memberId) return { success: false, error: 'Invitation not found.' };
  if (inv.cancelled_at) return { success: false, error: 'This invitation was cancelled.' };

  const { accepted } = await getMembersForGroup(groupId);
  const already = new Set(inv.guests.map((g) => g.memberId));
  const valid = new Set(accepted.map((m) => m.id));
  const ids = [...new Set(guestIds ?? [])].filter((id) => id !== memberId && valid.has(id) && !already.has(id));
  if (ids.length === 0) return { success: false, error: 'Choose at least one new person to invite.' };
  if (already.size + ids.length > 30) return { success: false, error: 'You can invite up to 30 people.' };

  const { error } = await supabase.from('meal_invite_guests').insert(ids.map((id) => ({ invite_id: inviteId, member_id: id })));
  if (error) return { success: false, error: 'Could not add people. Please try again.' };
  const { data: row } = await supabase.from('meal_invites').select('*').eq('id', inviteId).single() as unknown as { data: MealInviteRow };
  await emailInvitedGuests(group, row, memberId, accepted, ids);
  await trackServer('meal_invite_guests_added', token, { group_id: groupId, invite_id: inviteId, guests: ids.length });
  revalidatePath(`/group/${groupId}`);
  return { success: true, added: ids.length };
}

export async function respondToInvite(token: string, groupId: string, inviteId: string, status: 'accepted' | 'declined'): Promise<Result> {
  if (status !== 'accepted' && status !== 'declined') return { success: false, error: 'Invalid answer.' };
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const inv = await getInviteForMember(inviteId, memberId);
  if (!inv || inv.group_id !== groupId || inv.myStatus === null) return { success: false, error: 'Invitation not found.' };
  if (inv.cancelled_at) return { success: false, error: 'This invitation was cancelled.' };

  const { error } = await supabase
    .from('meal_invite_guests')
    .update({ status, responded_at: new Date().toISOString(), seen_at: new Date().toISOString() })
    .eq('invite_id', inviteId).eq('member_id', memberId);
  if (error) return { success: false, error: 'Could not save your answer. Please try again.' };

  if (inv.myStatus !== status && inv.inviter.email) {
    const me = await getMemberProfile(memberId);
    const inviterProfile = await getMemberProfile(inv.inviter_member_id);
    if (inviterProfile) {
      await sendEmail({
        to: inviterProfile.email,
        replyTo: me?.email,
        subject: `${me?.name ?? 'A guest'} ${status === 'accepted' ? 'is coming' : "can't make it"} on ${new Date(`${inv.meeting_date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`,
        html: inviteResponseHtml({
          guestName: me?.name ?? 'A guest',
          accepted: status === 'accepted',
          date: inv.meeting_date,
          detailsUrl: `${SITE_URL}/group/${groupId}/invites/${inviteId}?token=${inviterProfile.member_token}`,
        }),
      });
    }
  }

  await trackServer('meal_invite_responded', token, { group_id: groupId, invite_id: inviteId, status });
  revalidatePath(`/group/${groupId}`);
  return { success: true };
}

export async function markInvitesSeen(token: string, groupId: string, inviteIds: string[]): Promise<Result> {
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  if (!inviteIds.length) return { success: true };
  await supabase
    .from('meal_invite_guests')
    .update({ seen_at: new Date().toISOString() })
    .eq('member_id', memberId)
    .in('invite_id', inviteIds.slice(0, 20))
    .is('seen_at', null);
  return { success: true };
}

export async function cancelInvite(token: string, groupId: string, inviteId: string): Promise<Result> {
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const inv = await getInviteForMember(inviteId, memberId);
  if (!inv || inv.group_id !== groupId || inv.inviter_member_id !== memberId) return { success: false, error: 'Invitation not found.' };
  if (inv.cancelled_at) return { success: true };
  await supabase.from('meal_invites').update({ cancelled_at: new Date().toISOString() }).eq('id', inviteId);

  const people = await getMembersForGroup(groupId);
  for (const g of inv.guests.filter((x) => x.status !== 'declined')) {
    const m = people.accepted.find((a) => a.id === g.memberId);
    if (!m) continue;
    await sendEmail({
      to: m.email,
      subject: `${inv.inviter.name} cancelled the dinner invitation`,
      html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1C1B1B"><p style="font-size:17px">${esc(inv.inviter.name)} cancelled their invitation to eat together. You can still gather at your own table at the usual time.</p></div>`,
    });
  }
  await trackServer('meal_invite_cancelled', token, { group_id: groupId, invite_id: inviteId });
  revalidatePath(`/group/${groupId}`);
  return { success: true };
}

// ─── The installed app ────────────────────────────────────────────────────────

/** Called when a member opens the group from their home screen. */
export async function recordAppOpen(token: string, groupId: string, platform: string): Promise<Result> {
  const memberId = await getMemberIdForToken(groupId, token);
  if (!memberId) return { success: false, error: 'Could not verify your membership.' };
  const plat = ['ios', 'android', 'desktop', 'other'].includes(platform) ? platform : 'other';
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('member_app_opens')
    .select('opens')
    .eq('group_id', groupId)
    .eq('member_id', memberId)
    .maybeSingle() as unknown as { data: { opens: number } | null };
  if (existing) {
    await supabase.from('member_app_opens').update({ last_opened_at: now, opens: existing.opens + 1, platform: plat }).eq('group_id', groupId).eq('member_id', memberId);
  } else {
    await supabase.from('member_app_opens').insert({ group_id: groupId, member_id: memberId, platform: plat });
  }
  await trackServer('group_app_opened', token, { group_id: groupId, first_open: !existing, platform: plat });
  return { success: true };
}
