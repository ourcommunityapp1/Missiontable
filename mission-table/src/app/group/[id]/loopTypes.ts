import type { InviteView, TablePostView } from '@/lib/memberApp';
import type { KitRow } from '@/lib/database.types';

export type DirectoryMember = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  church: string | null; // best spelling within the group
};

export type KitWithMeta = {
  kit: KitRow;
  isPast: boolean;
  attendanceCount: number;
  attendanceMembers: { id: string; name: string }[];
};

export type MemberLoopData = {
  groupId: string;
  groupName: string;
  countryName: string;
  timeLabel: string;
  /** Today in the group's time zone (YYYY-MM-DD). */
  today: string;
  nextDate: string | null;
  tableDate: string | null; // gathering members share their table for (today's, else the last one)
  myRsvp: 'in' | 'out' | null;
  inMembers: { id: string; name: string }[];
  outCount: number;
  /** When each "in" answer for the next gathering was given. */
  inTimes: { memberId: string; at: string }[];
  tablePosts: TablePostView[];
  received: InviteView[];
  sent: InviteView[];
  me: DirectoryMember;
  directory: DirectoryMember[]; // everyone else in the group
  autoRsvp: { status: 'in' | 'out'; date: string } | null;
  initialTab: string | null;
};

/** Facts about the group shown in the app header and members sheet. */
export type GroupInfo = {
  id: string;
  name: string;
  countryName: string;
  rhythm: string;
  time: string;
  hostName: string;
  startDate: string;
  isVirtual: boolean;
  place: string | null;
  chatLink: string | null;
  chatEnabled: boolean;
};
