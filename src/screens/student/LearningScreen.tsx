import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/theme/theme';
import { useLearningPath } from '@/hooks/useLearningPath';
import LoadingScreen from '../shared/LoadingScreen';
import { StackNavigationProp } from '@react-navigation/stack';

type LearningScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function LearningScreen({ navigation }: LearningScreenProps) {
    const { learningPath, loading, error, reload } = useLearningPath();
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    // Reload data when screen comes into focus (e.g., returning from VideoPlayerScreen)
    useFocusEffect(
      React.useCallback(() => {
        const refreshData = async () => {
          setIsRefreshing(true);
          await reload();
          setIsRefreshing(false);
        };
        refreshData();
      }, [reload])
    );

    // Solo mostrar loading en la carga inicial, no en los refreshes
    if (loading && !learningPath) return <LoadingScreen />;

    if (error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
            <Text style={{ marginTop: 16, fontSize: 16, color: theme.colors.text.primary, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={reload}
              style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.colors.primary.main, borderRadius: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    if (!learningPath) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.primary.dark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mi Ruta de Aprendizaje</Text>
        <View style={styles.levelInfo}>
          <Text style={styles.levelTitle}>Nivel {learningPath.currentLevel}</Text>
          <View style={styles.overallProgress}>
            <View style={styles.overallProgressBar}>
              <View style={[styles.overallProgressFill, { width: `${learningPath.overallProgress}%` }]} />
            </View>
            <Text style={styles.overallProgressText}>
              {Math.round(learningPath.overallProgress)}% completado • {learningPath.completedLessons}/{learningPath.totalLessons} clases
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {learningPath.units.map((unit) => {
          const allLessonsCompleted = unit.lessons.every(l => l.progress?.status === 'completed');

          return (
            <View key={unit.id} style={styles.unit}>
              <View style={styles.unitHeader}>
                <Text style={[styles.unitTitle, unit.is_locked && styles.textLocked]}>
                  {unit.title}
                </Text>
                {allLessonsCompleted && !unit.is_locked && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                )}
                {unit.is_locked && (
                  <Ionicons name="lock-closed" size={20} color={theme.colors.text.disabled} />
                )}
              </View>

              {!unit.is_locked && unit.lessons.length > 0 && (
                <View style={styles.lessons}>
                  {unit.lessons.map((lesson) => {
                    const isCompleted = lesson.progress?.status === 'completed';
                    const isInProgress = lesson.progress?.status === 'in_progress';
                    const isLocked = lesson.is_locked;

                    const getLessonIcon = () => {
                      if (isCompleted) return 'checkmark';
                      if (isInProgress) return 'play';
                      if (lesson.type === 'quiz' || lesson.type === 'exam') return 'document-text';
                      return 'play';
                    };

                    const handleLessonPress = () => {
                      if (isLocked) return;

                      if (lesson.type === 'video') {
                        navigation.navigate('VideoPlayer', { lesson });
                      } else if (lesson.type === 'quiz' || lesson.type === 'exam') {
                        // Pasar lessonId en lugar de quizId, el QuizScreen buscará el quiz
                        navigation.navigate('Quiz', { lessonId: lesson.id });
                      }
                    };

                    const LessonComponent = isLocked ? View : TouchableOpacity;

                    return (
                      <LessonComponent
                        key={lesson.id}
                        style={[
                          styles.lessonCard,
                          isCompleted && styles.lessonCompleted,
                          isInProgress && styles.lessonCurrent,
                          isLocked && styles.lessonLocked
                        ]}
                        onPress={!isLocked ? handleLessonPress : undefined}
                      >
                        <View style={[
                          styles.lessonIcon,
                          isCompleted && styles.iconCompleted,
                          isInProgress && styles.iconCurrent,
                          isLocked && styles.iconLocked
                        ]}>
                          <Ionicons
                            name={getLessonIcon()}
                            size={20}
                            color={
                              isCompleted ? theme.colors.success :
                              isInProgress ? theme.colors.primary.main :
                              isLocked ? theme.colors.text.disabled :
                              theme.colors.primary.main
                            }
                          />
                        </View>

                        <View style={styles.lessonContent}>
                          <Text style={[styles.lessonTitle, isLocked && styles.textLocked]}>
                            {lesson.title}
                          </Text>
                          {lesson.description && (
                            <Text style={[styles.lessonSubtitle, isLocked && styles.textLocked]}>
                              {lesson.description}
                            </Text>
                          )}
                          {isInProgress && lesson.progress && (
                            <View style={styles.progressDots}>
                              {[0, 1, 2, 3, 4].map(i => (
                                <View
                                  key={i}
                                  style={[
                                    styles.dot,
                                    i < Math.floor((lesson.progress?.score || 0) / 20) && styles.dotActive
                                  ]}
                                />
                              ))}
                            </View>
                          )}
                        </View>

                        {isCompleted && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        )}
                        {isInProgress && !isCompleted && (
                          <Ionicons name="play-circle" size={24} color={theme.colors.primary.main} />
                        )}
                        {isLocked && (
                          <Ionicons name="lock-closed" size={20} color={theme.colors.text.disabled} />
                        )}
                      </LessonComponent>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
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