// src/services/news/newsService.ts
import { NewsArticle, NewsAPIResponse } from '@/types/news.types';

export class NewsService {
  private apiKey: string;
  private baseUrl = 'https://gnews.io/api/v4';

  constructor() {
    // Usar GNews API en lugar de NewsAPI porque funciona mejor con Expo
    this.apiKey = '55d823cb69a6c1af19c5e54b6be9319f';

    if (!this.apiKey) {
      console.warn('News API key not found. News feature will not work.');
    }
  }

  /**
   * Obtiene noticias de España en español
   */
  async getSpanishNews(limit: number = 10): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      throw new Error('News API key not configured');
    }

    try {
      const url = `${this.baseUrl}/top-headlines?country=es&lang=es&max=${limit}&apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`News API error: ${JSON.stringify(errorData)}`);
      }

      const data: NewsAPIResponse = await response.json();

      if (!data.articles || data.articles.length === 0) {
        return [];
      }

      // Transformar los artículos al formato interno
      return data.articles.map((article) => ({
        id: article.url, // Usar URL como ID único
        title: article.title,
        description: article.description || '',
        content: article.content || article.description || '',
        url: article.url,
        image: article.image || null,
        publishedAt: article.publishedAt,
        source: article.source.name,
      }));
    } catch (error: any) {
      console.error('Error fetching Spanish news:', error);

      if (error.message.includes('API key')) {
        throw new Error('API key de noticias no válida o expirada');
      }

      throw new Error('Error al obtener noticias. Intenta de nuevo.');
    }
  }

  /**
   * Busca noticias por tema en español
   */
  async searchNews(query: string, limit: number = 10): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      throw new Error('News API key not configured');
    }

    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&lang=es&country=es&max=${limit}&apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`News API error: ${JSON.stringify(errorData)}`);
      }

      const data: NewsAPIResponse = await response.json();

      if (!data.articles || data.articles.length === 0) {
        return [];
      }

      return data.articles.map((article) => ({
        id: article.url,
        title: article.title,
        description: article.description || '',
        content: article.content || article.description || '',
        url: article.url,
        image: article.image || null,
        publishedAt: article.publishedAt,
        source: article.source.name,
      }));
    } catch (error: any) {
      console.error('Error searching news:', error);
      throw new Error('Error al buscar noticias. Intenta de nuevo.');
    }
  }

  /**
   * Formatea la fecha de publicación de manera amigable
   */
  formatPublishedDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

export const newsService = new NewsService();
