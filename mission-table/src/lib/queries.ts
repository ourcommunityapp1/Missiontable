import { supabase } from './supabase';

export type DisplayGroup = {
  id: string;
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

export async function getGroupsForCountry(slug: string): Promise<DisplayGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      id,
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
