// src/hooks/useLearningPath.ts
import { useState, useEffect } from 'react';
import { lessonService } from '@/services/lessons/lessonService';
import { LearningPathData } from '@/types/lesson.types';
import { useAuth } from '@/services/auth/AuthContext';

export function useLearningPath() {
  const { profile } = useAuth();
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLearningPath = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener el student_id
      const { data: studentData } = await import('@/services/supabase/client').then(
        (m) =>
          m.supabase
            .from('students')
            .select('id, current_level')
            .eq('user_id', profile.id)
            .single()
      );

      if (!studentData) {
        throw new Error('Datos de estudiante no encontrados');
      }

      const data = await lessonService.getLearningPath(
        studentData.id,
        studentData.current_level
      );

      setLearningPath(data);
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