export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string;
            role: 'student' | 'teacher' | 'admin';
            first_name: string;
            last_name: string;
            email: string;
            birth_date: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id: string;
            role: 'student' | 'teacher' | 'admin';
            first_name: string;
            last_name: string;
            email: string;
            birth_date?: string | null;
            avatar_url?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            role?: 'student' | 'teacher' | 'admin';
            first_name?: string;
            last_name?: string;
            email?: string;
            birth_date?: string | null;
            avatar_url?: string | null;
            updated_at?: string;
          };
          Relationships: [];
        };
        students: {
          Row: {
            id: string;
            user_id: string;
            current_level: string;
            overall_progress: number;
            streak_days: number;
            total_classes_completed: number;
            access_code: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            current_level?: string;
            overall_progress?: number;
            streak_days?: number;
            total_classes_completed?: number;
            access_code: string;
            created_at?: string;
          };
          Update: {
            current_level?: string;
            overall_progress?: number;
            streak_days?: number;
            total_classes_completed?: number;
          };
          Relationships: [];
        };
        teachers: {
          Row: {
            id: string;
            user_id: string;
            bio: string | null;
            specialties: string[] | null;
            total_students: number;
            average_rating: number;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            bio?: string | null;
            specialties?: string[] | null;
            total_students?: number;
            average_rating?: number;
            created_at?: string;
          };
          Update: {
            bio?: string | null;
            specialties?: string[] | null;
            total_students?: number;
            average_rating?: number;
          };
          Relationships: [];
        };
      };
      Views: {
        [_ in never]: never;
      };
      Functions: {
        [_ in never]: never;
      };
      Enums: {
        [_ in never]: never;
      };
      CompositeTypes: {
        [_ in never]: never;
      };
    };
  }