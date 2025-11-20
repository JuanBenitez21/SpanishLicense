import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';
import type { ScheduledClass } from '@/types/calendar.types';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarScreen() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [daysWithClasses, setDaysWithClasses] = useState<number[]>([]);
  const [selectedDayClasses, setSelectedDayClasses] = useState<ScheduledClass[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    loadStudentId();
  }, [profile]);

  useEffect(() => {
    if (studentId) {
      loadCalendarData();
    }
  }, [studentId, currentDate]);

  useEffect(() => {
    if (studentId && selectedDate) {
      loadSelectedDayClasses();
    }
  }, [studentId, selectedDate]);

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
    }
  };

  const loadCalendarData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
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
      const dateStr = selectedDate.toISOString().split('T')[0];
      const startDate = dateStr;
      const endDate = dateStr;

      const classes = await calendarService.getStudentClasses(
        studentId,
        startDate,
        endDate
      );
      setSelectedDayClasses(classes);
    } catch (error) {
      console.error('Error loading selected day classes:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCancelClass = async (classId: string) => {
    Alert.alert(
      'Cancelar Clase',
      '¿Estás seguro de que deseas cancelar esta clase?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await calendarService.cancelClass(classId);
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
      await calendarService.startClass(classItem.id);
      // TODO: Navegar a pantalla de videollamada
      Alert.alert('Iniciando clase', 'Redirigiendo a la sala de videollamada...');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la clase');
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected(day) && styles.dayCellSelected,
                    isToday(day) && !isSelected(day) && styles.dayCellToday,
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected(day) && styles.dayNumberSelected,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasClasses(day) && !isSelected(day) && (
                    <View style={styles.classDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.colors.error }]}
            />
            <Text style={styles.legendText}>Clase programada</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.colors.primary.main }]}
            />
            <Text style={styles.legendText}>Hoy</Text>
          </View>
        </View>

        {/* Classes for Selected Day */}
        <View style={styles.classesSection}>
          <Text style={styles.classesSectionTitle}>
            Clases del {selectedDate.getDate()} de{' '}
            {MONTHS[selectedDate.getMonth()]}
          </Text>

          {selectedDayClasses.length > 0 ? (
            selectedDayClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classTime}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.colors.primary.main}
                  />
                  <Text style={styles.timeText}>
                    {formatTime(classItem.start_time)}
                  </Text>
                </View>

                <View style={styles.classInfo}>
                  <View style={styles.teacherInfo}>
                    <View style={styles.teacherAvatar}>
                      <Ionicons
                        name="person"
                        size={24}
                        color={theme.colors.primary.main}
                      />
                    </View>
                    <View>
                      <Text style={styles.teacherName}>
                        Prof. {classItem.teacher?.user.first_name}{' '}
                        {classItem.teacher?.user.last_name}
                      </Text>
                      <Text style={styles.classType}>
                        Clase {classItem.class_type === 'individual' ? 'Individual' : 'Grupal'}
                      </Text>
                    </View>
                  </View>

                  {classItem.status === 'scheduled' && (
                    <View style={styles.classActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleStartClass(classItem)}
                      >
                        <Ionicons name="videocam" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Iniciar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelClass(classItem.id)}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {classItem.status === 'completed' && (
                    <View style={styles.completedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.success}
                      />
                      <Text style={styles.completedText}>Completada</Text>
                    </View>
                  )}

                  {classItem.status === 'cancelled' && (
                    <View style={styles.cancelledBadge}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={theme.colors.error}
                      />
                      <Text style={styles.cancelledText}>Cancelada</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={theme.colors.text.disabled}
              />
              <Text style={styles.emptyStateText}>
                No hay clases programadas para este día
              </Text>
            </View>
          )}

          {/* Add Class Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowScheduleModal(true)}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={theme.colors.primary.main}
            />
            <Text style={styles.addButtonText}>Agendar nueva clase</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Schedule Modal - TODO: Implement full functionality */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agendar Clase</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>
              Funcionalidad de agendamiento en desarrollo...
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 20,
    backgroundColor: theme.colors.background.paper,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
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
    gap: 8,
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary.main,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
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
  classDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.error,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 16,
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
  classesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  classCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.small,
  },
  classTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
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
  classActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.success + '15',
    borderRadius: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.error + '15',
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.paper,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: 20,
  },
  modalButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});