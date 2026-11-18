import 'server-only';
import { supabase } from './supabase';
import { tablePhotoUrl } from './gathering';
import type { MealInviteRow, MealInviteGuestRow, MealInviteGuestStatus } from './database.types';

export type MemberProfile = {
  id: string; name: string; email: string; member_token: string;
  city: string | null; state: string | null; church: string | null;
};

export async function getMemberProfile(memberId: string): Promise<MemberProfile | null> {
  const { data } = await supabase
    .from('members')
    .select('id, name, email, member_token, city, state, church')
    .eq('id', memberId)
    .maybeSingle() as unknown as { data: MemberProfile | null };
  return data;
}

export async function getMemberProfiles(ids: string[]): Promise<Map<string, MemberProfile>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('members')
    .select('id, name, email, member_token, city, state, church')
    .in('id', ids) as unknown as { data: MemberProfile[] | null };
  return new Map((data ?? []).map((m) => [m.id, m]));
}

export type TablePostView = {
  id: string; memberId: string; memberName: string; place: string;
  meetingDate: string; photoUrl: string | null; prayer: string | null; createdAt: string;
};

export async function getTablePosts(groupId: string): Promise<TablePostView[]> {
  const { data } = await supabase
    .from('table_posts')
    .select('*')
    .eq('group_id', groupId)
    .order('meeting_date', { ascending: false })
    .order('created_at', { ascending: true }) as unknown as {
      data: { id: string; member_id: string; meeting_date: string; photo_path: string | null; prayer: string | null; created_at: string }[] | null;
    };
  const rows = data ?? [];
  const people = await getMemberProfiles([...new Set(rows.map((r) => r.member_id))]);
  return rows.map((r) => {
    const m = people.get(r.member_id);
    return {
      id: r.id,
      memberId: r.member_id,
      memberName: m?.name ?? 'A member',
      place: [m?.city, m?.state].filter(Boolean).join(', '),
      meetingDate: r.meeting_date,
      photoUrl: tablePhotoUrl(r.photo_path),
      prayer: r.prayer,
      createdAt: r.created_at,
    };
  });
}

export type InviteGuestView = { memberId: string; name: string; status: MealInviteGuestStatus };
export type InviteView = MealInviteRow & {
  inviter: { id: string; name: string; city: string | null; state: string | null; church: string | null; email: string };
  guests: InviteGuestView[];
  myStatus: MealInviteGuestStatus | null; // null when I'm the inviter
  mySeen: boolean;
};

async function hydrate(invites: MealInviteRow[], memberId: string): Promise<InviteView[]> {
  if (invites.length === 0) return [];
  const { data: guestRows } = await supabase
    .from('meal_invite_guests')
    .select('*')
    .in('invite_id', invites.map((i) => i.id)) as unknown as { data: MealInviteGuestRow[] | null };
  const guests = guestRows ?? [];
  const people = await getMemberProfiles([...new Set([...invites.map((i) => i.inviter_member_id), ...guests.map((g) => g.member_id)])]);
  return invites.map((inv) => {
    const mine = guests.find((g) => g.invite_id === inv.id && g.member_id === memberId);
    const inviter = people.get(inv.inviter_member_id);
    return {
      ...inv,
      inviter: {
        id: inv.inviter_member_id,
        name: inviter?.name ?? 'A member',
        city: inviter?.city ?? null,
        state: inviter?.state ?? null,
        church: inviter?.church ?? null,
        email: inviter?.email ?? '',
      },
      guests: guests
        .filter((g) => g.invite_id === inv.id)
        .map((g) => ({ memberId: g.member_id, name: people.get(g.member_id)?.name ?? 'A member', status: g.status })),
      myStatus: mine ? mine.status : null,
      mySeen: !!mine?.seen_at,
    };
  });
}

/** Invitations this member sent or received in a group, for gatherings from `fromDate` on. */
export async function getInvitesForMember(groupId: string, memberId: string, fromDate: string): Promise<{ received: InviteView[]; sent: InviteView[] }> {
  const { data: mineAsGuest } = await supabase
    .from('meal_invite_guests')
    .select('invite_id')
    .eq('member_id', memberId) as unknown as { data: { invite_id: string }[] | null };
  const guestInviteIds = (mineAsGuest ?? []).map((g) => g.invite_id);

  const { data: invites } = await supabase
    .from('meal_invites')
    .select('*')
    .eq('group_id', groupId)
    .gte('meeting_date', fromDate)
    .order('created_at', { ascending: false }) as unknown as { data: MealInviteRow[] | null };
  const relevant = (invites ?? []).filter((i) => i.inviter_member_id === memberId || guestInviteIds.includes(i.id));
  const views = await hydrate(relevant, memberId);
  return {
    received: views.filter((v) => v.inviter_member_id !== memberId && !v.cancelled_at),
    sent: views.filter((v) => v.inviter_member_id === memberId),
  };
}

/** One invitation, only if this member is its inviter or a guest. */
export async function getInviteForMember(inviteId: string, memberId: string): Promise<InviteView | null> {
  const { data: inv } = await supabase.from('meal_invites').select('*').eq('id', inviteId).maybeSingle() as unknown as { data: MealInviteRow | null };
  if (!inv) return null;
  const [view] = await hydrate([inv], memberId);
  if (view.inviter_member_id !== memberId && view.myStatus === null) return null;
  return view;
}
