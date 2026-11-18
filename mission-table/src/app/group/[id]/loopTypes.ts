import type { InviteView, TablePostView } from '@/lib/memberApp';

export type DirectoryMember = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  church: string | null; // best spelling within the group
};

export type MemberLoopData = {
  groupId: string;
  groupName: string;
  countryName: string;
  timeLabel: string;
  nextDate: string | null;
  tableDate: string | null; // gathering members share their table for
  myRsvp: 'in' | 'out' | null;
  inMembers: { id: string; name: string }[];
  tablePosts: TablePostView[];
  received: InviteView[];
  sent: InviteView[];
  me: DirectoryMember;
  directory: DirectoryMember[]; // everyone else in the group
  autoRsvp: { status: 'in' | 'out'; date: string } | null;
  initialTab: string | null;
};
