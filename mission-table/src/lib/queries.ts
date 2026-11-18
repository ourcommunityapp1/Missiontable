import { supabase } from './supabase';
import { countries } from '@/data/countries';
import type { KitRow, FieldPostRow, FieldPostReactionRow, FieldPostCommentRow } from './database.types';

export type FeaturedCountry = {
  name: string;
  slug: string;
  region: string;
  image: string;
  groupCount: number;
  bg: string;
};

const COUNTRY_BG: Record<string, string> = {
  spain: '#E6DFD1',
  china: '#EAE8E3',
  guatemala: '#E4E2DD',
  'north-korea': '#E8E4DF',
};

const FALLBACK_SLUGS = ['spain', 'china', 'guatemala'];

export type SearchableGroup = {
  id: string;
  name: string;
  hostedBy: string;
  countrySlug: string;
  countryName: string;
  groupType: 'in-person' | 'virtual';
};

export async function getAllGroupsForSearch(): Promise<SearchableGroup[]> {
  const { data } = await supabase
    .from('groups')
    .select(`id, name, group_type, country_slug, hosts!groups_host_id_fkey (name)`)
    .eq('status', 'active') as unknown as {
      data: {
        id: string;
        name: string | null;
        group_type: string;
        country_slug: string;
        hosts: { name: string } | { name: string }[] | null;
      }[] | null;
    };

  if (!data) return [];

  return data.map((row) => {
    const host = Array.isArray(row.hosts) ? row.hosts[0] : row.hosts;
    const country = countries.find((c) => c.slug === row.country_slug);
    return {
      id: row.id,
      name: row.name ?? host?.name ?? 'Unnamed Group',
      hostedBy: host?.name ?? '',
      countrySlug: row.country_slug,
      countryName: country?.name ?? row.country_slug,
      groupType: row.group_type as 'in-person' | 'virtual',
    };
  });
}

export async function getFeaturedCountries(limit = 3): Promise<FeaturedCountry[]> {
  const { data } = await supabase
    .from('groups')
    .select('country_slug')
    .eq('status', 'active') as unknown as { data: { country_slug: string }[] | null };

  // Count groups per country
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.country_slug] = (counts[row.country_slug] ?? 0) + 1;
  }

  // Countries with at least one group, sorted by count desc
  const withGroups = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({ slug, count }));

  // Build the featured list — countries with groups first, then fallbacks
  const seen = new Set<string>();
  const candidates: { slug: string; count: number }[] = [];

  for (const { slug, count } of withGroups) {
    if (countries.find((c) => c.slug === slug)) {
      candidates.push({ slug, count });
      seen.add(slug);
    }
  }

  for (const slug of FALLBACK_SLUGS) {
    if (!seen.has(slug) && candidates.length < limit) {
      candidates.push({ slug, count: 0 });
      seen.add(slug);
    }
  }

  return candidates.slice(0, limit).map(({ slug, count }) => {
    const country = countries.find((c) => c.slug === slug)!;
    return {
      name: country.name,
      slug: country.slug,
      region: country.region,
      image: country.image,
      groupCount: count,
      bg: COUNTRY_BG[slug] ?? '#EAE8E3',
    };
  });
}

export type DisplayGroup = {
  id: string;
  name: string | null;
  hostedBy: string;
  groupType: 'in-person' | 'virtual';
  city: string | null;
  state: string | null;
  rhythm: string;
  time: string;
  memberCount: number;
  maxSize: number | null;
};

function ordinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatRhythm(
  rhythmType: string,
  dayOfMonth: number | null,
  weekOfMonth: number | null,
  dayOfWeek: string | null,
): string {
  if (rhythmType === 'date_of_month' && dayOfMonth) {
    return `The ${dayOfMonth}${ordinalSuffix(dayOfMonth)} of every month`;
  }
  if (rhythmType === 'day_of_week_pattern' && weekOfMonth && dayOfWeek) {
    const day = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return `Every ${weekOfMonth}${ordinalSuffix(weekOfMonth)} ${day}`;
  }
  return '';
}

