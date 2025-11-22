// src/screens/teacher/StudentDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';

interface StudentInfo {
  id: string;
  user_id: string;
  current_level: string;
  streak_days: number;
  total_classes_completed: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LessonProgress {
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  unit_name: string;
  unit_order: number;
  status: string;
  progress_percentage: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
}

interface ScheduledClassInfo {
  id: string;
  scheduled_date: string;
  start_time: string;
  status: string;
  class_type: string;
}

export default function StudentDetailScreen({ route, navigation }: any) {
  const { studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClassInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState<'progress' | 'classes'>('progress');

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  const loadStudentDetail = async () => {
    try {
      setLoading(true);

      // Auto-completar clases expiradas primero
      await calendarService.autoCompleteExpiredClasses();

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          current_level,
          streak_days,
          total_classes_completed,
          user:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudentInfo(student as any);

      // Get lesson progress with unit and lesson info
      const { data: progress, error: progressError } = await supabase
        .from('student_progress')
        .select(`
          lesson_id,
          status,
          progress_percentage,
          score,
          started_at,
          completed_at
        `)
        .eq('student_id', studentId)
        .order('started_at', { ascending: false });

      if (progressError) throw progressError;

      // Get lesson IDs from progress
      const lessonIds = (progress || []).map((p: any) => p.lesson_id);

      if (lessonIds.length === 0) {
        setLessonsProgress([]);
      } else {
        // Get lessons with their units
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, order_index, unit_id')
          .in('id', lessonIds);

        if (lessonsError) throw lessonsError;

        // Get unit IDs
        const unitIds = [...new Set((lessons || []).map((l: any) => l.unit_id))];

        // Get units
        const { data: units, error: unitsError } = await supabase
          .from('units')
          .select('id, title, order_index')
          .in('id', unitIds);

        if (unitsError) throw unitsError;

        // Create maps for quick lookup
        const lessonsMap = new Map((lessons || []).map((l: any) => [l.id, l]));
        const unitsMap = new Map((units || []).map((u: any) => [u.id, u]));

        // Transform progress data
        const transformedProgress: LessonProgress[] = (progress || []).map((p: any) => {
          const lesson = lessonsMap.get(p.lesson_id);
          const unit = lesson ? unitsMap.get(lesson.unit_id) : null;

          return {
            lesson_id: p.lesson_id,
            lesson_title: lesson?.title || 'Sin título',
            lesson_order: lesson?.order_index || 0,
            unit_name: unit?.title || 'Sin unidad',
            unit_order: unit?.order_index || 0,
            status: p.status,
            progress_percentage: p.progress_percentage || 0,
            score: p.score,
            started_at: p.started_at,
            completed_at: p.completed_at,
          };
        });

        setLessonsProgress(transformedProgress);
      }

      // Get scheduled classes
      const { data: classes, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('id, scheduled_date, start_time, status, class_type')
        .eq('student_id', studentId)
        .order('scheduled_date', { ascending: false })
        .limit(20);

      if (classesError) throw classesError;
      setScheduledClasses(classes || []);

    } catch (error) {
      console.error('Error loading student detail:', error);
      Alert.alert('Error', 'No se pudo cargar la información del estudiante');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'not_started':
        return theme.colors.text.disabled;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En progreso';
      case 'not_started':
        return 'No iniciada';
      default:
        return status;
    }
  };

  const getClassStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'scheduled':
        return theme.colors.primary.main;
      case 'in_progress':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getClassStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'scheduled':
        return 'Programada';
      case 'in_progress':
        return 'En curso';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró la información del estudiante</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedLessons = lessonsProgress.filter(l => l.status === 'completed').length;
  const totalLessons = lessonsProgress.length;
  const averageScore = lessonsProgress
    .filter(l => l.score !== null)
    .reduce((acc, l) => acc + (l.score || 0), 0) / (lessonsProgress.filter(l => l.score !== null).length || 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Estudiante</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Student Info Card */}
        <View style={styles.studentInfoCard}>
          <View style={styles.studentAvatar}>
            <Ionicons name="person" size={48} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.studentName}>
            {studentInfo.user.first_name} {studentInfo.user.last_name}
          </Text>
          <Text style={styles.studentEmail}>{studentInfo.user.email}</Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{studentInfo.current_level}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{studentInfo.total_classes_completed}</Text>
              <Text style={styles.statLabel}>Clases</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={24} color={theme.colors.warning} />
              <Text style={styles.statValue}>{studentInfo.streak_days}</Text>
              <Text style={styles.statLabel}>Racha</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={24} color={theme.colors.primary.main} />
              <Text style={styles.statValue}>{Math.round(averageScore)}%</Text>
              <Text style={styles.statLabel}>Promedio</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'progress' && styles.tabActive]}
            onPress={() => setSelectedTab('progress')}
          >
            <Text style={[styles.tabText, selectedTab === 'progress' && styles.tabTextActive]}>
              Progreso en Lecciones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'classes' && styles.tabActive]}
            onPress={() => setSelectedTab('classes')}
          >
            <Text style={[styles.tabText, selectedTab === 'classes' && styles.tabTextActive]}>
              Historial de Clases
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {selectedTab === 'progress' ? (
            <>
              {/* Progress Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen de Progreso</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Lecciones completadas:</Text>
                  <Text style={styles.summaryValue}>{completedLessons} / {totalLessons}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
                  </Text>
                </View>
              </View>

              {/* Lessons List */}
              <View style={styles.lessonsContainer}>
                {lessonsProgress.length > 0 ? (
                  lessonsProgress.map((lesson, index) => (
                    <View key={`${lesson.lesson_id}-${index}`} style={styles.lessonCard}>
                      <View style={styles.lessonHeader}>
                        <View style={styles.lessonInfo}>
                          <Text style={styles.unitName}>{lesson.unit_name}</Text>
                          <Text style={styles.lessonTitle}>{lesson.lesson_title}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lesson.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(lesson.status) }]}>
                            {getStatusText(lesson.status)}
                          </Text>
                        </View>
                      </View>

                      {lesson.status !== 'not_started' && (
                        <View style={styles.lessonDetails}>
                          {lesson.score !== null && (
                            <View style={styles.lessonDetailRow}>
                              <Ionicons name="star" size={16} color={theme.colors.warning} />
                              <Text style={styles.lessonDetailText}>
                                Calificación: {lesson.score}%
                              </Text>
                            </View>
                          )}
                          {lesson.started_at && (
                            <View style={styles.lessonDetailRow}>
                              <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                              <Text style={styles.lessonDetailText}>
                                Iniciada: {formatDate(lesson.started_at)}
                              </Text>
                            </View>
                          )}
                          {lesson.completed_at && (
                            <View style={styles.lessonDetailRow}>
                              <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
                              <Text style={styles.lessonDetailText}>
                                Completada: {formatDate(lesson.completed_at)}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={48} color={theme.colors.text.disabled} />
                    <Text style={styles.emptyText}>
                      El estudiante aún no ha comenzado ninguna lección
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Classes List */}
              <View style={styles.classesContainer}>
                {scheduledClasses.length > 0 ? (
                  scheduledClasses.map((classItem) => (
                    <View key={classItem.id} style={styles.classCard}>
                      <View style={styles.classHeader}>
                        <View style={styles.classDateInfo}>
                          <Ionicons name="calendar" size={20} color={theme.colors.primary.main} />
                          <Text style={styles.classDate}>
                            {formatDate(classItem.scheduled_date)}
                          </Text>
                        </View>
                        <View style={[
                          styles.classStatusBadge,
                          { backgroundColor: getClassStatusColor(classItem.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.classStatusText,
                            { color: getClassStatusColor(classItem.status) }
                          ]}>
                            {getClassStatusText(classItem.status)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.classDetails}>
                        <View style={styles.classDetailRow}>
                          <Ionicons name="time" size={16} color={theme.colors.text.secondary} />
                          <Text style={styles.classDetailText}>
                            {classItem.start_time.substring(0, 5)}
                          </Text>
                        </View>
                        <View style={styles.classDetailRow}>
                          <Ionicons name="person" size={16} color={theme.colors.text.secondary} />
                          <Text style={styles.classDetailText}>
                            {classItem.class_type === 'individual' ? 'Individual' : 'Grupal'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={theme.colors.text.disabled} />
                    <Text style={styles.emptyText}>
                      No hay clases programadas con este estudiante
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  studentInfoCard: {
    backgroundColor: theme.colors.background.paper,
    marginHorizontal: 22,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  studentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 20,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    padding: 4,
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 22,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.paper,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadows.small,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 40,
  },
  lessonsContainer: {
    gap: 12,
  },
  lessonCard: {
    backgroundColor: theme.colors.background.paper,
    padding: 16,
    borderRadius: 16,
    ...theme.shadows.small,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 12,
  },
  unitName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lessonDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  lessonDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonDetailText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  classesContainer: {
    gap: 12,
  },
  classCard: {
    backgroundColor: theme.colors.background.paper,
    padding: 16,
    borderRadius: 16,
    ...theme.shadows.small,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  classStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  classStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  classDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classDetailText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
