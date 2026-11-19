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
  auto_messages: boolean;
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
  auto_messages?: boolean;
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

type GroupCohostRow = {
  group_id: string;
  host_id: string;
  created_at: string;
};

type GroupCohostInsert = {
  group_id: string;
  host_id: string;
  created_at?: string;
};

type GroupPageViewRow = {
  id: string;
  group_id: string;
  member_id: string;
  viewed_at: string;
};

type GroupPageViewInsert = {
  id?: string;
  group_id: string;
  member_id: string;
  viewed_at?: string;
};

export type GatheringRsvpRow = { id: string; group_id: string; member_id: string; meeting_date: string; status: 'in' | 'out'; responded_at: string };
type GatheringRsvpInsert = { id?: string; group_id: string; member_id: string; meeting_date: string; status: 'in' | 'out'; responded_at?: string };

export type HostNoteKind = 'rsvp' | 'thanks';
export type HostNoteRow = { id: string; group_id: string; meeting_date: string; kind: HostNoteKind; body: string | null; skip: boolean; updated_at: string };
type HostNoteInsert = { id?: string; group_id: string; meeting_date: string; kind: HostNoteKind; body?: string | null; skip?: boolean; updated_at?: string };

export type GatheringSendRow = { id: string; group_id: string; meeting_date: string; kind: string; recipients: number; sent_at: string };
type GatheringSendInsert = { id?: string; group_id: string; meeting_date: string; kind: string; recipients?: number; sent_at?: string };

export type TablePostRow = { id: string; group_id: string; member_id: string; meeting_date: string; photo_path: string | null; prayer: string | null; created_at: string };
type TablePostInsert = { id?: string; group_id: string; member_id: string; meeting_date: string; photo_path?: string | null; prayer?: string | null; created_at?: string };

export type MealInviteRow = {
  id: string; group_id: string; inviter_member_id: string; meeting_date: string;
  place_type: 'home' | 'restaurant'; place_name: string | null; address_line: string | null;
  city: string | null; state: string | null; zip: string | null; arrive_time: string | null;
  food: 'cook' | 'potluck' | 'order' | null; seats: number | null; note: string | null;
  created_at: string; cancelled_at: string | null;
};
type MealInviteInsert = Partial<MealInviteRow> & { group_id: string; inviter_member_id: string; meeting_date: string; place_type: 'home' | 'restaurant' };

export type MealInviteGuestStatus = 'invited' | 'accepted' | 'declined';
export type MealInviteGuestRow = { id: string; invite_id: string; member_id: string; status: MealInviteGuestStatus; responded_at: string | null; seen_at: string | null };
type MealInviteGuestInsert = Partial<MealInviteGuestRow> & { invite_id: string; member_id: string };

export type GroupChatMessageRow = {
  id: string; group_id: string; member_id: string | null; host_id: string | null; body: string;
  created_at: string; deleted_at: string | null; deleted_by: string | null;
};
type GroupChatMessageInsert = Partial<GroupChatMessageRow> & { group_id: string; body: string };

export type GroupChatReadRow = { group_id: string; reader_id: string; last_read_at: string };
type GroupChatReadInsert = { group_id: string; reader_id: string; last_read_at?: string };

export type MemberAppOpenRow = { group_id: string; member_id: string; first_opened_at: string; last_opened_at: string; opens: number; platform: string | null };
type MemberAppOpenInsert = Partial<MemberAppOpenRow> & { group_id: string; member_id: string };

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
      group_cohosts: {
        Row: GroupCohostRow;
        Insert: GroupCohostInsert;
        Update: Partial<GroupCohostInsert>;
        Relationships: [];
      };
      group_page_views: {
        Row: GroupPageViewRow;
        Insert: GroupPageViewInsert;
        Update: Partial<GroupPageViewInsert>;
        Relationships: [];
      };
      gathering_rsvps: {
        Row: GatheringRsvpRow;
        Insert: GatheringRsvpInsert;
        Update: Partial<GatheringRsvpInsert>;
        Relationships: [];
      };
      host_notes: {
        Row: HostNoteRow;
        Insert: HostNoteInsert;
        Update: Partial<HostNoteInsert>;
        Relationships: [];
      };
      gathering_sends: {
        Row: GatheringSendRow;
        Insert: GatheringSendInsert;
        Update: Partial<GatheringSendInsert>;
        Relationships: [];
      };
      table_posts: {
        Row: TablePostRow;
        Insert: TablePostInsert;
        Update: Partial<TablePostInsert>;
        Relationships: [];
      };
      meal_invites: {
        Row: MealInviteRow;
        Insert: MealInviteInsert;
        Update: Partial<MealInviteInsert>;
        Relationships: [];
      };
      meal_invite_guests: {
        Row: MealInviteGuestRow;
        Insert: MealInviteGuestInsert;
        Update: Partial<MealInviteGuestInsert>;
        Relationships: [];
      };
      chat_messages: {
        Row: GroupChatMessageRow;
        Insert: GroupChatMessageInsert;
        Update: Partial<GroupChatMessageInsert>;
        Relationships: [];
      };
      member_app_opens: {
        Row: MemberAppOpenRow;
        Insert: MemberAppOpenInsert;
        Update: Partial<MemberAppOpenInsert>;
        Relationships: [];
      };
      chat_reads: {
        Row: GroupChatReadRow;
        Insert: GroupChatReadInsert;
        Update: Partial<GroupChatReadInsert>;
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
