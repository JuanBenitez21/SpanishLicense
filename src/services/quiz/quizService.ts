import { supabase } from '../supabase/client';
import { geminiService } from '../ai/geminiService';
import { Quiz, QuizAttempt, TriviaQuestion, QuizResult } from '@/types/quiz.types';

export class QuizService {
  /**
   * Obtiene un quiz por ID
   */
  async getQuiz(quizId: string): Promise<Quiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting quiz:', error);
      return null;
    }
  }

  /**
   * Obtiene el quiz de una lección
   */
  async getQuizByLesson(lessonId: string): Promise<Quiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting quiz by lesson:', error);
      return null;
    }
  }

  /**
   * Genera preguntas de quiz usando IA e inicia un intento
   */
  async startQuizAttempt(
    studentId: string,
    quizId: string
  ): Promise<{ attempt: QuizAttempt; questions: TriviaQuestion[] }> {
    try {
      // Obtener quiz
      const quiz = await this.getQuiz(quizId);
      if (!quiz) {
        throw new Error('Quiz no encontrado');
      }

      // Generar preguntas con IA
      const questions = await geminiService.generateQuizQuestions(
        quiz.topic,
        quiz.num_questions,
        quiz.difficulty
      );

      // Crear intento en la base de datos
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
          student_id: studentId,
          quiz_id: quizId,
          generated_questions: questions,
          user_answers: new Array(questions.length).fill(null),
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { attempt, questions };
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Actualiza las respuestas del usuario en un intento
   */
  async updateAttemptAnswers(
    attemptId: string,
    userAnswers: (string | null)[]
  ): Promise<void> {
    try {
      await supabase
        .from('quiz_attempts')
        .update({
          user_answers: userAnswers,
        })
        .eq('id', attemptId);
    } catch (error) {
      console.error('Error updating attempt answers:', error);
      throw error;
    }
  }

  /**
   * Completa un intento de quiz y calcula el puntaje
   */
  async completeQuizAttempt(
    attemptId: string,
    userAnswers: (string | null)[]
  ): Promise<QuizResult> {
    try {
      // Obtener el intento
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Obtener el quiz
      const quiz = await this.getQuiz(attempt.quiz_id);
      if (!quiz) {
        throw new Error('Quiz no encontrado');
      }

      // Calcular puntaje
      const { score, correctAnswers, totalQuestions } =
        geminiService.calculateScore(
          attempt.generated_questions,
          userAnswers
        );

      // Actualizar intento con puntaje
      const { error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          user_answers: userAnswers,
          score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Actualizar progreso de la lección si aprobó
      const passed = score >= quiz.passing_score;
      if (passed) {
        await this.updateLessonProgress(
          attempt.student_id,
          quiz.lesson_id,
          score
        );
      }

      // Obtener el intento actualizado
      const { data: updatedAttempt } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      return {
        attempt: updatedAttempt!,
        quiz,
        passed,
        correctAnswers,
        totalQuestions,
      };
    } catch (error) {
      console.error('Error completing quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso de la lección asociada al quiz
   */
  private async updateLessonProgress(
    studentId: string,
    lessonId: string,
    score: number
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
            score,
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
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  }

  /**
   * Obtiene los intentos de quiz de un estudiante
   */
  async getStudentAttempts(studentId: string): Promise<QuizAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('started_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting student attempts:', error);
      return [];
    }
  }

  /**
   * Obtiene el mejor intento de un estudiante para un quiz
   */
  async getBestAttempt(
    studentId: string,
    quizId: string
  ): Promise<QuizAttempt | null> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || null;
    } catch (error) {
      console.error('Error getting best attempt:', error);
      return null;
    }
  }
}

export const quizService = new QuizService();