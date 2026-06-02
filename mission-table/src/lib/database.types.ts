export type HostType = 'individual' | 'church' | 'organization';
export type GroupType = 'in-person' | 'virtual';
export type RhythmType = 'date_of_month' | 'day_of_week_pattern';
export type GroupStatus = 'active' | 'full' | 'inactive';
export type MembershipStatus = 'pending' | 'accepted' | 'declined';

export type Database = {
  public: {
    Tables: {
      hosts: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          host_type: HostType;
          auth_user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hosts']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['hosts']['Insert']>;
      };
      groups: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: GroupStatus;
        };
        Update: Partial<Database['public']['Tables']['groups']['Insert']>;
      };
      members: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          auth_user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };
      memberships: {
        Row: {
          id: string;
          group_id: string;
          member_id: string;
          status: MembershipStatus;
          requested_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memberships']['Row'], 'id' | 'requested_at' | 'updated_at' | 'status'> & {
          id?: string;
          requested_at?: string;
          updated_at?: string;
          status?: MembershipStatus;
        };
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>;
      };
    };
  };
};
