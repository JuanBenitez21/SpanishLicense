// src/screens/student/CalendarScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';
import type { ScheduledClass } from '@/types/calendar.types';
import { formatLocalDate } from '@/utils/dateUtils';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type CalendarScreenProps = {
  navigation: any;
};

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [daysWithClasses, setDaysWithClasses] = useState<number[]>([]);
  const [selectedDayClasses, setSelectedDayClasses] = useState<ScheduledClass[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Cargar studentId inicial
  useEffect(() => {
    loadStudentId();
  }, [profile]);

  // Cargar datos del calendario cuando cambia el mes
  useEffect(() => {
    if (studentId) {
      loadCalendarData();
    }
  }, [studentId, currentDate]);

  // Cargar clases cuando cambia la fecha seleccionada
  useEffect(() => {
    if (studentId && selectedDate) {
      loadSelectedDayClasses();
    }
  }, [studentId, selectedDate]);

  // Recargar datos cuando la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      if (studentId) {
        loadCalendarData();
        loadSelectedDayClasses();
      }
    }, [studentId])
  );

  const loadStudentId = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (error) throw error;
      setStudentId(data.id);
    } catch (error) {
      console.error('Error loading student id:', error);
      Alert.alert('Error', 'No se pudo cargar la información del calendario');
    }
  };

  const loadCalendarData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      // Auto-completar clases expiradas primero
      await calendarService.autoCompleteExpiredClasses();

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const days = await calendarService.getDaysWithClasses(studentId, year, month);
      setDaysWithClasses(days);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDayClasses = async () => {
    if (!studentId) return;

    try {
      setLoadingClasses(true);
      const dateStr = formatLocalDate(selectedDate);

      const classes = await calendarService.getStudentClasses(
        studentId,
        dateStr,
        dateStr
      );
      setSelectedDayClasses(classes);
    } catch (error) {
      console.error('Error loading selected day classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    await loadSelectedDayClasses();
    setRefreshing(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const handleDayPress = (day: number | null) => {
    if (day === null) return;

    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  const handleScheduleClass = () => {
    // Navegar a la pantalla de agendar clase con la fecha seleccionada
    navigation.navigate('ScheduleClass', {
      selectedDate: selectedDate.toISOString(),
    });
  };

  const handleCancelClass = async (classItem: ScheduledClass) => {
    Alert.alert(
      'Cancelar Clase',
      `¿Estás seguro de que deseas cancelar la clase con ${classItem.teacher?.user.first_name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await calendarService.cancelClass(classItem.id);
              await loadSelectedDayClasses();
              await loadCalendarData();
              Alert.alert('Éxito', 'La clase ha sido cancelada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la clase');
            }
          },
        },
      ]
    );
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

      // Navegar a la sala de espera
      navigation.navigate('WaitingRoom', {
        classId: classItem.id,
        channelName: tokenData.channelName,
        token: tokenData.token,
        isTeacher: false,
        teacherName: teacherName,
        studentName: studentName,
      });
    } catch (error) {
      console.error('Error iniciando clase:', error);
      Alert.alert('Error', 'No se pudo iniciar la videollamada. Verifica tu conexión.');
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (day === null) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasClasses = (day: number | null) => {
    if (day === null) return false;
    return daysWithClasses.includes(day);
  };

  const isPastDate = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  const canStartClass = (classItem: ScheduledClass) => {
    if (classItem.status !== 'scheduled') return false;
    
    const now = new Date();
    const classDate = new Date(classItem.scheduled_date);
    const [hours, minutes] = classItem.start_time.split(':').map(Number);
    classDate.setHours(hours, minutes, 0, 0);
    
    // Permitir iniciar 15 minutos antes
    const startWindow = new Date(classDate.getTime() - 15 * 60000);
    // Permitir iniciar hasta 30 minutos después
    const endWindow = new Date(classDate.getTime() + 30 * 60000);
    
    return now >= startWindow && now <= endWindow;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { icon: 'time-outline', color: theme.colors.primary.main, text: 'Programada' };
      case 'in_progress':
        return { icon: 'radio-button-on', color: theme.colors.success, text: 'En curso' };
      case 'completed':
        return { icon: 'checkmark-circle', color: theme.colors.success, text: 'Completada' };
      case 'cancelled':
        return { icon: 'close-circle', color: theme.colors.error, text: 'Cancelada' };
      default:
        return { icon: 'help-circle', color: theme.colors.text.disabled, text: status };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleScheduleClass}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Month Navigator */}
        <View style={styles.monthNavigator}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeMonth(-1)}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeMonth(1)}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.daysHeader}>
          {DAYS.map((day, index) => (
            <Text key={index} style={styles.dayLabel}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
          </View>
        ) : (
          <View style={styles.calendarGrid}>
            {getDaysInMonth().map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const past = isPastDate(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected(day) && styles.dayCellSelected,
                    isToday(day) && !isSelected(day) && styles.dayCellToday,
                    past && styles.dayCellPast,
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={past}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected(day) && styles.dayNumberSelected,
                      past && styles.dayNumberPast,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasClasses(day) && !isSelected(day) && (
                    <View style={[styles.classDot, past && styles.classDotPast]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
            <Text style={styles.legendText}>Clase programada</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary.main }]} />
            <Text style={styles.legendText}>Hoy</Text>
          </View>
        </View>

        {/* Classes for Selected Day */}
        <View style={styles.classesSection}>
          <View style={styles.classesSectionHeader}>
            <Text style={styles.classesSectionTitle}>
              {selectedDate.toDateString() === new Date().toDateString() 
                ? 'Clases de Hoy' 
                : `Clases del ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`}
            </Text>
            {selectedDayClasses.length > 0 && (
              <View style={styles.classesCount}>
                <Text style={styles.classesCountText}>{selectedDayClasses.length}</Text>
              </View>
            )}
          </View>

          {loadingClasses ? (
            <View style={styles.loadingClassesContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary.main} />
              <Text style={styles.loadingClassesText}>Cargando clases...</Text>
            </View>
          ) : selectedDayClasses.length > 0 ? (
            <View style={styles.classesList}>
              {selectedDayClasses.map((classItem) => {
                const statusBadge = getStatusBadge(classItem.status);
                const canStart = canStartClass(classItem);

                return (
                  <View key={classItem.id} style={styles.classCard}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '15' }]}>
                      <Ionicons name={statusBadge.icon as any} size={14} color={statusBadge.color} />
                      <Text style={[styles.statusText, { color: statusBadge.color }]}>
                        {statusBadge.text}
                      </Text>
                    </View>

                    {/* Time */}
                    <View style={styles.classTime}>
                      <Ionicons name="time-outline" size={20} color={theme.colors.primary.main} />
                      <Text style={styles.timeText}>
                        {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                      </Text>
                    </View>

                    {/* Teacher Info */}
                    <View style={styles.classInfo}>
                      <View style={styles.teacherInfo}>
                        <View style={styles.teacherAvatar}>
                          <Ionicons name="person" size={24} color={theme.colors.primary.main} />
                        </View>
                        <View style={styles.teacherDetails}>
                          <Text style={styles.teacherName}>
                            Prof. {classItem.teacher?.user.first_name} {classItem.teacher?.user.last_name}
                          </Text>
                          <Text style={styles.classType}>
                            Clase {classItem.class_type === 'individual' ? 'Individual' : 'Grupal'}
                            {classItem.duration_minutes && ` • ${classItem.duration_minutes} min`}
                          </Text>
                        </View>
                      </View>

                      {/* Notes */}
                      {classItem.notes && (
                        <View style={styles.notesContainer}>
                          <Ionicons name="document-text-outline" size={14} color={theme.colors.text.secondary} />
                          <Text style={styles.notesText} numberOfLines={2}>
                            {classItem.notes}
                          </Text>
                        </View>
                      )}

                      {/* Actions */}
                      {classItem.status === 'scheduled' && (
                        <View style={styles.classActions}>
                          <TouchableOpacity
                            style={[
                              styles.startButton,
                              !canStart && styles.startButtonDisabled
                            ]}
                            onPress={() => handleStartClass(classItem)}
                            disabled={!canStart}
                          >
                            <Ionicons name="videocam" size={18} color="#FFFFFF" />
                            <Text style={styles.startButtonText}>
                              {canStart ? 'Iniciar Clase' : 'No disponible aún'}
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelClass(classItem)}
                          >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {classItem.status === 'in_progress' && (
                        <TouchableOpacity
                          style={styles.joinButton}
                          onPress={() => handleStartClass(classItem)}
                        >
                          <Ionicons name="videocam" size={18} color="#FFFFFF" />
                          <Text style={styles.joinButtonText}>Unirse a la Clase</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color={theme.colors.text.disabled} />
              <Text style={styles.emptyStateTitle}>Sin clases programadas</Text>
              <Text style={styles.emptyStateText}>
                No tienes clases para este día
              </Text>
            </View>
          )}

          {/* Add Class Button */}
          <TouchableOpacity style={styles.addClassButton} onPress={handleScheduleClass}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary.main} />
            <Text style={styles.addClassButtonText}>Agendar nueva clase</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: theme.colors.background.paper,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  dayLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.disabled,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
  },
  dayCell: {
    width: '14.28%', // 100% / 7 días
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary.main,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  dayCellPast: {
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.primary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayNumberPast: {
    color: theme.colors.text.disabled,
  },
  classDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.error,
  },
  classDotPast: {
    backgroundColor: theme.colors.text.disabled,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  classesSection: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  classesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  classesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  classesCount: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingClassesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingClassesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  classesList: {
    gap: 16,
  },
  classCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.small,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  classInfo: {
    gap: 16,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  classType: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.background.default,
    borderRadius: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  classActions: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.success,
    paddingVertical: 14,
    borderRadius: 14,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  addClassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.background.paper,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  addClassButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
});