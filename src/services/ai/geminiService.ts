import { GeminiResponse, TriviaQuestion } from '@/types/quiz.types';

export class GeminiService {
  private apiKey: string;
  private baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
   * Construye el prompt para Gemini (optimizado para reducir tokens)
   */
  private buildPrompt(
    topic: string,
    numQuestions: number,
    difficulty: 'easy' | 'medium' | 'hard',
    language: string
  ): string {
    return `Crea ${numQuestions} preguntas de opción múltiple sobre "${topic}" en ${language}, nivel ${difficulty}.

Responde SOLO con JSON (sin markdown):
[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A"}]

Reglas:
- 4 opciones por pregunta
- 1 correcta
- correctAnswer debe coincidir exactamente con una opción`;
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

  /**
   * Genera una respuesta de chat conversacional usando Gemini AI
   * El AI actúa como un profesor de español experto
   */
  async generateChatResponse(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Construir el contexto de la conversación
    const systemPrompt = `Eres un profesor de español experto y amigable que ayuda a estudiantes a aprender español de España.
Tu objetivo es:
- Responder preguntas sobre gramática, vocabulario y cultura española
- Corregir errores de manera constructiva
- Proporcionar ejemplos prácticos y contextuales
- Ser paciente y motivador
- Ayudar con la preparación para exámenes de español
- Mantener un tono profesional pero cercano

Responde de manera concisa (2-4 oraciones normalmente) a menos que se requiera una explicación más detallada.`;

    // Construir el historial de mensajes
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Soy tu profesor de español y estoy aquí para ayudarte a aprender. ¿En qué puedo ayudarte hoy?' }],
      },
    ];

    // Agregar historial de conversación
    conversationHistory.forEach((msg) => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    });

    // Agregar mensaje actual del usuario
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const body = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
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
        throw new Error('No se recibió una respuesta válida de la IA');
      }

      const aiResponse = data.candidates[0].content.parts[0].text.trim();
      return aiResponse;
    } catch (error: any) {
      console.error('Error generating chat response:', error);

      if (error.message.includes('API key')) {
        throw new Error('API key de Gemini no válida o expirada');
      }

      throw new Error('Error al generar respuesta. Intenta de nuevo.');
    }
  }
}

export const geminiService = new GeminiService();