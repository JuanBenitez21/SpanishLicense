import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';
import type { TeacherWithAvailability, AvailableSlot } from '@/types/calendar.types';

type ScheduleClassScreenProps = {
  navigation: any;
  route?: {
    params?: {
      selectedDate?: string;
    };
  };
};

export default function ScheduleClassScreen({ navigation, route }: ScheduleClassScreenProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [teachers, setTeachers] = useState<TeacherWithAvailability[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithAvailability | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    route?.params?.selectedDate ? new Date(route.params.selectedDate) : new Date()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadStudentId();
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      loadAvailableSlots();
    }
  }, [selectedTeacher, selectedDate]);

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

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getAvailableTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
      Alert.alert('Error', 'No se pudieron cargar los profesores');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedTeacher) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const slots = await calendarService.getAvailableSlots(
        selectedTeacher.id,
        dateStr
      );
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios disponibles');
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.user.first_name} ${teacher.user.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleSelectTeacher = (teacher: TeacherWithAvailability) => {
    setSelectedTeacher(teacher);
    setStep(2);
  };

  const handleSchedule = async () => {
    if (!studentId || !selectedTeacher || !selectedSlot) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      await calendarService.scheduleClass({
        student_id: studentId,
        teacher_id: selectedTeacher.id,
        scheduled_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        duration_minutes: 60,
        class_type: 'individual',
        notes,
      });

      Alert.alert('¡Éxito!', 'Tu clase ha sido agendada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error scheduling class:', error);
      Alert.alert('Error', 'No se pudo agendar la clase');
    }
  };

  const getNextDays = (count: number = 7) => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const formatDate = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando profesores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 2) {
              setStep(1);
              setSelectedTeacher(null);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Clase</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDots}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>
        <Text style={styles.progressText}>
          Paso {step} de 2
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          /* Step 1: Select Teacher */
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Selecciona un profesor</Text>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.text.disabled}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar profesor..."
                placeholderTextColor={theme.colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Teachers List */}
            <View style={styles.teachersList}>
              {filteredTeachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  style={styles.teacherCard}
                  onPress={() => handleSelectTeacher(teacher)}
                >
                  <View style={styles.teacherAvatar}>
                    <Ionicons
                      name="person"
                      size={32}
                      color={theme.colors.primary.main}
                    />
                  </View>

                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>
                      {teacher.user.first_name} {teacher.user.last_name}
                    </Text>

                    <View style={styles.teacherStats}>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="star"
                          size={14}
                          color={theme.colors.warning}
                        />
                        <Text style={styles.statText}>{teacher.average_rating.toFixed(1)}</Text>
                      </View>

                      <Text style={styles.statDivider}>•</Text>

                      <View style={styles.statItem}>
                        <Ionicons
                          name="people"
                          size={14}
                          color={theme.colors.text.secondary}
                        />
                        <Text style={styles.statText}>
                          {teacher.total_students} estudiantes
                        </Text>
                      </View>
                    </View>

                    {teacher.bio && (
                      <Text style={styles.teacherBio} numberOfLines={2}>
                        {teacher.bio}
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={theme.colors.text.disabled}
                  />
                </TouchableOpacity>
              ))}

              {filteredTeachers.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={theme.colors.text.disabled}
                  />
                  <Text style={styles.emptyStateText}>
                    No se encontraron profesores
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Step 2: Select Date and Time */
          <View style={styles.content}>
            <View style={styles.selectedTeacherCard}>
              <View style={styles.teacherAvatar}>
                <Ionicons name="person" size={24} color={theme.colors.primary.main} />
              </View>
              <View>
                <Text style={styles.selectedTeacherLabel}>Profesor seleccionado</Text>
                <Text style={styles.selectedTeacherName}>
                  {selectedTeacher?.user.first_name} {selectedTeacher?.user.last_name}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Selecciona fecha</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.datesScroll}
              contentContainerStyle={styles.datesScrollContent}
            >
              {getNextDays().map((date, index) => {
                const isSelected =
                  date.toDateString() === selectedDate.toDateString();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        isSelected && styles.dateDaySelected,
                      ]}
                    >
                      {formatDate(date).split(' ')[0]}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumber,
                        isSelected && styles.dateNumberSelected,
                      ]}
                    >
                      {formatDate(date).split(' ')[1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionTitle}>Horarios disponibles</Text>

            {availableSlots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot, index) => {
                  const isSelected =
                    selectedSlot?.start_time === slot.start_time;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotCard,
                        isSelected && styles.slotCardSelected,
                      ]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={
                          isSelected
                            ? '#FFFFFF'
                            : theme.colors.primary.main
                        }
                      />
                      <Text
                        style={[
                          styles.slotTime,
                          isSelected && styles.slotTimeSelected,
                        ]}
                      >
                        {formatTime(slot.start_time)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={theme.colors.text.disabled}
                />
                <Text style={styles.emptyStateText}>
                  No hay horarios disponibles para esta fecha
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Notas (opcional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Agrega alguna nota para el profesor..."
              placeholderTextColor={theme.colors.text.disabled}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      {step === 2 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.scheduleButton,
              !selectedSlot && styles.scheduleButtonDisabled,
            ]}
            onPress={handleSchedule}
            disabled={!selectedSlot}
          >
            <Text style={styles.scheduleButtonText}>Confirmar clase</Text>
          </TouchableOpacity>
        </View>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary.main,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  content: {
    padding: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    gap: 12,
    ...theme.shadows.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  teachersList: {
    gap: 12,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    ...theme.shadows.small,
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherInfo: {
    flex: 1,
    gap: 6,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  teacherStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  statDivider: {
    fontSize: 12,
    color: theme.colors.text.disabled,
  },
  teacherBio: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  selectedTeacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main + '15',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  selectedTeacherLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  selectedTeacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  datesScroll: {
    marginBottom: 24,
  },
  datesScrollContent: {
    gap: 12,
    paddingRight: 22,
  },
  dateCard: {
    width: 70,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  slotCard: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.paper,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotCardSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  slotTimeSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 100,
    ...theme.shadows.small,
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
  bottomContainer: {
    padding: 22,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  scheduleButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleButtonDisabled: {
    opacity: 0.5,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});