function formatMeetingTime(time: string, timezone: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');

  // Get short timezone abbreviation (e.g. "CT", "ET")
  try {
    const ref = new Date();
    ref.setHours(hours, minutes, 0, 0);
    const tzName = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
      .formatToParts(ref)
      .find((p) => p.type === 'timeZoneName')?.value ?? timezone;
    return `${h}:${m} ${period} ${tzName}`;
  } catch {
    return `${h}:${m} ${period}`;
  }
}

type RawGroupRow = {
  id: string;
  name: string | null;
  group_type: string;
  city: string | null;
  state: string | null;
  rhythm_type: string;
  day_of_month: number | null;
  week_of_month: number | null;
  day_of_week: string | null;
  meeting_time: string;
  timezone: string;
  max_size: number | null;
  hosts: { name: string } | { name: string }[] | null;
};

export type GroupDetail = {
  id: string;
  name: string | null;
  countrySlug: string;
  countryName: string;
  hostedBy: string;
  groupType: 'in-person' | 'virtual';
  city: string | null;
  state: string | null;
  chat_link: string | null;
  rhythm: string;
  time: string;
  memberCount: number;
  maxSize: number | null;
  startDate: string;
  rhythmType: string;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  dayOfWeek: string | null;
};

type RawGroupDetailRow = {
  id: string;
  name: string | null;
  country_slug: string;
  group_type: string;
  city: string | null;
  state: string | null;
  chat_link: string | null;
  rhythm_type: string;
  day_of_month: number | null;
  week_of_month: number | null;
  day_of_week: string | null;
  meeting_time: string;
  timezone: string;
  max_size: number | null;
  start_date: string;
  hosts: { name: string } | { name: string }[] | null;
};

