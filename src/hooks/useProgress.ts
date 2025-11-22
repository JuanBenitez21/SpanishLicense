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

      // Desbloquear la siguiente lección
      await unlockNextLesson(lessonId);

      console.log('✅ Lección completada exitosamente');
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const unlockNextLesson = async (currentLessonId: string) => {
    try {
      if (!profile) return;

      // Obtener student_id
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!studentData) {
        console.error('Datos de estudiante no encontrados');
        return;
      }

      // Obtener información de la lección actual
      const { data: currentLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('unit_id, order_index')
        .eq('id', currentLessonId)
        .single();

      if (lessonError || !currentLesson) {
        console.error('Error obteniendo lección actual:', lessonError);
        return;
      }

      // Buscar la siguiente lección en la misma unidad
      const { data: nextLesson, error: nextLessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('unit_id', currentLesson.unit_id)
        .eq('order_index', currentLesson.order_index + 1)
        .single();

      let nextLessonId: string | null = null;

      if (nextLessonError) {
        // Si no hay siguiente lección en esta unidad, buscar la primera lección de la siguiente unidad
        const { data: currentUnit, error: unitError } = await supabase
          .from('units')
          .select('level, order_index')
          .eq('id', currentLesson.unit_id)
          .single();

        if (unitError || !currentUnit) {
          console.log('No hay más lecciones para desbloquear');
          return;
        }

        // Buscar la siguiente unidad
        const { data: nextUnit, error: nextUnitError } = await supabase
          .from('units')
          .select('id')
          .eq('level', currentUnit.level)
          .eq('order_index', currentUnit.order_index + 1)
          .single();

        if (nextUnitError || !nextUnit) {
          console.log('No hay más unidades para desbloquear');
          return;
        }

        // Obtener la primera lección de la siguiente unidad
        const { data: firstLessonNextUnit, error: firstLessonError } = await supabase
          .from('lessons')
          .select('id')
          .eq('unit_id', nextUnit.id)
          .eq('order_index', 1)
          .single();

        if (!firstLessonError && firstLessonNextUnit) {
          nextLessonId = firstLessonNextUnit.id;
          console.log('🔓 Primera lección de la siguiente unidad encontrada');
        }
      } else if (nextLesson) {
        nextLessonId = nextLesson.id;
        console.log('🔓 Siguiente lección encontrada');
      }

      // Si encontramos una siguiente lección, crear un registro en student_progress con status 'not_started'
      // Esto indica que el estudiante tiene acceso a esta lección
      if (nextLessonId) {
        // Verificar si ya existe un registro para esta lección
        const { data: existingProgress } = await supabase
          .from('student_progress')
          .select('id')
          .eq('student_id', studentData.id)
          .eq('lesson_id', nextLessonId)
          .single();

        if (!existingProgress) {
          // Crear registro para desbloquear la siguiente lección para este estudiante
          await supabase
            .from('student_progress')
            .insert({
              student_id: studentData.id,
              lesson_id: nextLessonId,
              status: 'not_started',
              progress_percentage: 0,
            });

          console.log('🔓 Siguiente lección desbloqueada para el estudiante');
        }
      }
    } catch (error) {
      console.error('Error desbloqueando siguiente lección:', error);
      // No lanzamos el error para que no afecte el flujo de completar la lección
    }
  };

  return {
    startLesson,
    updateProgress,
    completeLesson,
    updating,
  };
}