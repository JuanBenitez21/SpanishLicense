import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

import { useLearningPath } from '@/hooks/useLearningPath';

export default function LearningScreen() {
  const { learningPath, loading, error, reload } = useLearningPath();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  
  // Renderizar learningPath.units en lugar de datos mockeados
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  levelInfo: {
    gap: 8,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  overallProgress: {
    gap: 8,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  unit: {
    marginBottom: 24,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  lessons: {
    gap: 12,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.small,
  },
  lessonCompleted: {
    borderColor: theme.colors.success + '40',
  },
  lessonCurrent: {
    borderColor: theme.colors.primary.main,
  },
  lessonLocked: {
    opacity: 0.6,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCompleted: {
    backgroundColor: theme.colors.success + '20',
  },
  iconCurrent: {
    backgroundColor: theme.colors.primary.main + '20',
  },
  iconLocked: {
    backgroundColor: theme.colors.border,
  },
  lessonContent: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  textLocked: {
    color: theme.colors.text.disabled,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary.main,
  },
});