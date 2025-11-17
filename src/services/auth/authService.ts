import { supabase } from '../supabase/client';
//import type { RegisterData, UserProfile, AuthError } from '@/types/auth.types';
import type { RegisterData, UserProfile, AuthError } from '../../types/auth.types'; 

export class AuthService {
  /**
   * Registra un nuevo usuario
   */
  async signUp(data: RegisterData): Promise<{ user: any; profile: UserProfile | null; error: AuthError | null }> {
    try {
      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
      const convertDateFormat = (dateStr: string): string => {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
      };

      // 1. Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) {
        return { user: null, profile: null, error: { message: authError.message, code: authError.status?.toString() } };
      }

      if (!authData.user) {
        return { user: null, profile: null, error: { message: 'No se pudo crear el usuario' } };
      }

      // 2. Crear perfil en profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'student', // Por defecto todos son estudiantes
          birth_date: convertDateFormat(data.birthDate),
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creando perfil:', profileError);
        return { user: null, profile: null, error: { message: `Error al crear perfil: ${profileError.message}` } };
      }

      // 3. Crear registro de estudiante
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          access_code: data.accessCode,
        });

      if (studentError) {
        console.error('Error creando estudiante:', studentError);
        // Intentar eliminar el perfil creado
        await supabase.from('profiles').delete().eq('id', authData.user.id);
        return { user: null, profile: null, error: { message: `Error al crear estudiante: ${studentError.message}` } };
      }

      return { user: authData.user, profile: profileData, error: null };
    } catch (error: any) {
      console.error('Error en signUp:', error);
      return { user: null, profile: null, error: { message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<{ user: any; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Error en signIn:', error);
      return { user: null, error: { message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error en signOut:', error);
      return { error: { message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error obteniendo perfil:', error);
        return { profile: null, error: { message: error.message } };
      }

      if (!data) {
        return { profile: null, error: { message: 'Perfil no encontrado' } };
      }

      return { profile: data, error: null };
    } catch (error: any) {
      console.error('Error en getUserProfile:', error);
      return { profile: null, error: { message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Verifica si un código de acceso es válido
   */
  async verifyAccessCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('access_code')
        .eq('access_code', code)
        .maybeSingle();

      // Si encuentra un registro, el código ya está en uso
      if (data) {
        return false;
      }

      // Aquí podrías tener una tabla de códigos válidos
      // Por ahora, aceptamos cualquier código que siga el patrón SPAN-2025-XXXX
      const codePattern = /^SPAN-2025-[A-Z0-9]{4}$/;
      return codePattern.test(code);
    } catch (error) {
      console.error('Error en verifyAccessCode:', error);
      return false;
    }
  }

  /**
   * Envía un email para resetear contraseña
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'spanishlicense://reset-password',
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error en resetPassword:', error);
      return { error: { message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error en updatePassword:', error);
      return { error: { message: error.message || 'Error desconocido' } };
    }
  }
}

export const authService = new AuthService();