import { supabase } from './supabase';
import { countries } from '@/data/countries';
import type { KitRow } from './database.types';

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
    .select(`id, name, group_type, country_slug, hosts (name)`)
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
      hosts (
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
    .eq('group_id', id) as unknown as { count: number | null };

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
      hosts (
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
    .in('group_id', groupIds) as unknown as { data: { group_id: string }[] | null };

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

  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, country_slug, status, chat_link, rhythm_type, day_of_month, week_of_month, day_of_week, meeting_time, timezone')
    .eq('host_id', host.id)
    .neq('status', 'inactive')
    .order('created_at', { ascending: true }) as unknown as { data: RawGroupForHost[] | null };

  const groups: HostGroup[] = (groupsData ?? []).map((g) => {
    const country = countries.find((c) => c.slug === g.country_slug);
    return {
      ...g,
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

export async function verifyMemberToken(groupId: string, token: string): Promise<boolean> {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('member_token', token)
    .single() as unknown as { data: { id: string } | null };

  if (!member) return false;

  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('member_id', member.id)
    .eq('status', 'accepted') as unknown as { count: number | null };

  return (count ?? 0) > 0;
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
