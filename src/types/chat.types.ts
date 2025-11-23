// src/types/chat.types.ts

export interface ChatConversation {
    id: string;
    student_id: string;
    teacher_id: string;
    last_message: string | null;
    last_message_at: string | null;
    student_unread_count: number;
    teacher_unread_count: number;
    created_at: string;
    updated_at: string;
    // Relations (populated when fetched with join)
    student?: {
      id: string;
      user: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
      };
    };
    teacher?: {
      id: string;
      user: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
      };
    };
  }
  
  export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    // Relations (populated when fetched with join)
    sender?: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  }
  
  export interface CreateConversationData {
    student_id: string;
    teacher_id: string;
  }
  
  export interface SendMessageData {
    conversation_id: string;
    sender_id: string;
    content: string;
  }
  
  export interface ConversationListItem extends ChatConversation {
    otherParticipant: {
      id: string;
      name: string;
      avatar_url: string | null;
      role: 'student' | 'teacher';
    };
    unreadCount: number;
  }