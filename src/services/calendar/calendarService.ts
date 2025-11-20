// src/services/calendar/calendarService.ts
import { supabase } from '../supabase/client';
import {
  ScheduledClass,
  TeacherAvailability,
  AvailableSlot,
  CreateClassData,
} from '@/types/calendar.types';

export class CalendarService {
  /**
   * Obtiene las clases programadas para un estudiante en un rango de fechas
   */
  async getStudentClasses(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduledClass[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          teacher:teachers!scheduled_classes_teacher_id_fkey (
            id,
            user:profiles!teachers_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', studentId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data as any) || [];
    } catch (error) {
      console.error('Error getting student classes:', error);
      throw error;
    }
  }

  /**
   * Obtiene las clases programadas para un profesor
   */
  async getTeacherClasses(
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduledClass[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          student:students!scheduled_classes_student_id_fkey (
            id,
            user:profiles!students_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data as any) || [];
    } catch (error) {
      console.error('Error getting teacher classes:', error);
      throw error;
    }
  }

  /**
   * Obtiene la próxima clase para un estudiante
   */
  async getNextClass(studentId: string): Promise<ScheduledClass | null> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

      const { data, error } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          teacher:teachers!scheduled_classes_teacher_id_fkey (
            id,
            user:profiles!teachers_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'scheduled')
        .or(`scheduled_date.gt.${today},and(scheduled_date.eq.${today},start_time.gt.${currentTime})`)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return (data as any) || null;
    } catch (error) {
      console.error('Error getting next class:', error);
      return null;
    }
  }

  /**
   * Obtiene las clases de hoy para un estudiante
   */
  async getTodayClasses(studentId: string): Promise<ScheduledClass[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          teacher:teachers!scheduled_classes_teacher_id_fkey (
            id,
            user:profiles!teachers_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data as any) || [];
    } catch (error) {
      console.error('Error getting today classes:', error);
      throw error;
    }
  }

  /**
   * Obtiene los días que tienen clases en un mes
   */
  async getDaysWithClasses(
    studentId: string,
    year: number,
    month: number
  ): Promise<number[]> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('scheduled_classes')
        .select('scheduled_date')
        .eq('student_id', studentId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);

      if (error) throw error;

      // Extraer los días únicos
      const days = new Set<number>();
      data?.forEach((item) => {
        const day = parseInt(item.scheduled_date.split('-')[2]);
        days.add(day);
      });

      return Array.from(days);
    } catch (error) {
      console.error('Error getting days with classes:', error);
      return [];
    }
  }

  /**
   * Obtiene la disponibilidad de un profesor
   */
  async getTeacherAvailability(teacherId: string): Promise<TeacherAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting teacher availability:', error);
      return [];
    }
  }

  /**
   * Obtiene slots disponibles para agendar con un profesor
   */
  async getAvailableSlots(
    teacherId: string,
    date: string
  ): Promise<AvailableSlot[]> {
    try {
      const dayOfWeek = new Date(date).getDay();

      // Obtener disponibilidad del profesor para ese día
      const { data: availability, error: availError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (availError) throw availError;
      if (!availability || availability.length === 0) return [];

      // Obtener clases ya programadas para ese día
      const { data: bookedClasses, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('start_time, end_time')
        .eq('teacher_id', teacherId)
        .eq('scheduled_date', date)
        .neq('status', 'cancelled');

      if (classesError) throw classesError;

      // Generar slots disponibles
      const slots: AvailableSlot[] = [];

      for (const slot of availability) {
        const startHour = parseInt(slot.start_time.split(':')[0]);
        const endHour = parseInt(slot.end_time.split(':')[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          const slotStartTime = `${String(hour).padStart(2, '0')}:00`;
          const slotEndTime = `${String(hour + 1).padStart(2, '0')}:00`;

          // Verificar si el slot está disponible
          const isBooked = bookedClasses?.some((booked) => {
            return slotStartTime >= booked.start_time && slotStartTime < booked.end_time;
          });

          if (!isBooked) {
            slots.push({
              date,
              start_time: slotStartTime,
              end_time: slotEndTime,
              is_available: true,
            });
          }
        }
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Crea una nueva clase programada
   */
  async scheduleClass(classData: CreateClassData): Promise<ScheduledClass | null> {
    try {
      const { data, error } = await supabase
        .from('scheduled_classes')
        .insert({
          student_id: classData.student_id,
          teacher_id: classData.teacher_id,
          scheduled_date: classData.scheduled_date,
          start_time: classData.start_time,
          end_time: classData.end_time,
          duration_minutes: classData.duration_minutes || 60,
          class_type: classData.class_type || 'individual',
          notes: classData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error scheduling class:', error);
      throw error;
    }
  }

  /**
   * Cancela una clase
   */
  async cancelClass(classId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_classes')
        .update({ status: 'cancelled' })
        .eq('id', classId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling class:', error);
      throw error;
    }
  }

  /**
   * Inicia una clase (cambia estado a in_progress)
   */
  async startClass(classId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_classes')
        .update({ status: 'in_progress' })
        .eq('id', classId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting class:', error);
      throw error;
    }
  }

  /**
   * Completa una clase
   */
  async completeClass(classId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_classes')
        .update({ status: 'completed' })
        .eq('id', classId);

      if (error) throw error;

      // Incrementar contador de clases completadas del estudiante
      const { data: classData } = await supabase
        .from('scheduled_classes')
        .select('student_id')
        .eq('id', classId)
        .single();

      if (classData) {
        await supabase.rpc('increment_student_classes', {
          student_id: classData.student_id,
        });
      }
    } catch (error) {
      console.error('Error completing class:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los profesores con su disponibilidad
   */
  async getAvailableTeachers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          bio,
          average_rating,
          total_students,
          user:profiles!teachers_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          ),
          availability:teacher_availability (
            day_of_week,
            start_time,
            end_time
          )
        `)
        .order('average_rating', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting available teachers:', error);
      return [];
    }
  }
}

export const calendarService = new CalendarService();