import { supabase } from './supabase';
import { countries } from '@/data/countries';

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
      memberCount: 0,
      maxSize: row.max_size,
    };
  });
}
