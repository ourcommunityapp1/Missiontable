export type HostType = 'individual' | 'church' | 'organization';
export type GroupType = 'in-person' | 'virtual';
export type RhythmType = 'date_of_month' | 'day_of_week_pattern';
export type GroupStatus = 'pending' | 'active' | 'full' | 'inactive';
export type MembershipStatus = 'pending' | 'accepted' | 'declined';

type HostRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  host_type: HostType;
  host_token: string;
  auth_user_id: string | null;
  created_at: string;
};

type HostInsert = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  host_type: HostType;
  host_token?: string;
  auth_user_id?: string | null;
  created_at?: string;
};

type GroupRow = {
  id: string;
  name: string | null;
  country_slug: string;
  host_id: string;
  group_type: GroupType;
  city: string | null;
  state: string | null;
  chat_link: string | null;
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
  name?: string | null;
  country_slug: string;
  host_id: string;
  group_type: GroupType;
  city?: string | null;
  state?: string | null;
  chat_link?: string | null;
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
  church: string | null;
  city: string | null;
  state: string | null;
  member_token: string;
  auth_user_id: string | null;
  created_at: string;
};

type MemberInsert = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  church?: string | null;
  city?: string | null;
  state?: string | null;
  member_token?: string;
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

export type KitRow = {
  id: string;
  group_id: string;
  meeting_date: string;
  recipe_name: string | null;
  recipe_url: string | null;
  side_dish: string | null;
  scripture_text: string | null;
  scripture_reference: string | null;
  commentary: string | null;
  prayer_requests: string | null;
  gathering_prompt: string | null;
  photo_url: string | null;
  created_at: string;
};

type KitInsert = {
  id?: string;
  group_id: string;
  meeting_date: string;
  recipe_name?: string | null;
  recipe_url?: string | null;
  side_dish?: string | null;
  scripture_text?: string | null;
  scripture_reference?: string | null;
  commentary?: string | null;
  prayer_requests?: string | null;
  gathering_prompt?: string | null;
  photo_url?: string | null;
  created_at?: string;
};

export type KitAttendanceRow = {
  id: string;
  kit_id: string;
  member_id: string;
  gathered_at: string;
};

type KitAttendanceInsert = {
  id?: string;
  kit_id: string;
  member_id: string;
  gathered_at?: string;
};

export type FieldPostRow = {
  id: string;
  group_id: string;
  host_id: string;
  author_label: string;
  body: string;
  photo_url: string | null;
  video_url: string | null;
  created_at: string;
};

type FieldPostInsert = {
  id?: string;
  group_id: string;
  host_id: string;
  author_label: string;
  body: string;
  photo_url?: string | null;
  video_url?: string | null;
  created_at?: string;
};

export type FieldPostReactionRow = {
  id: string;
  post_id: string;
  member_id: string;
  created_at: string;
};

type FieldPostReactionInsert = {
  id?: string;
  post_id: string;
  member_id: string;
  created_at?: string;
};

export type FieldPostCommentRow = {
  id: string;
  post_id: string;
  member_id: string;
  body: string;
  created_at: string;
};

type FieldPostCommentInsert = {
  id?: string;
  post_id: string;
  member_id: string;
  body: string;
  created_at?: string;
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
      kits: {
        Row: KitRow;
        Insert: KitInsert;
        Update: Partial<KitInsert>;
        Relationships: [];
      };
      kit_attendance: {
        Row: KitAttendanceRow;
        Insert: KitAttendanceInsert;
        Update: Partial<KitAttendanceInsert>;
        Relationships: [];
      };
      field_posts: {
        Row: FieldPostRow;
        Insert: FieldPostInsert;
        Update: Partial<FieldPostInsert>;
        Relationships: [];
      };
      field_post_reactions: {
        Row: FieldPostReactionRow;
        Insert: FieldPostReactionInsert;
        Update: Partial<FieldPostReactionInsert>;
        Relationships: [];
      };
      field_post_comments: {
        Row: FieldPostCommentRow;
        Insert: FieldPostCommentInsert;
        Update: Partial<FieldPostCommentInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
