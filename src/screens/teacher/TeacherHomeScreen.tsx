// src/screens/teacher/TeacherHomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';
import type { ScheduledClass } from '@/types/calendar.types';
import { StackNavigationProp } from '@react-navigation/stack';

type TeacherHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function TeacherHomeScreen({ navigation }: TeacherHomeScreenProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [todayClasses, setTodayClasses] = useState<ScheduledClass[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ScheduledClass[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    classesToday: 0,
    completedThisWeek: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  useFocusEffect(
    React.useCallback(() => {
      if (teacherId) {
        loadData();
      }
    }, [teacherId])
  );

  const loadData = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Auto-completar clases expiradas primero
      await calendarService.autoCompleteExpiredClasses();

      // Obtener teacher_id
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id, bio, average_rating, total_students')
        .eq('user_id', profile.id)
        .single();

      if (teacherError) throw teacherError;
      setTeacherId(teacher.id);
      setTeacherData(teacher);

      // Obtener clases de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayClassesData = await calendarService.getTeacherClasses(
        teacher.id,
        today,
        today
      );
      setTodayClasses(todayClassesData);

      // Obtener próximas clases (próximos 7 días)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingData = await calendarService.getTeacherClasses(
        teacher.id,
        tomorrow.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0]
      );
      setUpcomingClasses(upcomingData.slice(0, 5)); // Solo mostrar 5

      // Obtener estadísticas
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

      const { data: weekClasses } = await supabase
        .from('scheduled_classes')
        .select('status')
        .eq('teacher_id', teacher.id)
        .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
        .lte('scheduled_date', endOfWeek.toISOString().split('T')[0]);

      const completedThisWeek = weekClasses?.filter(c => c.status === 'completed').length || 0;

      setStats({
        totalStudents: teacher.total_students || 0,
        classesToday: todayClassesData.length,
        completedThisWeek,
        averageRating: teacher.average_rating || 0,
      });

    } catch (error) {
      console.error('Error loading teacher data:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartClass = async (classItem: ScheduledClass) => {
    try {
      await calendarService.startClass(classItem.id);
      Alert.alert('Iniciando clase', 'Redirigiendo a la sala de videollamada...');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la clase');
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const canStartClass = (classItem: ScheduledClass) => {
    if (classItem.status !== 'scheduled') return false;

    const now = new Date();
    const classDate = new Date(classItem.scheduled_date);
    const [hours, minutes] = classItem.start_time.split(':').map(Number);
    classDate.setHours(hours, minutes, 0, 0);

    const startWindow = new Date(classDate.getTime() - 15 * 60000);
    const endWindow = new Date(classDate.getTime() + 30 * 60000);

    return now >= startWindow && now <= endWindow;
  };

  if (loading) {
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
            <Text style={styles.greeting}>Hola Profesor {profile?.first_name}</Text>
            <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={30} color={theme.colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={32} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.statValue}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Estudiantes Activos</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={32} color={theme.colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.classesToday}</Text>
            <Text style={styles.statLabel}>Clases Hoy</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.completedThisWeek}</Text>
            <Text style={styles.statLabel}>Completadas esta semana</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="star" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Calificación Promedio</Text>
          </View>
        </View>

        {/* Today's Classes */}
        {todayClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Clases de Hoy</Text>
            </View>

            <View style={styles.classList}>
              {todayClasses.map((classItem) => {
                const canStart = canStartClass(classItem);
                return (
                  <View key={classItem.id} style={styles.classCard}>
                    <View style={styles.classLeft}>
                      <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary.main} />
                        <Text style={styles.classTime}>
                          {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                        </Text>
                      </View>
                      <Text style={styles.studentName}>
                        {classItem.student?.user.first_name} {classItem.student?.user.last_name}
                      </Text>
                      <View style={styles.classTypeBadge}>
                        <Text style={styles.classTypeText}>
                          {classItem.class_type === 'individual' ? 'Individual' : 'Grupal'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.startButton, !canStart && styles.startButtonDisabled]}
                      onPress={() => handleStartClass(classItem)}
                      disabled={!canStart}
                    >
                      <Ionicons name="videocam" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📆 Próximas Clases</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherCalendar')}>
                <Text style={styles.seeAll}>Ver todas →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.classList}>
              {upcomingClasses.map((classItem) => (
                <View key={classItem.id} style={styles.classCard}>
                  <View style={styles.classLeft}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.dateText}>
                        {new Date(classItem.scheduled_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={20} color={theme.colors.primary.main} />
                      <Text style={styles.classTime}>{formatTime(classItem.start_time)}</Text>
                    </View>
                    <Text style={styles.studentName}>
                      {classItem.student?.user.first_name} {classItem.student?.user.last_name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('TeacherCalendar')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary.main + '20' }]}>
                <Ionicons name="calendar-outline" size={28} color={theme.colors.primary.main} />
              </View>
              <Text style={styles.actionText}>Gestionar Disponibilidad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Students')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="people-outline" size={28} color={theme.colors.success} />
              </View>
              <Text style={styles.actionText}>Ver Estudiantes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="stats-chart-outline" size={28} color={theme.colors.warning} />
              </View>
              <Text style={styles.actionText}>Estadísticas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '20' }]}>
                <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.info} />
              </View>
              <Text style={styles.actionText}>Mensajes</Text>
            </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  classList: {
    gap: 12,
  },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  classLeft: {
    flex: 1,
    gap: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  studentName: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  classTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.colors.primary.main + '20',
    borderRadius: 12,
  },
  classTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  startButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    ...theme.shadows.small,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
