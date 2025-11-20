// src/services/lessons/lessonService.ts
import { supabase } from '../supabase/client';
import {
  Unit,
  Lesson,
  StudentProgress,
  UnitWithLessons,
  LessonWithProgress,
  LearningPathData,
} from '@/types/lesson.types';

export class LessonService {
  /**
   * Obtiene todas las unidades con sus lecciones para un nivel específico
   */
  async getUnitsWithLessons(level: string): Promise<UnitWithLessons[]> {
    try {
      // Obtener unidades
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('level', level)
        .order('order_index', { ascending: true });

      if (unitsError) throw unitsError;

      if (!units || units.length === 0) {
        return [];
      }

      // Obtener lecciones para todas las unidades
      const unitIds = units.map((u) => u.id);
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('unit_id', unitIds)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Combinar unidades con sus lecciones
      const unitsWithLessons: UnitWithLessons[] = units.map((unit) => ({
        ...unit,
        lessons: (lessons || []).filter((lesson) => lesson.unit_id === unit.id),
      }));

      return unitsWithLessons;
    } catch (error) {
      console.error('Error getting units with lessons:', error);
      throw error;
    }
  }

  /**
   * Obtiene el progreso de un estudiante en todas las lecciones
   */
  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting student progress:', error);
      throw error;
    }
  }

  /**
   * Obtiene la ruta de aprendizaje completa con progreso
   */
  async getLearningPath(
    studentId: string,
    level: string
  ): Promise<LearningPathData> {
    try {
      // Obtener unidades con lecciones
      const units = await this.getUnitsWithLessons(level);

      // Obtener progreso del estudiante
      const progress = await this.getStudentProgress(studentId);

      // Crear un mapa de progreso para búsqueda rápida
      const progressMap = new Map<string, StudentProgress>();
      progress.forEach((p) => progressMap.set(p.lesson_id, p));

      // Combinar lecciones con progreso
      const unitsWithProgress: UnitWithLessons[] = units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => ({
          ...lesson,
          progress: progressMap.get(lesson.id),
        })),
      }));

      // Calcular estadísticas
      const totalLessons = unitsWithProgress.reduce(
        (sum, unit) => sum + unit.lessons.length,
        0
      );
      const completedLessons = progress.filter(
        (p) => p.status === 'completed'
      ).length;
      const overallProgress =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return {
        units: unitsWithProgress,
        overallProgress: Math.round(overallProgress),
        currentLevel: level,
        completedLessons,
        totalLessons,
      };
    } catch (error) {
      console.error('Error getting learning path:', error);
      throw error;
    }
  }

  /**
   * Obtiene una lección específica
   */
  async getLesson(lessonId: string): Promise<Lesson | null> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting lesson:', error);
      return null;
    }
  }

  /**
   * Inicia el progreso de una lección
   */
  async startLesson(studentId: string, lessonId: string): Promise<void> {
    try {
      // Verificar si ya existe un progreso
      const { data: existing } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        // Si ya existe y no está completado, actualizar started_at
        if (existing.status !== 'completed') {
          await supabase
            .from('student_progress')
            .update({
              status: 'in_progress',
              started_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        }
      } else {
        // Crear nuevo registro de progreso
        await supabase.from('student_progress').insert({
          student_id: studentId,
          lesson_id: lessonId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error starting lesson:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso de una lección
   */
  async updateProgress(
    studentId: string,
    lessonId: string,
    progressPercentage: number
  ): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        await supabase
          .from('student_progress')
          .update({
            progress_percentage: progressPercentage,
            status: progressPercentage >= 100 ? 'completed' : 'in_progress',
            completed_at:
              progressPercentage >= 100 ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
      } else {
        // Si no existe, crearlo
        await supabase.from('student_progress').insert({
          student_id: studentId,
          lesson_id: lessonId,
          status: progressPercentage >= 100 ? 'completed' : 'in_progress',
          progress_percentage: progressPercentage,
          started_at: new Date().toISOString(),
          completed_at:
            progressPercentage >= 100 ? new Date().toISOString() : null,
        });
      }

      // Si se completó la lección, desbloquear la siguiente
      if (progressPercentage >= 100) {
        await this.unlockNextLesson(lessonId);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Marca una lección como completada
   */
  async completeLesson(
    studentId: string,
    lessonId: string,
    score?: number
  ): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        await supabase
          .from('student_progress')
          .update({
            status: 'completed',
            progress_percentage: 100,
            score: score || existing.score,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('student_progress').insert({
          student_id: studentId,
          lesson_id: lessonId,
          status: 'completed',
          progress_percentage: 100,
          score,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }

      // Desbloquear siguiente lección
      await this.unlockNextLesson(lessonId);
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  /**
   * Desbloquea la siguiente lección en la secuencia
   */
  private async unlockNextLesson(currentLessonId: string): Promise<void> {
    try {
      // Obtener la lección actual
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('unit_id, order_index')
        .eq('id', currentLessonId)
        .single();

      if (!currentLesson) return;

      // Buscar la siguiente lección en la misma unidad
      const { data: nextLesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('unit_id', currentLesson.unit_id)
        .eq('order_index', currentLesson.order_index + 1)
        .single();

      if (nextLesson) {
        // Desbloquear la siguiente lección
        await supabase
          .from('lessons')
          .update({ is_locked: false })
          .eq('id', nextLesson.id);
      } else {
        // Si no hay más lecciones, desbloquear la siguiente unidad
        const { data: currentUnit } = await supabase
          .from('units')
          .select('level, order_index')
          .eq('id', currentLesson.unit_id)
          .single();

        if (currentUnit) {
          const { data: nextUnit } = await supabase
            .from('units')
            .select('id')
            .eq('level', currentUnit.level)
            .eq('order_index', currentUnit.order_index + 1)
            .single();

          if (nextUnit) {
            await supabase
              .from('units')
              .update({ is_locked: false })
              .eq('id', nextUnit.id);

            // Desbloquear la primera lección de la siguiente unidad
            const { data: firstLesson } = await supabase
              .from('lessons')
              .select('id')
              .eq('unit_id', nextUnit.id)
              .eq('order_index', 1)
              .single();

            if (firstLesson) {
              await supabase
                .from('lessons')
                .update({ is_locked: false })
                .eq('id', firstLesson.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error unlocking next lesson:', error);
    }
  }

  /**
   * Obtiene la siguiente lección disponible para el estudiante
   */
  async getNextLesson(
    studentId: string,
    level: string
  ): Promise<LessonWithProgress | null> {
    try {
      const learningPath = await this.getLearningPath(studentId, level);

      // Buscar la primera lección que no esté completada y no esté bloqueada
      for (const unit of learningPath.units) {
        for (const lesson of unit.lessons) {
          if (
            !lesson.is_locked &&
            (!lesson.progress || lesson.progress.status !== 'completed')
          ) {
            return lesson;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting next lesson:', error);
      return null;
    }
  }
}

export const lessonService = new LessonService();