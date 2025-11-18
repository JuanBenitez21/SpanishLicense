import { useState } from 'react';
// import { lessonService } from '@/services/lessons/lessonService';
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

      // TODO: Implementar lessonService
      // await lessonService.updateProgress(studentData.id, lessonId, percentage);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
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

      // TODO: Implementar lessonService
      // await lessonService.completeLesson(studentData.id, lessonId, score);
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