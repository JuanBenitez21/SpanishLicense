import { useState } from 'react';
//import { lessonService } from '@/services/lessons/lessonService';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';

export function useProgress() {
  const { profile } = useAuth();
  const [updating, setUpdating] = useState(false);

  const startLesson = async (lessonId: string) => {
    if (!profile) return;

    try {
      setUpdating(true);

      // Obtener student_id
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!studentData) {
        throw new Error('Datos de estudiante no encontrados');
      }

      // TODO: Implementar lessonService
      // await lessonService.startLesson(studentData.id, lessonId);
    } catch (error) {
      console.error('Error starting lesson:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const updateProgress = async (lessonId: string, percentage: number) => {
    if (!profile) return;

    try {
      setUpdating(true);

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!studentData) {
        throw new Error('Datos de estudiante no encontrados');
      }

      // Buscar si ya existe un registro de progreso
      const { data: existingProgress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('lesson_id', lessonId)
        .single();

      if (existingProgress) {
        // Actualizar progreso existente
        await supabase
          .from('student_progress')
          .update({
            status: 'in_progress',
            progress_percentage: percentage,
          })
          .eq('id', existingProgress.id);
      } else {
        // Crear nuevo registro de progreso
        await supabase
          .from('student_progress')
          .insert({
            student_id: studentData.id,
            lesson_id: lessonId,
            status: 'in_progress',
            progress_percentage: percentage,
            started_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setUpdating(false);
    }
  };

  const completeLesson = async (lessonId: string, score?: number) => {
    if (!profile) return;

    try {
      setUpdating(true);

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!studentData) {
        throw new Error('Datos de estudiante no encontrados');
      }

      // Buscar si ya existe un registro de progreso
      const { data: existingProgress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('lesson_id', lessonId)
        .single();

      if (existingProgress) {
        // Actualizar progreso existente
        await supabase
          .from('student_progress')
          .update({
            status: 'completed',
            progress_percentage: 100,
            score: score || 100,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        // Crear nuevo registro de progreso completado
        await supabase
          .from('student_progress')
          .insert({
            student_id: studentData.id,
            lesson_id: lessonId,
            status: 'completed',
            progress_percentage: 100,
            score: score || 100,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          });
      }

      console.log('✅ Lección completada exitosamente');
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    startLesson,
    updateProgress,
    completeLesson,
    updating,
  };
}