export async function getGroupById(id: string): Promise<GroupDetail | null> {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      country_slug,
      group_type,
      city,
      state,
      chat_link,
      rhythm_type,
      day_of_month,
      week_of_month,
      day_of_week,
      meeting_time,
      timezone,
      max_size,
      start_date,
      hosts!groups_host_id_fkey (
        name
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single() as unknown as { data: RawGroupDetailRow | null; error: unknown };

  if (error || !data) return null;

  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', id)
    .eq('status', 'accepted') as unknown as { count: number | null };

  const host = Array.isArray(data.hosts) ? data.hosts[0] : data.hosts;
  const country = countries.find((c) => c.slug === data.country_slug);

  return {
    id: data.id,
    name: data.name,
    countrySlug: data.country_slug,
    countryName: country?.name ?? data.country_slug,
    hostedBy: host?.name ?? 'Unknown Host',
    groupType: data.group_type as 'in-person' | 'virtual',
    city: data.city,
    state: data.state,
    chat_link: data.chat_link,
    rhythm: formatRhythm(data.rhythm_type, data.day_of_month, data.week_of_month, data.day_of_week),
    time: formatMeetingTime(data.meeting_time, data.timezone),
    memberCount: count ?? 0,
    maxSize: data.max_size,
    startDate: data.start_date,
    rhythmType: data.rhythm_type,
    dayOfMonth: data.day_of_month,
    weekOfMonth: data.week_of_month,
    dayOfWeek: data.day_of_week,
  };
}

export async function getGroupsForCountry(slug: string): Promise<DisplayGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      group_type,
      city,
      state,
      rhythm_type,
      day_of_month,
      week_of_month,
      day_of_week,
      meeting_time,
      timezone,
      max_size,
      hosts!groups_host_id_fkey (
        name
      )
    `)
    .eq('country_slug', slug)
    .eq('status', 'active')
    .order('created_at', { ascending: true }) as unknown as { data: RawGroupRow[] | null; error: unknown };

  if (error || !data) return [];

  // Fetch membership counts for all groups in one query
  const groupIds = data.map((r) => r.id);
  const { data: memberships } = await supabase
    .from('memberships')
    .select('group_id')
    .in('group_id', groupIds)
    .eq('status', 'accepted') as unknown as { data: { group_id: string }[] | null };

  const countByGroup: Record<string, number> = {};
  for (const m of memberships ?? []) {
    countByGroup[m.group_id] = (countByGroup[m.group_id] ?? 0) + 1;
  }

  return data.map((row) => {
    const host = Array.isArray(row.hosts) ? row.hosts[0] : row.hosts;
    return {
      id: row.id,
      name: row.name,
      hostedBy: host?.name ?? 'Unknown Host',
      groupType: row.group_type as 'in-person' | 'virtual',
      city: row.city,
      state: row.state,
      rhythm: formatRhythm(row.rhythm_type, row.day_of_month, row.week_of_month, row.day_of_week),
      time: formatMeetingTime(row.meeting_time, row.timezone),
      memberCount: countByGroup[row.id] ?? 0,
      maxSize: row.max_size,
    };
  });
}

// ─── Host dashboard queries ───────────────────────────────────────────────────

export type HostGroup = {
  id: string;
  name: string | null;
  country_slug: string;
  countryName: string;
  status: string;
  chat_link: string | null;
  group_type: 'in-person' | 'virtual';
  city: string | null;
  state: string | null;
  max_size: number | null;
  start_date: string;
  rhythm_type: string;
  day_of_month: number | null;
  week_of_month: number | null;
  day_of_week: string | null;
  meeting_time: string;
  timezone: string;
  rhythm: string;
  time: string;
};

export type HostDashboardData = {
  host: {
    id: string;
    name: string;
    email: string;
    host_token: string;
  };
  groups: HostGroup[];
};

type RawHostRow = {
  id: string;
  name: string;
  email: string;
  host_token: string;
};

type RawGroupForHost = {
  id: string;
  name: string | null;
  country_slug: string;
  status: string;
  chat_link: string | null;
  group_type: string;
  city: string | null;
  state: string | null;
  max_size: number | null;
  start_date: string;
  rhythm_type: string;
  day_of_month: number | null;
  week_of_month: number | null;
  day_of_week: string | null;
  meeting_time: string;
  timezone: string;
};

export async function getHostByToken(token: string): Promise<HostDashboardData | null> {
  const { data: host, error } = await supabase
    .from('hosts')
    .select('id, name, email, host_token')
    .eq('host_token', token)
    .single() as unknown as { data: RawHostRow | null; error: unknown };

  if (error || !host) return null;

  // Groups this host owns as primary host, plus any they co-host
  const { data: cohostRows } = await supabase
    .from('group_cohosts')
    .select('group_id')
    .eq('host_id', host.id) as unknown as { data: { group_id: string }[] | null };
  const cohostedIds = (cohostRows ?? []).map((r) => r.group_id);

  let groupsQuery = supabase
    .from('groups')
    .select('id, name, country_slug, status, chat_link, group_type, city, state, max_size, start_date, rhythm_type, day_of_month, week_of_month, day_of_week, meeting_time, timezone');
  groupsQuery = cohostedIds.length > 0
    ? groupsQuery.or(`host_id.eq.${host.id},id.in.(${cohostedIds.join(',')})`)
    : groupsQuery.eq('host_id', host.id);

  const { data: groupsData } = await groupsQuery
    .neq('status', 'inactive')
    .order('created_at', { ascending: true }) as unknown as { data: RawGroupForHost[] | null };

  const groups: HostGroup[] = (groupsData ?? []).map((g) => {
    const country = countries.find((c) => c.slug === g.country_slug);
    return {
      ...g,
      group_type: g.group_type as 'in-person' | 'virtual',
      countryName: country?.name ?? g.country_slug,
      rhythm: formatRhythm(g.rhythm_type, g.day_of_month, g.week_of_month, g.day_of_week),
      time: formatMeetingTime(g.meeting_time, g.timezone),
    };
  });

  return { host, groups };
}

export type GroupMembers = {
  accepted: { id: string; name: string; email: string; member_token: string; city: string | null; state: string | null }[];
  pending: { id: string; membershipId: string; name: string; email: string; phone: string | null; church: string | null; city: string | null; state: string | null }[];
};

type RawMembershipWithMember = {
  id: string;
  status: string;
  members: {
    id: string;
    name: string;
    email: string;
    member_token: string;
    phone: string | null;
    church: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

export async function getMembersForGroup(groupId: string): Promise<GroupMembers> {
  const { data } = await supabase
    .from('memberships')
    .select('id, status, members (id, name, email, member_token, phone, church, city, state)')
    .eq('group_id', groupId)
    .in('status', ['pending', 'accepted'])
    .order('requested_at', { ascending: true }) as unknown as { data: RawMembershipWithMember[] | null };

  const accepted: GroupMembers['accepted'] = [];
  const pending: GroupMembers['pending'] = [];

  for (const row of data ?? []) {
    const m = row.members;
    if (!m) continue;
    if (row.status === 'accepted') {
      accepted.push({ id: m.id, name: m.name, email: m.email, member_token: m.member_token, city: m.city, state: m.state });
    } else {
      pending.push({ id: m.id, membershipId: row.id, name: m.name, email: m.email, phone: m.phone, church: m.church, city: m.city, state: m.state });
    }
  }

  return { accepted, pending };
}

export async function getMemberIdForToken(groupId: string, token: string): Promise<string | null> {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('member_token', token)
    .single() as unknown as { data: { id: string } | null };

  if (!member) return null;

  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('member_id', member.id)
    .eq('status', 'accepted') as unknown as { count: number | null };

  return (count ?? 0) > 0 ? member.id : null;
}

export async function verifyMemberToken(groupId: string, token: string): Promise<boolean> {
  return (await getMemberIdForToken(groupId, token)) !== null;
}

export async function getLatestKit(groupId: string): Promise<KitRow | null> {
  const { data } = await supabase
    .from('kits')
    .select('*')
    .eq('group_id', groupId)
    .order('meeting_date', { ascending: false })
    .limit(1)
    .single() as unknown as { data: KitRow | null };

  return data ?? null;
}

export async function getKitsForGroup(groupId: string): Promise<KitRow[]> {
  const { data } = await supabase
    .from('kits')
    .select('*')
    .eq('group_id', groupId)
    .order('meeting_date', { ascending: false }) as unknown as { data: KitRow[] | null };

  return data ?? [];
}

export function isMeetingDatePast(meetingDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(meetingDate + 'T00:00:00') < today;
}

export type KitAttendance = { count: number; members: { id: string; name: string }[] };

export async function getAttendanceForKits(kitIds: string[]): Promise<Record<string, KitAttendance>> {
  if (kitIds.length === 0) return {};

  const { data } = await supabase
    .from('kit_attendance')
    .select('kit_id, members (id, name)')
    .in('kit_id', kitIds) as unknown as {
      data: { kit_id: string; members: { id: string; name: string } | { id: string; name: string }[] | null }[] | null;
    };

  const result: Record<string, KitAttendance> = {};
  for (const row of data ?? []) {
    const member = Array.isArray(row.members) ? row.members[0] : row.members;
    if (!member) continue;
    if (!result[row.kit_id]) result[row.kit_id] = { count: 0, members: [] };
    result[row.kit_id].count += 1;
    result[row.kit_id].members.push(member);
  }
  return result;
}

export type FieldPostWithEngagement = FieldPostRow & {
  reactionCount: number;
  reactedMemberIds: string[];
  comments: { id: string; body: string; created_at: string; member_id: string; memberName: string }[];
};

export async function getFieldPostsForGroup(groupId: string): Promise<FieldPostWithEngagement[]> {
  const { data: posts } = await supabase
    .from('field_posts')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false }) as unknown as { data: FieldPostRow[] | null };

  const postList = posts ?? [];
  if (postList.length === 0) return [];

  const postIds = postList.map((p) => p.id);

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase
      .from('field_post_reactions')
      .select('post_id, member_id')
      .in('post_id', postIds) as unknown as Promise<{ data: FieldPostReactionRow[] | null }>,
    supabase
      .from('field_post_comments')
      .select('id, post_id, body, created_at, member_id, members (name)')
      .in('post_id', postIds)
      .order('created_at', { ascending: true }) as unknown as Promise<{
        data: (FieldPostCommentRow & { members: { name: string } | { name: string }[] | null })[] | null;
      }>,
  ]);

  return postList.map((post) => {
    const postReactions = (reactions ?? []).filter((r) => r.post_id === post.id);
    const postComments = (comments ?? [])
      .filter((c) => c.post_id === post.id)
      .map((c) => {
        const member = Array.isArray(c.members) ? c.members[0] : c.members;
        return {
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          member_id: c.member_id,
          memberName: member?.name ?? 'A member',
        };
      });

    return {
      ...post,
      reactionCount: postReactions.length,
      reactedMemberIds: postReactions.map((r) => r.member_id),
      comments: postComments,
    };
  });
}

// ─── Meeting date generator ───────────────────────────────────────────────────

const DAY_OF_WEEK_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  let day = 1 + ((weekday - firstDow + 7) % 7) + (nth - 1) * 7;
  return new Date(year, month, day);
}

export function generateMeetingDates(
  rhythmType: string,
  dayOfMonth: number | null,
  weekOfMonth: number | null,
  dayOfWeek: string | null,
  count = 6,
): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: string[] = [];
  let year = today.getFullYear();
  let month = today.getMonth();

  while (dates.length < count) {
    let candidate: Date | null = null;

    if (rhythmType === 'date_of_month' && dayOfMonth) {
      candidate = new Date(year, month, dayOfMonth);
    } else if (rhythmType === 'day_of_week_pattern' && weekOfMonth && dayOfWeek) {
      const dow = DAY_OF_WEEK_INDEX[dayOfWeek];
      if (dow !== undefined) {
        candidate = nthWeekdayOfMonth(year, month, dow, weekOfMonth);
      }
    }

    if (candidate && candidate >= today) {
      dates.push(candidate.toISOString().split('T')[0]);
    }

    month++;
    if (month > 11) { month = 0; year++; }
    if (year > today.getFullYear() + 2) break;
  }

  return dates;
}

export function getNextExpectedMeetingDate(group: {
  rhythmType: string;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  dayOfWeek: string | null;
}): string | null {
  const [next] = generateMeetingDates(group.rhythmType, group.dayOfMonth, group.weekOfMonth, group.dayOfWeek, 1);
  return next ?? null;
}

export type GroupHost = {
  id: string;
  name: string;
  email: string;
  host_token: string;
};

/**
 * All hosts of a group: the primary host (groups.host_id) first, then co-hosts.
 * Server-side only — includes host tokens.
 */
export async function getGroupHosts(groupId: string): Promise<GroupHost[]> {
  const { data: group } = await supabase
    .from('groups')
    .select('host_id')
    .eq('id', groupId)
    .single() as unknown as { data: { host_id: string } | null };

  if (!group) return [];

  const { data: cohostRows } = await supabase
    .from('group_cohosts')
    .select('host_id')
    .eq('group_id', groupId) as unknown as { data: { host_id: string }[] | null };

  const ids = Array.from(new Set([group.host_id, ...(cohostRows ?? []).map((r) => r.host_id)]));

  const { data: hosts } = await supabase
    .from('hosts')
    .select('id, name, email, host_token')
    .in('id', ids) as unknown as { data: GroupHost[] | null };

  return (hosts ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

/**
 * Returns the host's id if `token` belongs to the primary host or a co-host of
 * `groupId`, otherwise null. Every host server action must call this: server
 * actions are public endpoints and can be invoked with arbitrary arguments.
 */
export async function authorizeHostForGroup(token: string, groupId: string): Promise<string | null> {
  if (!token || !groupId) return null;

  const { data: host } = await supabase
    .from('hosts')
    .select('id')
    .eq('host_token', token)
    .maybeSingle() as unknown as { data: { id: string } | null };
  if (!host) return null;

  const { data: group } = await supabase
    .from('groups')
    .select('host_id')
    .eq('id', groupId)
    .maybeSingle() as unknown as { data: { host_id: string } | null };
  if (!group) return null;
  if (group.host_id === host.id) return host.id;

  const { count } = await supabase
    .from('group_cohosts')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('host_id', host.id) as unknown as { count: number | null };

  return count ? host.id : null;
}

/** Records a member opening their group page. Never throws: analytics must not break the page. */
export async function recordGroupPageView(groupId: string, memberId: string): Promise<void> {
  try {
    await supabase.from('group_page_views').insert({ group_id: groupId, member_id: memberId });
  } catch (err) {
    console.error('recordGroupPageView failed:', err);
  }
}

// Member visits are recorded in group_page_views from this date on.
export const MEMBER_VISIT_TRACKING_START = '2026-11-17';

export type ActivityMonth = {
  key: string; // YYYY-MM
  label: string; // e.g. "Nov 2026"
  newMembers: number;
  meal: string | null; // recipe name (or "Meal sent") if a kit was scheduled that month
  gathered: number; // "We gathered" marks on that month's meal
  reactions: number;
  comments: number;
  memberVisitors: number | null; // distinct members who opened the group page; null = not tracked yet
  visits: number | null;
};

export type GroupActivity = {
  members: number;
  memberStates: number; // distinct US states among accepted members who shared one
  membersByMonth: { key: string; label: string; count: number }[]; // cumulative, oldest first
  latestMeal: { label: string; recipe: string | null; recipients: number; opened: number } | null; // null until tracked
  firstTrackedMonth: string; // YYYY-MM
  pending: number;
  mealsSent: number;
  nextGathering: string | null; // YYYY-MM-DD
  nextMealSent: boolean;
  months: ActivityMonth[]; // newest first
};

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Month-by-month activity for the host dashboard (last 6 months, never before the group started). */
export async function getGroupActivity(group: HostGroup): Promise<GroupActivity> {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    if (key < monthKey(group.start_date)) break;
    keys.push(key);
  }
  if (keys.length === 0) keys.push(now.toISOString().slice(0, 7));
  const since = `${keys[keys.length - 1]}-01`;

  const [{ data: memberships }, { data: kits }, { data: posts }, { data: views }] = await Promise.all([
    supabase.from('memberships').select('status, requested_at, members (state)').eq('group_id', group.id),
    supabase.from('kits').select('id, meeting_date, recipe_name, created_at').eq('group_id', group.id),
    supabase.from('field_posts').select('id').eq('group_id', group.id),
    supabase.from('group_page_views').select('member_id, viewed_at').eq('group_id', group.id).gte('viewed_at', since),
  ]) as unknown as [
    { data: { status: string; requested_at: string; members: { state: string | null } | { state: string | null }[] | null }[] | null },
    { data: { id: string; meeting_date: string; recipe_name: string | null; created_at: string }[] | null },
    { data: { id: string }[] | null },
    { data: { member_id: string; viewed_at: string }[] | null },
  ];

  const kitList = kits ?? [];
  const postIds = (posts ?? []).map((p) => p.id);
  const kitIds = kitList.map((k) => k.id);

  const [{ data: attendance }, { data: reactions }, { data: comments }] = await Promise.all([
    kitIds.length
      ? supabase.from('kit_attendance').select('kit_id').in('kit_id', kitIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('field_post_reactions').select('created_at').in('post_id', postIds).gte('created_at', since)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('field_post_comments').select('created_at').in('post_id', postIds).gte('created_at', since)
      : Promise.resolve({ data: [] }),
  ]) as unknown as [
    { data: { kit_id: string }[] | null },
    { data: { created_at: string }[] | null },
    { data: { created_at: string }[] | null },
  ];

  const gatheredByKit: Record<string, number> = {};
  for (const a of attendance ?? []) gatheredByKit[a.kit_id] = (gatheredByKit[a.kit_id] ?? 0) + 1;

  const trackingStartKey = monthKey(MEMBER_VISIT_TRACKING_START);
  const months: ActivityMonth[] = keys.map((key) => {
    const kit = kitList.find((k) => monthKey(k.meeting_date) === key);
    const monthViews = (views ?? []).filter((v) => monthKey(v.viewed_at) === key);
    const tracked = key >= trackingStartKey;
    return {
      key,
      label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      newMembers: (memberships ?? []).filter((m) => m.status === 'accepted' && monthKey(m.requested_at) === key).length,
      meal: kit ? (kit.recipe_name ?? 'Meal sent') : null,
      gathered: kit ? (gatheredByKit[kit.id] ?? 0) : 0,
      reactions: (reactions ?? []).filter((r) => monthKey(r.created_at) === key).length,
      comments: (comments ?? []).filter((c) => monthKey(c.created_at) === key).length,
      memberVisitors: tracked ? new Set(monthViews.map((v) => v.member_id)).size : null,
      visits: tracked ? monthViews.length : null,
    };
  });

  const nextGathering = getNextExpectedMeetingDate({
    rhythmType: group.rhythm_type,
    dayOfMonth: group.day_of_month,
    weekOfMonth: group.week_of_month,
    dayOfWeek: group.day_of_week,
  });

  const accepted = (memberships ?? []).filter((m) => m.status === 'accepted');
  const states = new Set(
    accepted
      .map((m) => (Array.isArray(m.members) ? m.members[0] : m.members)?.state)
      .map((st) => normalizeUsState(st))
      .filter((st): st is string => !!st),
  );
  const membersByMonth = [...keys].reverse().map((key) => ({
    key,
    label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
    count: accepted.filter((m) => monthKey(m.requested_at) <= key).length,
  }));

  // Opens of the most recent meal: distinct members who opened the group page after it was created.
  const latestKit = [...kitList].sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
  let latestMeal: GroupActivity['latestMeal'] = null;
  if (latestKit && latestKit.created_at >= MEMBER_VISIT_TRACKING_START) {
    const { data: openViews } = await supabase
      .from('group_page_views')
      .select('member_id')
      .eq('group_id', group.id)
      .gte('viewed_at', latestKit.created_at) as unknown as { data: { member_id: string }[] | null };
    latestMeal = {
      label: new Date(`${latestKit.meeting_date}T00:00:00`).toLocaleDateString('en-US', { month: 'long' }),
      recipe: latestKit.recipe_name,
      recipients: accepted.length,
      opened: new Set((openViews ?? []).map((v) => v.member_id)).size,
    };
  }

  return {
    members: accepted.length,
    memberStates: states.size,
    membersByMonth,
    latestMeal,
    firstTrackedMonth: monthKey(MEMBER_VISIT_TRACKING_START),
    pending: (memberships ?? []).filter((m) => m.status === 'pending').length,
    mealsSent: kitList.length, // a kit is emailed to members when it's created
    nextGathering,
    nextMealSent: nextGathering ? kitList.some((k) => k.meeting_date === nextGathering) : false,
    months,
  };
}

const US_STATES: Record<string, string> = {
  ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA', COLORADO: 'CO', CONNECTICUT: 'CT',
  DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
  KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD', MASSACHUSETTS: 'MA', MICHIGAN: 'MI',
  MINNESOTA: 'MN', MISSISSIPPI: 'MS', MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH',
  OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI', WYOMING: 'WY', 'DISTRICT OF COLUMBIA': 'DC',
};
const US_STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([name, code]) => [code, name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())]),
);

/** "Oklahoma", "ok", " OK " -> "OK". Unknown values are returned trimmed and upper-cased. */
export function normalizeUsState(value: string | null | undefined): string | null {
  const v = value?.trim().toUpperCase();
  if (!v) return null;
  return US_STATES[v] ?? v;
}

/** "OK" -> "Oklahoma"; unknown codes are returned as-is. */
export function usStateName(code: string): string {
  return US_STATE_NAMES[code] ?? code;
}
