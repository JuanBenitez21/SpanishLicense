// src/hooks/useLearningPath.ts
import { useState, useEffect } from 'react';
import { LearningPathData, UnitWithLessons, LessonWithProgress } from '@/types/lesson.types';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';

export function useLearningPath() {
  const { profile } = useAuth();
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLearningPath = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener el student_id y nivel actual
      const { data: studentData } = await supabase
        .from('students')
        .select('id, current_level')
        .eq('user_id', profile.id)
        .single();

      if (!studentData) {
        throw new Error('Datos de estudiante no encontrados');
      }

      // Obtener todas las unidades del nivel actual
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('level', studentData.current_level)
        .order('order_index', { ascending: true });

      if (unitsError) throw unitsError;
      if (!units) throw new Error('No se encontraron unidades');

      // Obtener todas las lecciones de estas unidades
      const unitIds = units.map(u => u.id);
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('unit_id', unitIds)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Obtener el progreso del estudiante
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentData.id);

      if (progressError) throw progressError;

      // Combinar datos
      const unitsWithLessons: UnitWithLessons[] = units.map((unit, unitIndex) => {
        const unitLessons = (lessons || []).filter(l => l.unit_id === unit.id);

        const lessonsWithProgress: LessonWithProgress[] = unitLessons.map((lesson, lessonIndex) => {
          const progress = progressData?.find(p => p.lesson_id === lesson.id);

          // Determinar si la lección está bloqueada para este estudiante:
          // - La primera lección de la primera unidad siempre está desbloqueada
          // - Una lección está desbloqueada si existe un registro en student_progress para ella
          // - De lo contrario, está bloqueada
          const isFirstLessonOfFirstUnit = unitIndex === 0 && lessonIndex === 0;
          const hasProgressRecord = !!progress;
          const isLocked = !isFirstLessonOfFirstUnit && !hasProgressRecord;

          return {
            ...lesson,
            is_locked: isLocked,
            progress: progress || undefined
          };
        });

        return {
          ...unit,
          lessons: lessonsWithProgress
        };
      });

      // Calcular estadísticas
      const totalLessons = lessons?.length || 0;
      const completedLessons = progressData?.filter(p => p.status === 'completed').length || 0;
      const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      setLearningPath({
        units: unitsWithLessons,
        overallProgress,
        currentLevel: studentData.current_level,
        completedLessons,
        totalLessons
      });

    } catch (err: any) {
      console.error('Error loading learning path:', err);
      setError(err.message || 'Error al cargar la ruta de aprendizaje');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearningPath();
  }, [profile]);

  return {
    learningPath,
    loading,
    error,
    reload: loadLearningPath,
  };
}