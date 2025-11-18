export interface Quiz {
    id: string;
    lesson_id: string;
    title: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    num_questions: number;
    passing_score: number;
    time_limit_minutes: number | null;
    created_at: string;
  }
  
  export interface TriviaQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
  }
  
  export interface QuizAttempt {
    id: string;
    student_id: string;
    quiz_id: string;
    generated_questions: TriviaQuestion[];
    user_answers: (string | null)[];
    score: number | null;
    started_at: string;
    completed_at: string | null;
  }
  
  export interface QuizResult {
    attempt: QuizAttempt;
    quiz: Quiz;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  }
  
  // Types para la API de Gemini
  export interface GeminiResponse {
    candidates: Array<{
      content: {
        parts: Array<{
          text: string;
        }>;
      };
    }>;
  }