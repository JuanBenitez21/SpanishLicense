import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLearningPath } from '@/hooks/useLearningPath';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';
import { lessonService } from '@/services/lessons/lessonService';
import type { ScheduledClass } from '@/types/calendar.types';
import type { LessonWithProgress } from '@/types/lesson.types';

type HomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { profile } = useAuth();
  const { learningPath, loading: pathLoading, reload: reloadLearningPath } = useLearningPath();

  const [nextLesson, setNextLesson] = useState<LessonWithProgress | null>(null);
  const [nextClass, setNextClass] = useState<ScheduledClass | null>(null);
  const [todayClasses, setTodayClasses] = useState<ScheduledClass[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [studentData, setStudentData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (!initialLoadDone) {
      loadData();
    }
  }, [profile, learningPath, initialLoadDone]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        await reloadLearningPath();
        await loadData();
      };
      refreshData();
    }, [reloadLearningPath])
  );

  const loadData = async () => {
    if (!profile) return;

    try {
      // Solo mostrar loading state en la carga inicial
      if (!initialLoadDone) {
        setLoading(true);
      }

      // Obtener datos del estudiante
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, streak_days, current_level, total_classes_completed')
        .eq('user_id', profile.id)
        .single();

      if (studentError) throw studentError;
      if (!student) throw new Error('Student not found');

      setStudentData(student);
      setStreakDays(student.streak_days || 0);

      // Cargar siguiente lección
      if (learningPath) {
        const next = await lessonService.getNextLesson(
          student.id,
          student.current_level
        );
        setNextLesson(next);
      }

      // Cargar próxima clase
      const nextScheduled = await calendarService.getNextClass(student.id);
      setNextClass(nextScheduled);

      // Cargar clases de hoy
      const today = await calendarService.getTodayClasses(student.id);
      setTodayClasses(today);

      setInitialLoadDone(true);
    } catch (error: any) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del inicio');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const handleLessonPress = (lesson: LessonWithProgress) => {
    if (lesson.type === 'video') {
      navigation.navigate('VideoPlayer', { lesson });
    } else if (lesson.type === 'quiz' || lesson.type === 'exam') {
      navigation.navigate('Quiz', { lessonId: lesson.id });
    }
  };

  const handleStartClass = async (classItem: ScheduledClass) => {
    try {
      // Iniciar la clase en la base de datos
      await calendarService.startClass(classItem.id);

      // Generar token para Agora
      const { tokenService } = await import('@/services/video/tokenService');
      const tokenData = await tokenService.generateToken(classItem.id, profile!.id);

      // Obtener información del profesor
      const teacherName = classItem.teacher
        ? `${classItem.teacher.user.first_name} ${classItem.teacher.user.last_name}`
        : 'Profesor';
      const studentName = `${profile!.first_name} ${profile!.last_name}`;

      // Navegar a la sala de espera (usando el CalendarStack del navegador)
      navigation.navigate('Calendar', {
        screen: 'WaitingRoom',
        params: {
          classId: classItem.id,
          channelName: tokenData.channelName,
          token: tokenData.token,
          isTeacher: false,
          teacherName: teacherName,
          studentName: studentName,
        },
      });
    } catch (error) {
      console.error('Error iniciando clase:', error);
      Alert.alert('Error', 'No se pudo iniciar la videollamada. Verifica tu conexión.');
    }
  };

  // Solo mostrar loading screen en la carga inicial
  if ((loading || pathLoading) && !initialLoadDone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola {profile?.first_name}</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.level}>{studentData?.current_level || 'A1'}</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[theme.colors.primary.main, theme.colors.primary.dark]}
                  style={[
                    styles.progressFill,
                    { width: `${learningPath?.overallProgress || 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.percentage}>
                {Math.round(learningPath?.overallProgress || 0)}%
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ChatList')}
            >
              <Ionicons
                name="chatbubble-outline"
                size={24}
                color={theme.colors.text.primary}
              />
              {/* Badge con número de mensajes sin leer */}
              {/* <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View> */}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={30} color={theme.colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Learning Section */}
        {nextLesson && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionIcon}>📚</Text>
                <Text style={styles.sectionTitle}>Continúa Aprendiendo</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Learning')}>
                <Text style={styles.seeAll}>Ver todo →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.lessonCard}
              onPress={() => handleLessonPress(nextLesson)}
            >
              <View style={styles.lessonThumbnail}>
                <Ionicons
                  name={
                    nextLesson.type === 'video'
                      ? 'play-circle'
                      : 'document-text'
                  }
                  size={40}
                  color={theme.colors.primary.main}
                />
              </View>
              <View style={styles.lessonContent}>
                <Text style={styles.lessonTitle}>{nextLesson.title}</Text>
                <Text style={styles.lessonSubtitle}>
                  {nextLesson.type === 'video'
                    ? `${nextLesson.duration_minutes} min`
                    : 'Cuestionario'}
                </Text>
                {nextLesson.progress && (
                  <View style={styles.lessonProgress}>
                    <View style={styles.progressDots}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            i <= Math.floor((nextLesson.progress?.score || 0) / 20) &&
                              styles.dotActive,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.lessonPercentage}>
                      {nextLesson.progress.score || 0}%
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Classes Section */}
        {todayClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionIcon}>🗓️</Text>
                <Text style={styles.sectionTitle}>Clases de Hoy</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                <Text style={styles.seeAll}>Ver más →</Text>
              </TouchableOpacity>
            </View>

            {todayClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classLeft}>
                  <View style={styles.teacherAvatar}>
                    <Ionicons name="person" size={24} color={theme.colors.primary.main} />
                  </View>
                  <View>
                    <Text style={styles.teacherName}>
                      {classItem.teacher?.user.first_name}{' '}
                      {classItem.teacher?.user.last_name}
                    </Text>
                    <Text style={styles.classTime}>
                      {formatTime(classItem.start_time)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleStartClass(classItem)}
                >
                  <Ionicons name="videocam" size={20} color="#FFFFFF" />
                  <Text style={styles.joinButtonText}>Iniciar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Next Class Card (si no hay clases hoy pero hay próxima) */}
        {todayClasses.length === 0 && nextClass && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionIcon}>🗓️</Text>
                <Text style={styles.sectionTitle}>Próxima Clase</Text>
              </View>
            </View>

            <View style={styles.classCard}>
              <View style={styles.classLeft}>
                <View style={styles.teacherAvatar}>
                  <Ionicons name="person" size={24} color={theme.colors.primary.main} />
                </View>
                <View>
                  <Text style={styles.teacherName}>
                    {nextClass.teacher?.user.first_name}{' '}
                    {nextClass.teacher?.user.last_name}
                  </Text>
                  <Text style={styles.classTime}>
                    {formatDate(nextClass.scheduled_date)} •{' '}
                    {formatTime(nextClass.start_time)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Explore Cultures Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>🌍</Text>
              <Text style={styles.sectionTitle}>Explora Culturas</Text>
            </View>
          </View>

          <View style={styles.culturesContainer}>
            {[
              { flag: '🇪🇸', name: 'España' },
              { flag: '🇲🇽', name: 'México' },
              { flag: '🇦🇷', name: 'Argentina' },
            ].map((culture, index) => (
              <TouchableOpacity key={index} style={styles.cultureCard}>
                <Text style={styles.cultureFlag}>{culture.flag}</Text>
                <Text style={styles.cultureName}>{culture.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>🏆</Text>
              <Text style={styles.sectionTitle}>Logros Recientes</Text>
            </View>
          </View>

          <View style={styles.achievementsContainer}>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🔥</Text>
              <Text style={styles.achievementText}>Racha: {streakDays} días</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>⭐</Text>
              <Text style={styles.achievementText}>
                Nivel {studentData?.current_level || 'A1'}
              </Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>📚</Text>
              <Text style={styles.achievementText}>
                {studentData?.total_classes_completed || 0} clases
              </Text>
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: theme.colors.background.paper,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  level: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.paper,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.paper,
    ...theme.shadows.small,
  },
  section: {
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  lessonCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    ...theme.shadows.small,
  },
  lessonThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  lessonProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
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
  lessonPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  classLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  classTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  culturesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cultureCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  cultureFlag: {
    fontSize: 36,
    marginBottom: 8,
  },
  cultureName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  achievementsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});