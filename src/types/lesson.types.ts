export interface Unit {
    id: string;
    level: string;
    order_index: number;
    title: string;
    description: string | null;
    is_locked: boolean;
    created_at: string;
  }
  
  export interface Lesson {
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
  }
  
  export interface StudentProgress {
    id: string;
    student_id: string;
    lesson_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    score: number | null;
    started_at: string | null;
    completed_at: string | null;
  }
  
  export interface UnitWithLessons extends Unit {
    lessons: LessonWithProgress[];
  }
  
  export interface LessonWithProgress extends Lesson {
    progress?: StudentProgress;
  }
  
  export interface LearningPathData {
    units: UnitWithLessons[];
    overallProgress: number;
    currentLevel: string;
    completedLessons: number;
    totalLessons: number;
  }