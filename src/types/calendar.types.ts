// src/types/calendar.types.ts

export interface TeacherAvailability {
    id: string;
    teacher_id: string;
    day_of_week: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
    start_time: string; // Format: "HH:MM"
    end_time: string; // Format: "HH:MM"
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface ScheduledClass {
    id: string;
    student_id: string;
    teacher_id: string;
    scheduled_date: string; // Format: "YYYY-MM-DD"
    start_time: string; // Format: "HH:MM"
    end_time: string; // Format: "HH:MM"
    duration_minutes: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    class_type: 'individual' | 'group';
    meeting_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    teacher?: {
      id: string;
      user: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
      };
    };
    student?: {
      id: string;
      user: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
      };
    };
  }
  
  export interface AvailableSlot {
    date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }
  
  export interface CreateClassData {
    student_id: string;
    teacher_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    class_type?: 'individual' | 'group';
    notes?: string;
  }
  
  export interface TeacherWithAvailability {
    id: string;
    bio: string | null;
    average_rating: number;
    total_students: number;
    user: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
    availability: TeacherAvailability[];
  }
  
  export interface CalendarDay {
    day: number;
    hasClass: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }