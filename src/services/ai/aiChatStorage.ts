// src/services/ai/aiChatStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const AI_CHAT_STORAGE_KEY = '@ai_chat_history';

export class AIChatStorage {
  /**
   * Obtiene el historial de mensajes del chat con AI
   */
  async getMessages(userId: string): Promise<AIChatMessage[]> {
    try {
      const key = `${AI_CHAT_STORAGE_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading AI chat history:', error);
      return [];
    }
  }

  /**
   * Agrega un mensaje al historial
   */
  async addMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<AIChatMessage> {
    try {
      const messages = await this.getMessages(userId);

      const newMessage: AIChatMessage = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        created_at: new Date().toISOString(),
      };

      messages.push(newMessage);

      const key = `${AI_CHAT_STORAGE_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(messages));

      return newMessage;
    } catch (error) {
      console.error('Error adding AI chat message:', error);
      throw error;
    }
  }

  /**
   * Limpia el historial de mensajes
   */
  async clearMessages(userId: string): Promise<void> {
    try {
      const key = `${AI_CHAT_STORAGE_KEY}_${userId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing AI chat history:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial en formato para Gemini
   */
  async getConversationHistory(userId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const messages = await this.getMessages(userId);

    // Limitar a los últimos 20 mensajes para no exceder el límite de tokens
    const recentMessages = messages.slice(-20);

    return recentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }
}

export const aiChatStorage = new AIChatStorage();
