export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'student' | 'teacher' | 'admin';
    birth_date: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface StudentData {
    id: string;
    user_id: string;
    current_level: string;
    overall_progress: number;
    streak_days: number;
    total_classes_completed: number;
    access_code: string;
    created_at: string;
  }
  
  export interface TeacherData {
    id: string;
    user_id: string;
    bio?: string;
    specialties?: string[];
    total_students: number;
    average_rating: number;
    created_at: string;
  }
  
  export interface RegisterData {
    // Paso 1: Información Personal
    firstName: string;
    lastName: string;
    birthDate: string;
  
    // Paso 2: Credenciales
    email: string;
    password: string;
    confirmPassword: string;
  
    // Paso 3: Código de acceso
    accessCode: string;
    acceptTerms: boolean;
  }
  
  export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
  }
  
  export interface AuthError {
    message: string;
    code?: string;
  }