// src/screens/shared/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { chatService } from '@/services/chat/chatService';
import { supabase } from '@/services/supabase/client';
import type { ChatMessage } from '@/types/chat.types';
import { geminiService } from '@/services/ai/geminiService';
import { aiChatStorage, AIChatMessage } from '@/services/ai/aiChatStorage';

type ChatScreenProps = {
  navigation: any;
  route: {
    params?: {
      conversationId?: string;
      teacherId?: string;
      teacherName?: string;
      isAIChat?: boolean;
      otherParticipant?: {
        id: string;
        name: string;
        avatar_url: string | null;
        role: 'student' | 'teacher';
      };
    };
  };
};

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const {
    conversationId: initialConversationId,
    teacherId,
    teacherName,
    isAIChat = false,
    otherParticipant: initialOtherParticipant
  } = route.params || {};
  const { profile } = useAuth();

  const [conversationId, setConversationId] = useState(initialConversationId);
  const [otherParticipant, setOtherParticipant] = useState(initialOtherParticipant);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadAIMessages = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const data = await aiChatStorage.getMessages(profile.id);
      setAiMessages(data);

      // Scroll al final después de cargar
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading AI messages:', error);
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const initializeConversation = async () => {
    // If we already have conversationId and participant, we're good
    if (conversationId && otherParticipant) {
      return;
    }

    // If we have teacherId, we need to create/get conversation
    if (teacherId && profile) {
      try {
        setLoading(true);

        // Get student_id from profile
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (!studentData) {
          Alert.alert('Error', 'No se pudo obtener información del estudiante');
          navigation.goBack();
          return;
        }

        // Get or create conversation
        const conversation = await chatService.getOrCreateConversation(
          studentData.id,
          teacherId
        );

        setConversationId(conversation.id);

        // Get teacher info
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id, user_id')
          .eq('id', teacherId)
          .single();

        if (teacherData) {
          // Get user profile
          const { data: userData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', teacherData.user_id)
            .single();

          if (userData) {
            setOtherParticipant({
              id: teacherData.id,
              name: teacherName || `${userData.first_name} ${userData.last_name}`,
              avatar_url: userData.avatar_url,
              role: 'teacher',
            });
          }
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
        Alert.alert('Error', 'No se pudo iniciar la conversación');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }
  };

  // Initialize conversation if needed
  useEffect(() => {
    if (isAIChat) {
      loadAIMessages();
    } else {
      initializeConversation();
    }
  }, []);

  useEffect(() => {
    if (!isAIChat && conversationId) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [conversationId]);

  // Suscribirse a mensajes en tiempo real
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToConversation(
      conversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);

        // Marcar como leído si el mensaje es del otro participante
        if (newMessage.sender_id !== profile?.id) {
          markMessagesAsRead();
        }

        // Scroll al final
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, profile]);

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const data = await chatService.getConversationMessages(conversationId, 100);
      setMessages(data);

      // Scroll al final después de cargar
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile || !conversationId) return;

    try {
      await chatService.markMessagesAsRead(conversationId, profile.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!profile || !messageText.trim()) return;

    const text = messageText.trim();
    setMessageText('');

    if (isAIChat) {
      await handleSendAIMessage(text);
    } else {
      if (!conversationId) return;
      await handleSendHumanMessage(text);
    }
  };

  const handleSendHumanMessage = async (text: string) => {
    if (!conversationId) return;

    try {
      setSending(true);
      await chatService.sendMessage({
        conversation_id: conversationId,
        sender_id: profile!.id,
        content: text,
      });
      // El mensaje se agregará automáticamente por el subscription
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setMessageText(text); // Restaurar el texto si falla
    } finally {
      setSending(false);
    }
  };

  const handleSendAIMessage = async (text: string) => {
    if (!profile) return;

    try {
      setSending(true);

      // Agregar mensaje del usuario
      const userMessage = await aiChatStorage.addMessage(profile.id, 'user', text);
      setAiMessages((prev) => [...prev, userMessage]);

      // Scroll al final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Obtener historial para contexto
      const conversationHistory = await aiChatStorage.getConversationHistory(profile.id);

      // Generar respuesta del AI
      const aiResponse = await geminiService.generateChatResponse(text, conversationHistory);

      // Agregar respuesta del AI
      const assistantMessage = await aiChatStorage.addMessage(profile.id, 'assistant', aiResponse);
      setAiMessages((prev) => [...prev, assistantMessage]);

      // Scroll al final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending AI message:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje al Profesor AI');
      setMessageText(text); // Restaurar el texto si falla
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar historial',
      '¿Estás seguro de que quieres eliminar todo el historial de conversación con el Profesor AI?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;
            try {
              await aiChatStorage.clearMessages(profile.id);
              setAiMessages([]);
              Alert.alert('Historial eliminado', 'El historial de conversación ha sido eliminado');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'No se pudo eliminar el historial');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const isYesterday =
      date.getDate() === now.getDate() - 1 &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isYesterday) {
      return (
        'Ayer ' +
        date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage | AIChatMessage }) => {
    const isOwnMessage = isAIChat
      ? (item as AIChatMessage).role === 'user'
      : (item as ChatMessage).sender_id === profile?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, isAIChat && styles.aiHeaderAvatar]}>
            <Ionicons
              name={isAIChat ? 'sparkles' : 'person'}
              size={20}
              color={isAIChat ? '#FFFFFF' : theme.colors.primary.main}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherParticipant?.name || 'Cargando...'}</Text>
            <Text style={styles.headerRole}>
              {isAIChat ? 'Asistente AI' : otherParticipant?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </Text>
          </View>
        </View>

        {isAIChat ? (
          <TouchableOpacity style={styles.moreButton} onPress={handleClearHistory}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={isAIChat ? aiMessages : messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color={theme.colors.text.disabled}
                />
                <Text style={styles.emptyStateText}>
                  {isAIChat
                    ? 'No hay mensajes aún\nPregúntale al Profesor AI sobre español'
                    : 'No hay mensajes aún\nEnvía el primero para iniciar la conversación'}
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={theme.colors.text.disabled}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiHeaderAvatar: {
    backgroundColor: theme.colors.primary.main,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRole: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  moreButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.primary.main,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.background.paper,
    borderBottomLeftRadius: 4,
    ...theme.shadows.small,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: theme.colors.text.disabled,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
});