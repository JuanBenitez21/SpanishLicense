// src/screens/student/NewsListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { newsService } from '@/services/news/newsService';
import type { NewsArticle } from '@/types/news.types';

type NewsListScreenProps = {
  navigation: any;
};

export default function NewsListScreen({ navigation }: NewsListScreenProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const articles = await newsService.getSpanishNews(20);
      setNews(articles);
    } catch (error: any) {
      console.error('Error loading news:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las noticias');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const handleArticlePress = (article: NewsArticle) => {
    navigation.navigate('NewsDetail', { article });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando noticias...</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Noticias de España</Text>
          <Text style={styles.headerSubtitle}>🇪🇸 Practica tu lectura</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {news.length > 0 ? (
          <View style={styles.newsList}>
            {news.map((article, index) => (
              <TouchableOpacity
                key={article.id}
                style={styles.newsCard}
                onPress={() => handleArticlePress(article)}
              >
                {article.image && (
                  <Image source={{ uri: article.image }} style={styles.newsImage} />
                )}
                <View style={styles.newsContent}>
                  <View style={styles.newsHeader}>
                    <Text style={styles.newsSource}>{article.source}</Text>
                    <Text style={styles.newsDate}>
                      {newsService.formatPublishedDate(article.publishedAt)}
                    </Text>
                  </View>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  {article.description && (
                    <Text style={styles.newsDescription} numberOfLines={3}>
                      {article.description}
                    </Text>
                  )}
                  <View style={styles.newsFooter}>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={20}
                      color={theme.colors.primary.main}
                    />
                    <Text style={styles.readMore}>Leer más</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={styles.emptyStateTitle}>No hay noticias disponibles</Text>
            <Text style={styles.emptyStateText}>
              Intenta actualizar para cargar las últimas noticias
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  newsList: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    gap: 16,
  },
  newsCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  newsImage: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.border,
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
    textTransform: 'uppercase',
  },
  newsDate: {
    fontSize: 12,
    color: theme.colors.text.disabled,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
  },
  newsDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.main,
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
  refreshButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
