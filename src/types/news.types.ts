// src/types/news.types.ts

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: string;
}

export interface NewsAPIArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export interface NewsAPIResponse {
  totalArticles: number;
  articles: NewsAPIArticle[];
}
