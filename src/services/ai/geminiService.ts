import { GeminiResponse, TriviaQuestion } from '@/types/quiz.types';

export class GeminiService {
  private apiKey: string;
  private baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Quiz generation will not work.');
    }
  }

  /**
   * Genera preguntas de quiz usando Gemini AI
   */
  async generateQuizQuestions(
    topic: string,
    numQuestions: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    language: string = 'español'
  ): Promise<TriviaQuestion[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildPrompt(topic, numQuestions, difficulty, language);

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No se recibieron respuestas válidas de la IA');
      }

      let jsonString = data.candidates[0].content.parts[0].text;

      // Limpiar markdown y espacios
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const questions: TriviaQuestion[] = JSON.parse(jsonString);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('La IA no generó preguntas válidas');
      }

      // Validar estructura de las preguntas
      const validQuestions = questions.filter((q) => 
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.correctAnswer &&
        q.options.includes(q.correctAnswer)
      );

      if (validQuestions.length === 0) {
        throw new Error('Las preguntas generadas no tienen el formato correcto');
      }

      return validQuestions.slice(0, numQuestions);
    } catch (error: any) {
      console.error('Error generating quiz questions:', error);
      
      if (error.message.includes('API key')) {
        throw new Error('API key de Gemini no válida o expirada');
      }
      
      if (error.message.includes('JSON')) {
        throw new Error('Error al procesar la respuesta de la IA. Intenta de nuevo.');
      }
      
      throw error;
    }
  }

  /**
   * Construye el prompt para Gemini
   */
  private buildPrompt(
    topic: string,
    numQuestions: number,
    difficulty: 'easy' | 'medium' | 'hard',
    language: string
  ): string {
    const difficultyDescriptions = {
      easy: 'básico, para principiantes',
      medium: 'intermedio, con conceptos más complejos',
      hard: 'avanzado, con conceptos desafiantes',
    };

    return `
Eres un profesor experto de español creando un quiz educativo.

TEMA: ${topic}
IDIOMA: ${language}
NIVEL: ${difficultyDescriptions[difficulty]}
NÚMERO DE PREGUNTAS: ${numQuestions}

INSTRUCCIONES IMPORTANTES:
1. Las preguntas deben ser relevantes para estudiantes de español como segunda lengua
2. Cada pregunta debe tener exactamente 4 opciones
3. Solo una opción debe ser correcta
4. Las opciones incorrectas deben ser plausibles pero claramente incorrectas
5. La respuesta correcta debe coincidir EXACTAMENTE con una de las opciones

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un array JSON válido (sin texto adicional, sin markdown, sin explicaciones).

Estructura requerida:
[
  {
    "question": "Tu pregunta aquí",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctAnswer": "La respuesta correcta (debe coincidir exactamente con una opción)"
  }
]

EJEMPLOS DE PREGUNTAS SEGÚN DIFICULTAD:

FÁCIL (easy):
- Vocabulario básico
- Conjugaciones simples de presente
- Frases comunes

MEDIO (medium):
- Tiempos verbales (pretérito, imperfecto)
- Expresiones idiomáticas comunes
- Gramática intermedia

DIFÍCIL (hard):
- Subjuntivo
- Expresiones idiomáticas complejas
- Matices culturales

Genera ${numQuestions} preguntas de nivel ${difficulty} sobre "${topic}".
`.trim();
  }

  /**
   * Valida una respuesta de usuario contra las preguntas generadas
   */
  validateAnswer(
    question: TriviaQuestion,
    userAnswer: string
  ): boolean {
    return question.correctAnswer === userAnswer;
  }

  /**
   * Calcula el puntaje de un quiz
   */
  calculateScore(
    questions: TriviaQuestion[],
    userAnswers: (string | null)[]
  ): {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  } {
    let correctAnswers = 0;

    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const totalQuestions = questions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    return {
      score: Math.round(score),
      correctAnswers,
      totalQuestions,
    };
  }
}

export const geminiService = new GeminiService();