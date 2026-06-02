export type HostType = 'individual' | 'church' | 'organization';
export type GroupType = 'in-person' | 'virtual';
export type RhythmType = 'date_of_month' | 'day_of_week_pattern';
export type GroupStatus = 'active' | 'full' | 'inactive';
export type MembershipStatus = 'pending' | 'accepted' | 'declined';

type HostRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  host_type: HostType;
  auth_user_id: string | null;
  created_at: string;
};

type HostInsert = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  host_type: HostType;
  auth_user_id?: string | null;
  created_at?: string;
};

type GroupRow = {
  id: string;
  country_slug: string;
  host_id: string;
  group_type: GroupType;
  city: string | null;
  state: string | null;
  rhythm_type: RhythmType;
  day_of_month: number | null;
  week_of_month: number | null;
  day_of_week: string | null;
  meeting_time: string;
  timezone: string;
  max_size: number | null;
  status: GroupStatus;
  start_date: string;
  end_date: string;
  created_at: string;
};

type GroupInsert = {
  id?: string;
  country_slug: string;
  host_id: string;
  group_type: GroupType;
  city?: string | null;
  state?: string | null;
  rhythm_type: RhythmType;
  day_of_month?: number | null;
  week_of_month?: number | null;
  day_of_week?: string | null;
  meeting_time: string;
  timezone: string;
  max_size?: number | null;
  status?: GroupStatus;
  start_date: string;
  end_date: string;
  created_at?: string;
};

type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  auth_user_id: string | null;
  created_at: string;
};

type MemberInsert = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  auth_user_id?: string | null;
  created_at?: string;
};

type MembershipRow = {
  id: string;
  group_id: string;
  member_id: string;
  status: MembershipStatus;
  requested_at: string;
  updated_at: string;
};

type MembershipInsert = {
  id?: string;
  group_id: string;
  member_id: string;
  status?: MembershipStatus;
  requested_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      hosts: {
        Row: HostRow;
        Insert: HostInsert;
        Update: Partial<HostInsert>;
        Relationships: [];
      };
      groups: {
        Row: GroupRow;
        Insert: GroupInsert;
        Update: Partial<GroupInsert>;
        Relationships: [];
      };
      members: {
        Row: MemberRow;
        Insert: MemberInsert;
        Update: Partial<MemberInsert>;
        Relationships: [];
      };
      memberships: {
        Row: MembershipRow;
        Insert: MembershipInsert;
        Update: Partial<MembershipInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
