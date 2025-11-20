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
        quizzes: {
          Row: {
            id: string;
            lesson_id: string;
            title: string;
            topic: string;
            difficulty: 'easy' | 'medium' | 'hard';
            num_questions: number;
            passing_score: number;
            time_limit_minutes: number | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            lesson_id: string;
            title: string;
            topic: string;
            difficulty: 'easy' | 'medium' | 'hard';
            num_questions: number;
            passing_score: number;
            time_limit_minutes?: number | null;
            created_at?: string;
          };
          Update: {
            lesson_id?: string;
            title?: string;
            topic?: string;
            difficulty?: 'easy' | 'medium' | 'hard';
            num_questions?: number;
            passing_score?: number;
            time_limit_minutes?: number | null;
          };
          Relationships: [];
        };
        quiz_attempts: {
          Row: {
            id: string;
            student_id: string;
            quiz_id: string;
            generated_questions: any;
            user_answers: (string | null)[];
            score: number | null;
            started_at: string;
            completed_at: string | null;
          };
          Insert: {
            id?: string;
            student_id: string;
            quiz_id: string;
            generated_questions: any;
            user_answers?: (string | null)[];
            score?: number | null;
            started_at?: string;
            completed_at?: string | null;
          };
          Update: {
            generated_questions?: any;
            user_answers?: (string | null)[];
            score?: number | null;
            completed_at?: string | null;
          };
          Relationships: [];
        };
        student_progress: {
          Row: {
            id: string;
            student_id: string;
            lesson_id: string;
            status: 'not_started' | 'in_progress' | 'completed';
            progress_percentage: number | null;
            score: number | null;
            started_at: string | null;
            completed_at: string | null;
          };
          Insert: {
            id?: string;
            student_id: string;
            lesson_id: string;
            status?: 'not_started' | 'in_progress' | 'completed';
            progress_percentage?: number | null;
            score?: number | null;
            started_at?: string | null;
            completed_at?: string | null;
          };
          Update: {
            status?: 'not_started' | 'in_progress' | 'completed';
            progress_percentage?: number | null;
            score?: number | null;
            started_at?: string | null;
            completed_at?: string | null;
          };
          Relationships: [];
        };
        units: {
          Row: {
            id: string;
            level: string;
            order_index: number;
            title: string;
            description: string | null;
            is_locked: boolean;
            created_at: string;
          };
          Insert: {
            id?: string;
            level: string;
            order_index: number;
            title: string;
            description?: string | null;
            is_locked?: boolean;
            created_at?: string;
          };
          Update: {
            level?: string;
            order_index?: number;
            title?: string;
            description?: string | null;
            is_locked?: boolean;
          };
          Relationships: [];
        };
        lessons: {
          Row: {
            id: string;
            unit_id: string;
            order_index: number;
            title: string;
            description: string | null;
            type: 'video' | 'quiz' | 'exam';
            video_url: string | null;
            duration_minutes: number | null;
            thumbnail_url: string | null;
            is_locked: boolean;
            created_at: string;
          };
          Insert: {
            id?: string;
            unit_id: string;
            order_index: number;
            title: string;
            description?: string | null;
            type: 'video' | 'quiz' | 'exam';
            video_url?: string | null;
            duration_minutes?: number | null;
            thumbnail_url?: string | null;
            is_locked?: boolean;
            created_at?: string;
          };
          Update: {
            unit_id?: string;
            order_index?: number;
            title?: string;
            description?: string | null;
            type?: 'video' | 'quiz' | 'exam';
            video_url?: string | null;
            duration_minutes?: number | null;
            thumbnail_url?: string | null;
            is_locked?: boolean;
          };
          Relationships: [];
        };
        scheduled_classes: {
          Row: {
            id: string;
            student_id: string;
            teacher_id: string;
            scheduled_date: string;
            start_time: string;
            end_time: string;
            duration_minutes: number;
            class_type: 'individual' | 'group';
            status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
            meeting_url: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            student_id: string;
            teacher_id: string;
            scheduled_date: string;
            start_time: string;
            end_time: string;
            duration_minutes?: number;
            class_type?: 'individual' | 'group';
            status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
            meeting_url?: string | null;
            notes?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            scheduled_date?: string;
            start_time?: string;
            end_time?: string;
            duration_minutes?: number;
            class_type?: 'individual' | 'group';
            status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
            meeting_url?: string | null;
            notes?: string | null;
            updated_at?: string;
          };
          Relationships: [];
        };
        teacher_availability: {
          Row: {
            id: string;
            teacher_id: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            is_active: boolean;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            teacher_id: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            is_active?: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            day_of_week?: number;
            start_time?: string;
            end_time?: string;
            is_active?: boolean;
            updated_at?: string;
          };
          Relationships: [];
        };
      };
      Views: {
        [_ in never]: never;
      };
      Functions: {
        increment_student_classes: {
          Args: { student_id: string };
          Returns: void;
        };
      };
      Enums: {
        [_ in never]: never;
      };
      CompositeTypes: {
        [_ in never]: never;
      };
    };
  }