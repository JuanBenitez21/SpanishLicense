// src/services/chat/chatService.ts
import { supabase } from '../supabase/client';
import {
  ChatConversation,
  ChatMessage,
  CreateConversationData,
  SendMessageData,
  ConversationListItem,
} from '@/types/chat.types';

export class ChatService {
  /**
   * Obtiene o crea una conversación entre un estudiante y un profesor
   */
  async getOrCreateConversation(
    studentId: string,
    teacherId: string
  ): Promise<ChatConversation> {
    try {
      // Buscar conversación existente
      const { data: existing, error: findError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') throw findError;

      if (existing) {
        return existing;
      }

      // Crear nueva conversación
      const { data: newConversation, error: createError } = await supabase
        .from('chat_conversations')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
        })
        .select()
        .single();

      if (createError) throw createError;

      return newConversation;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las conversaciones de un usuario
   */
  async getUserConversations(
    userId: string,
    role: 'student' | 'teacher'
  ): Promise<ConversationListItem[]> {
    try {
      let query = supabase
        .from('chat_conversations')
        .select(`
          *,
          student:students!chat_conversations_student_id_fkey (
            id,
            user:profiles!students_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          ),
          teacher:teachers!chat_conversations_teacher_id_fkey (
            id,
            user:profiles!teachers_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .order('updated_at', { ascending: false });

      // Filtrar por rol
      if (role === 'student') {
        // Obtener student_id del userId
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!studentData) throw new Error('Student not found');

        query = query.eq('student_id', studentData.id);
      } else if (role === 'teacher') {
        // Obtener teacher_id del userId
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!teacherData) throw new Error('Teacher not found');

        query = query.eq('teacher_id', teacherData.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformar datos para incluir información del otro participante
      const conversations: ConversationListItem[] = (data || []).map((conv: any) => {
        const isStudent = role === 'student';
        const otherParticipant = isStudent
          ? {
              id: conv.teacher.id,
              name: `${conv.teacher.user.first_name} ${conv.teacher.user.last_name}`,
              avatar_url: conv.teacher.user.avatar_url,
              role: 'teacher' as const,
            }
          : {
              id: conv.student.id,
              name: `${conv.student.user.first_name} ${conv.student.user.last_name}`,
              avatar_url: conv.student.user.avatar_url,
              role: 'student' as const,
            };

        const unreadCount = isStudent
          ? conv.student_unread_count
          : conv.teacher_unread_count;

        return {
          ...conv,
          otherParticipant,
          unreadCount,
        };
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Obtiene los mensajes de una conversación
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Revertir el orden para mostrar más antiguos primero
      return (data || []).reverse() as any;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje en una conversación
   */
  async sendMessage(messageData: SendMessageData): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: messageData.conversation_id,
          sender_id: messageData.sender_id,
          content: messageData.content,
        })
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return data as any;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Marca los mensajes de una conversación como leídos
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Suscribe a una conversación para recibir mensajes en tiempo real
   */
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: ChatMessage) => void
  ) {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Obtener información completa del mensaje
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles!chat_messages_sender_id_fkey (
                first_name,
                last_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(data as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Suscribe a las conversaciones del usuario para recibir actualizaciones
   */
  subscribeToConversations(
    userId: string,
    role: 'student' | 'teacher',
    onUpdate: () => void
  ) {
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Obtiene el número total de mensajes no leídos del usuario
   */
  async getTotalUnreadCount(
    userId: string,
    role: 'student' | 'teacher'
  ): Promise<number> {
    try {
      if (role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!studentData) return 0;

        const { data, error } = await supabase
          .from('chat_conversations')
          .select('student_unread_count')
          .eq('student_id', studentData.id);

        if (error) throw error;

        return (data || []).reduce(
          (sum, conv) => sum + conv.student_unread_count,
          0
        );
      } else {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!teacherData) return 0;

        const { data, error } = await supabase
          .from('chat_conversations')
          .select('teacher_unread_count')
          .eq('teacher_id', teacherData.id);

        if (error) throw error;

        return (data || []).reduce(
          (sum, conv) => sum + conv.teacher_unread_count,
          0
        );
      }
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  /**
   * Elimina una conversación (solo marca como eliminada)
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // En lugar de eliminar, podrías agregar un campo deleted_at
      // Por ahora, simplemente eliminamos
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();