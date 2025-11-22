// src/services/calendar/calendarService.ts
import { supabase } from '../supabase/client';
import {
  ScheduledClass,
  TeacherAvailability,
  AvailableSlot,
  CreateClassData,
  TeacherWithAvailability,
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
        .neq('status', 'cancelled')
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
        .neq('status', 'cancelled')
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
        .maybeSingle();

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
        .in('status', ['scheduled', 'in_progress'])
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data as any) || [];
    } catch (error) {
      console.error('Error getting today classes:', error);
      return [];
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
      // Calcular primer y último día del mes
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('scheduled_classes')
        .select('scheduled_date')
        .eq('student_id', studentId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .neq('status', 'cancelled');

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
      const targetDate = new Date(date + 'T00:00:00');
      const dayOfWeek = targetDate.getDay();

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

      // Generar slots disponibles (slots de 1 hora)
      const slotsMap = new Map<string, AvailableSlot>(); // Usar Map para evitar duplicados
      const bookedTimes = new Set(
        bookedClasses?.map(bc => bc.start_time.substring(0, 5)) || []
      );

      for (const slot of availability) {
        // Parsear horas de inicio y fin
        const startHour = parseInt(slot.start_time.split(':')[0]);
        const endHour = parseInt(slot.end_time.split(':')[0]);

        // Generar slots de 1 hora
        for (let hour = startHour; hour < endHour; hour++) {
          const slotStartTime = `${String(hour).padStart(2, '0')}:00`;
          const slotEndTime = `${String(hour + 1).padStart(2, '0')}:00`;

          // Verificar si el slot NO está reservado y NO está ya en el Map
          if (!bookedTimes.has(slotStartTime) && !slotsMap.has(slotStartTime)) {
            slotsMap.set(slotStartTime, {
              date,
              start_time: slotStartTime,
              end_time: slotEndTime,
              is_available: true,
            });
          }
        }
      }

      // Convertir Map a array y ordenar por hora
      const slots = Array.from(slotsMap.values());
      slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Verifica si un slot específico está disponible
   */
  async isSlotAvailable(
    teacherId: string,
    date: string,
    startTime: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('scheduled_date', date)
        .eq('start_time', startTime)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (error) throw error;

      return data === null; // Disponible si no hay clase
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  }

  /**
   * Crea una nueva clase programada
   */
  async scheduleClass(classData: CreateClassData): Promise<ScheduledClass> {
    try {
      // Verificar disponibilidad primero
      const isAvailable = await this.isSlotAvailable(
        classData.teacher_id,
        classData.scheduled_date,
        classData.start_time
      );

      if (!isAvailable) {
        throw new Error('Este horario ya no está disponible. Por favor selecciona otro.');
      }

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
          status: 'scheduled',
          notes: classData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error scheduling class:', error);
      throw error;
    }
  }

  /**
   * Cancela una clase
   */
  async cancelClass(classId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_classes')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
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
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
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
      // Actualizar estado de la clase
      const { error: updateError } = await supabase
        .from('scheduled_classes')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId);

      if (updateError) throw updateError;

      // Obtener student_id de la clase
      const { data: classData, error: fetchError } = await supabase
        .from('scheduled_classes')
        .select('student_id')
        .eq('id', classId)
        .single();

      if (fetchError) throw fetchError;

      // Incrementar contador de clases completadas del estudiante
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
  async getAvailableTeachers(): Promise<TeacherWithAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          bio,
          average_rating,
          total_students,
          user:user_id (
            first_name,
            last_name,
            avatar_url
          ),
          availability:teacher_availability (
            id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            is_active
          )
        `)
        .order('average_rating', { ascending: false });

      if (error) throw error;

      // Filtrar profesores que tienen al menos un día de disponibilidad activa
      const teachersWithAvailability = (data || []).filter(
        (teacher: any) => teacher.availability?.some((a: any) => a.is_active)
      );

      return teachersWithAvailability as any;
    } catch (error) {
      console.error('Error getting available teachers:', error);
      return [];
    }
  }

  /**
   * Obtiene un profesor específico con su disponibilidad
   */
  async getTeacherWithAvailability(teacherId: string): Promise<TeacherWithAvailability | null> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          bio,
          average_rating,
          total_students,
          user:user_id (
            first_name,
            last_name,
            avatar_url
          ),
          availability:teacher_availability (
            id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            is_active
          )
        `)
        .eq('id', teacherId)
        .single();

      if (error) throw error;

      return data as any;
    } catch (error) {
      console.error('Error getting teacher with availability:', error);
      return null;
    }
  }

  /**
   * Actualiza la disponibilidad de un profesor (para uso del profesor)
   */
  async updateTeacherAvailability(
    teacherId: string,
    availability: Omit<TeacherAvailability, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    try {
      // Eliminar disponibilidad existente
      const { error: deleteError } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', teacherId);

      if (deleteError) throw deleteError;

      // Insertar nueva disponibilidad
      if (availability.length > 0) {
        const newAvailability = availability.map(a => ({
          teacher_id: teacherId,
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          is_active: a.is_active,
        }));

        const { error: insertError } = await supabase
          .from('teacher_availability')
          .insert(newAvailability);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating teacher availability:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();
