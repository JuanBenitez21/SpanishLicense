// src/screens/student/NewsDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { newsService } from '@/services/news/newsService';
import type { NewsArticle } from '@/types/news.types';

type NewsDetailScreenProps = {
  navigation: any;
  route: {
    params: {
      article: NewsArticle;
    };
  };
};

export default function NewsDetailScreen({ navigation, route }: NewsDetailScreenProps) {
  const { article } = route.params;
  const [fontSize, setFontSize] = useState(16);

  const handleOpenSource = async () => {
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('Error', 'No se pudo abrir el enlace');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el enlace');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\n${article.url}`,
        url: article.url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 22) {
      setFontSize(fontSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize(fontSize - 2);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={decreaseFontSize}>
            <Ionicons name="remove-circle-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={increaseFontSize}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        {article.image && (
          <Image source={{ uri: article.image }} style={styles.articleImage} />
        )}

        <View style={styles.content}>
          {/* Source and Date */}
          <View style={styles.metadata}>
            <View style={styles.sourceContainer}>
              <Text style={styles.source}>{article.source}</Text>
              <View style={styles.divider} />
              <Text style={styles.date}>
                {newsService.formatPublishedDate(article.publishedAt)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontSize: fontSize + 8 }]}>{article.title}</Text>

          {/* Description */}
          {article.description && (
            <Text style={[styles.description, { fontSize: fontSize + 2 }]}>
              {article.description}
            </Text>
          )}

          {/* Content */}
          <Text style={[styles.articleContent, { fontSize }]}>{article.content}</Text>

          {/* Reading Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={theme.colors.primary.main} />
              <Text style={styles.tipsTitle}>Consejos de Lectura</Text>
            </View>
            <Text style={styles.tipsText}>
              • Lee el artículo completo sin detenerte primero{'\n'}
              • Identifica palabras clave que no conozcas{'\n'}
              • Intenta entender el contexto general{'\n'}
              • Vuelve a leer y busca palabras desconocidas
            </Text>
          </View>

          {/* Source Link */}
          <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
            <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            <Text style={styles.sourceButtonText}>Ver artículo completo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  articleImage: {
    width: '100%',
    height: 250,
    backgroundColor: theme.colors.border,
  },
  content: {
    padding: 22,
  },
  metadata: {
    marginBottom: 16,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  source: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary.main,
    textTransform: 'uppercase',
  },
  divider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.disabled,
  },
  date: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  title: {
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  articleContent: {
    color: theme.colors.text.primary,
    lineHeight: 28,
    marginBottom: 24,
  },
  tipsCard: {
    backgroundColor: theme.colors.primary.main + '10',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.main,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tipsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    ...theme.shadows.medium,
  },
  sourceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
