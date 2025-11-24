// src/screens/shared/ChatListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { chatService } from '@/services/chat/chatService';
import type { ConversationListItem } from '@/types/chat.types';

type ChatListScreenProps = {
  navigation: any;
};

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [profile]);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  // Recargar cuando la pantalla entra en foco
  useFocusEffect(
    React.useCallback(() => {
      if (profile) {
        loadConversations();
      }
    }, [profile])
  );

  // Suscribirse a actualizaciones en tiempo real
  useEffect(() => {
    if (!profile) return;

    const unsubscribe = chatService.subscribeToConversations(
      profile.id,
      profile.role as 'student' | 'teacher',
      () => {
        loadConversations();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [profile]);

  const loadConversations = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const data = await chatService.getUserConversations(
        profile.id,
        profile.role as 'student' | 'teacher'
      );

      setConversations(data);
      setFilteredConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) =>
      conv.otherParticipant.name.toLowerCase().includes(query)
    );

    setFilteredConversations(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: ConversationListItem) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherParticipant: conversation.otherParticipant,
    });
  };

  const handleAIChatPress = () => {
    navigation.navigate('Chat', {
      isAIChat: true,
      otherParticipant: {
        id: 'ai-teacher',
        name: 'Profesor AI',
        avatar_url: null,
        role: 'teacher' as const,
      },
    });
  };

  const handleNewChat = () => {
    // Navegar a la pantalla de selección de estudiante
    navigation.navigate('SelectStudent');
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando mensajes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar conversación..."
          placeholderTextColor={theme.colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.disabled} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* AI Chat Card - Solo para estudiantes */}
        {profile?.role === 'student' && !searchQuery && (
          <View style={styles.aiChatSection}>
            <TouchableOpacity style={styles.aiChatCard} onPress={handleAIChatPress}>
              <View style={styles.aiChatIconContainer}>
                <Ionicons name="sparkles" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.aiChatContent}>
                <Text style={styles.aiChatTitle}>Profesor AI</Text>
                <Text style={styles.aiChatDescription}>
                  Practica español con tu asistente inteligente
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.disabled} />
            </TouchableOpacity>
          </View>
        )}

        {filteredConversations.length > 0 ? (
          <View style={styles.conversationsList}>
            {filteredConversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationCard}
                onPress={() => handleConversationPress(conversation)}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={28} color={theme.colors.primary.main} />
                  </View>
                  {conversation.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.participantName}>
                      {conversation.otherParticipant.name}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatTime(conversation.last_message_at)}
                    </Text>
                  </View>

                  {conversation.last_message && (
                    <Text
                      style={[
                        styles.lastMessage,
                        conversation.unreadCount > 0 && styles.lastMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {conversation.last_message}
                    </Text>
                  )}

                  {!conversation.last_message && (
                    <Text style={styles.noMessages}>Sin mensajes</Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.disabled} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No se encontraron conversaciones' : 'Sin conversaciones'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Intenta con otro nombre'
                : 'Tus conversaciones aparecerán aquí'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button - Solo para profesores */}
      {profile?.role === 'teacher' && (
        <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    marginHorizontal: 22,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    ...theme.shadows.small,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  conversationsList: {
    paddingHorizontal: 22,
    gap: 12,
    paddingBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...theme.shadows.small,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: theme.colors.background.paper,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  noMessages: {
    fontSize: 14,
    color: theme.colors.text.disabled,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  aiChatSection: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 8,
  },
  aiChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary.main + '30',
    ...theme.shadows.medium,
  },
  aiChatIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiChatContent: {
    flex: 1,
    gap: 2,
  },
  aiChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  aiChatDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
});