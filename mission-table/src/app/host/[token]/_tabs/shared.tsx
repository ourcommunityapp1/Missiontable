import type { HostGroup, GroupMembers, FieldPostWithEngagement, GroupActivity, GroupHost } from '@/lib/queries';
import type { KitRow } from '@/lib/database.types';
import type { HostLoopState } from '@/lib/gathering';

export type TabId = 'overview' | 'field' | 'meals' | 'people' | 'insights' | 'settings';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'field', label: 'From the field' },
  { id: 'meals', label: 'Meals' },
  { id: 'people', label: 'People' },
  { id: 'insights', label: 'Insights' },
  { id: 'settings', label: 'Settings' },
];

export type DashboardData = {
  token: string;
  group: HostGroup;
  hostName: string;
  members: GroupMembers;
  kits: KitRow[];
  fieldPosts: FieldPostWithEngagement[];
  activity: GroupActivity;
  cohosts: GroupHost[];
  /** RSVPs and host notes for the next / last gathering. */
  loop: HostLoopState;
  /** "We gathered" marks per kit id. */
  gatheredByKit: Record<string, number>;
  /** Builds a link to another tab of the same group. */
  tabHref: (tab: TabId) => string;
};

export function SectionLabel({ children, as: Tag = 'h2' }: { children: React.ReactNode; as?: 'h2' | 'h3' | 'p' }) {
  return (
    <Tag className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-black">
      {children}
    </Tag>
  );
}

export function formatDay(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', opts);
}

export function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((p) => /[A-Za-z]/.test(p))
    .slice(0, 2)
    .map((p) => p.replace(/[^A-Za-z]/g, '')[0]?.toUpperCase() ?? '')
    .join('');
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

// Shared button styles (links styled as buttons).
export const btnPrimary =
  'inline-flex items-center min-h-[44px] bg-black text-cream font-inter font-semibold text-[13px] tracking-[0.06em] uppercase px-5 hover:bg-[#3A372F] transition-colors';
export const btnSecondary =
  'inline-flex items-center min-h-[44px] border-2 border-black text-black font-inter font-semibold text-[13px] tracking-[0.06em] uppercase px-[18px] hover:bg-black hover:text-cream transition-colors';
