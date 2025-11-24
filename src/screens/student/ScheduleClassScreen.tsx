// src/screens/student/ScheduleClassScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';
import { calendarService } from '@/services/calendar/calendarService';
import type { TeacherWithAvailability, AvailableSlot } from '@/types/calendar.types';
import { formatLocalDate } from '@/utils/dateUtils';

const { width } = Dimensions.get('window');
const DAYS_TO_SHOW = 14; // Mostrar próximos 14 días

type ScheduleClassScreenProps = {
  navigation: any;
  route?: {
    params?: {
      selectedDate?: string;
      preselectedTeacherId?: string;
    };
  };
};

export default function ScheduleClassScreen({ navigation, route }: ScheduleClassScreenProps) {
  const { profile } = useAuth();
  
  // Estados principales
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Datos del estudiante
  const [studentId, setStudentId] = useState<string | null>(null);
  
  // Step 1: Selección de profesor
  const [teachers, setTeachers] = useState<TeacherWithAvailability[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithAvailability | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Step 2: Selección de fecha y horario
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Step 3: Confirmación
  const [notes, setNotes] = useState('');
  const [classType, setClassType] = useState<'individual' | 'group'>('individual');

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar slots cuando cambia la fecha seleccionada
  useEffect(() => {
    if (selectedTeacher && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedTeacher, selectedDate]);

  const loadInitialData = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      // Obtener ID del estudiante
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (studentError) throw studentError;
      setStudentId(student.id);

      // Cargar profesores disponibles
      const teachersData = await calendarService.getAvailableTeachers();
      setTeachers(teachersData);

      // Si hay un profesor preseleccionado
      if (route?.params?.preselectedTeacherId) {
        const preselectedTeacher = teachersData.find(
          (t: TeacherWithAvailability) => t.id === route.params?.preselectedTeacherId
        );
        if (preselectedTeacher) {
          setSelectedTeacher(preselectedTeacher);
          setStep(2);
          generateAvailableDates(preselectedTeacher);
        }
      }

      // Si hay una fecha preseleccionada
      if (route?.params?.selectedDate) {
        setSelectedDate(new Date(route.params.selectedDate));
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Generar fechas disponibles basadas en la disponibilidad del profesor
  const generateAvailableDates = useCallback((teacher: TeacherWithAvailability) => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener días de la semana con disponibilidad
    const availableDaysOfWeek = teacher.availability
      .filter(a => a.is_active)
      .map(a => a.day_of_week);

    // Generar próximos DAYS_TO_SHOW días
    for (let i = 1; i <= DAYS_TO_SHOW; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Verificar si el día de la semana tiene disponibilidad
      if (availableDaysOfWeek.includes(date.getDay())) {
        dates.push(date);
      }
    }

    setAvailableDates(dates);
    
    // Seleccionar primer día disponible por defecto
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [selectedDate]);

  // Cargar slots disponibles para la fecha seleccionada
  const loadAvailableSlots = async () => {
    if (!selectedTeacher || !selectedDate) return;

    try {
      setLoadingSlots(true);
      setSelectedSlot(null);

      const dateStr = formatLocalDate(selectedDate);
      const slots = await calendarService.getAvailableSlots(selectedTeacher.id, dateStr);
      
      // Filtrar slots pasados si es hoy
      const now = new Date();
      const filteredSlots = slots.filter(slot => {
        if (selectedDate.toDateString() === now.toDateString()) {
          const [hours, minutes] = slot.start_time.split(':').map(Number);
          const slotTime = new Date(now);
          slotTime.setHours(hours, minutes, 0, 0);
          return slotTime > now;
        }
        return true;
      });

      setAvailableSlots(filteredSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Manejar selección de profesor
  const handleSelectTeacher = (teacher: TeacherWithAvailability) => {
    setSelectedTeacher(teacher);
    setSelectedSlot(null);
    generateAvailableDates(teacher);
    setStep(2);
  };

  // Manejar selección de fecha
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // Manejar selección de slot
  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  // Ir al paso de confirmación
  const handleGoToConfirmation = () => {
    if (!selectedSlot) {
      Alert.alert('Selecciona un horario', 'Por favor selecciona un horario para tu clase');
      return;
    }
    setStep(3);
  };

  // Agendar la clase
  const handleScheduleClass = async () => {
    if (!studentId || !selectedTeacher || !selectedSlot || !selectedDate) {
      Alert.alert('Error', 'Faltan datos para agendar la clase');
      return;
    }

    try {
      setSubmitting(true);

      await calendarService.scheduleClass({
        student_id: studentId,
        teacher_id: selectedTeacher.id,
        scheduled_date: formatLocalDate(selectedDate),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        duration_minutes: 60,
        class_type: classType,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        '¡Clase Agendada! 🎉',
        `Tu clase con ${selectedTeacher.user.first_name} ha sido programada para el ${formatFullDate(selectedDate)} a las ${formatTime(selectedSlot.start_time)}`,
        [
          {
            text: 'Ir al Calendario',
            onPress: () => navigation.navigate('CalendarMain'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error scheduling class:', error);
      Alert.alert('Error', error.message || 'No se pudo agendar la clase');
    } finally {
      setSubmitting(false);
    }
  };

  // Formatear hora
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Formatear fecha corta
  const formatShortDate = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  // Formatear fecha completa
  const formatFullDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  // Filtrar profesores por búsqueda
  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.user.first_name} ${teacher.user.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Manejar navegación hacia atrás
  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else if (step === 2) {
      setStep(1);
      setSelectedTeacher(null);
      setSelectedDate(null);
      setSelectedSlot(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando profesores disponibles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 && 'Seleccionar Profesor'}
          {step === 2 && 'Elegir Horario'}
          {step === 3 && 'Confirmar Reserva'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Paso {step} de 3</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: Seleccionar Profesor */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar profesor..."
                placeholderTextColor={theme.colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.disabled} />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de profesores */}
            <View style={styles.teachersList}>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TouchableOpacity
                    key={teacher.id}
                    style={styles.teacherCard}
                    onPress={() => handleSelectTeacher(teacher)}
                  >
                    <View style={styles.teacherAvatar}>
                      <Ionicons name="person" size={32} color={theme.colors.primary.main} />
                    </View>

                    <View style={styles.teacherInfo}>
                      <Text style={styles.teacherName}>
                        {teacher.user.first_name} {teacher.user.last_name}
                      </Text>

                      <View style={styles.teacherStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="star" size={14} color={theme.colors.warning} />
                          <Text style={styles.statText}>{teacher.average_rating.toFixed(1)}</Text>
                        </View>

                        <Text style={styles.statDivider}>•</Text>

                        <View style={styles.statItem}>
                          <Ionicons name="people" size={14} color={theme.colors.text.secondary} />
                          <Text style={styles.statText}>{teacher.total_students} estudiantes</Text>
                        </View>
                      </View>

                      {teacher.bio && (
                        <Text style={styles.teacherBio} numberOfLines={2}>
                          {teacher.bio}
                        </Text>
                      )}

                      {/* Mostrar días disponibles */}
                      <View style={styles.availabilityPreview}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.success} />
                        <Text style={styles.availabilityText}>
                          {getAvailabilityPreview(teacher.availability)}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.text.disabled} />
                  <Text style={styles.emptyStateText}>
                    {searchQuery 
                      ? 'No se encontraron profesores' 
                      : 'No hay profesores disponibles'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* STEP 2: Seleccionar Fecha y Horario */}
        {step === 2 && selectedTeacher && (
          <View style={styles.stepContainer}>
            {/* Profesor seleccionado */}
            <View style={styles.selectedTeacherBanner}>
              <View style={styles.selectedTeacherAvatar}>
                <Ionicons name="person" size={24} color={theme.colors.primary.main} />
              </View>
              <View style={styles.selectedTeacherInfo}>
                <Text style={styles.selectedTeacherLabel}>Profesor seleccionado</Text>
                <Text style={styles.selectedTeacherName}>
                  {selectedTeacher.user.first_name} {selectedTeacher.user.last_name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.changeLink}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            {/* Selector de fecha */}
            <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.datesScroll}
              contentContainerStyle={styles.datesScrollContent}
            >
              {availableDates.map((date, index) => {
                const formatted = formatShortDate(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                    onPress={() => handleSelectDate(date)}
                  >
                    <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                      {formatted.day}
                    </Text>
                    <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                      {formatted.date}
                    </Text>
                    <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                      {formatted.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {availableDates.length === 0 && (
              <View style={styles.noSlotsMessage}>
                <Ionicons name="calendar-outline" size={32} color={theme.colors.text.disabled} />
                <Text style={styles.noSlotsText}>
                  Este profesor no tiene disponibilidad en los próximos {DAYS_TO_SHOW} días
                </Text>
              </View>
            )}

            {/* Selector de horario */}
            {selectedDate && (
              <>
                <Text style={styles.sectionTitle}>
                  Horarios disponibles - {formatFullDate(selectedDate)}
                </Text>

                {loadingSlots ? (
                  <View style={styles.loadingSlotsContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                    <Text style={styles.loadingSlotsText}>Cargando horarios...</Text>
                  </View>
                ) : availableSlots.length > 0 ? (
                  <View style={styles.slotsGrid}>
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedSlot?.start_time === slot.start_time;

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                          onPress={() => handleSelectSlot(slot)}
                        >
                          <Ionicons 
                            name="time-outline" 
                            size={18} 
                            color={isSelected ? '#FFFFFF' : theme.colors.primary.main} 
                          />
                          <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                            {formatTime(slot.start_time)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.noSlotsMessage}>
                    <Ionicons name="time-outline" size={32} color={theme.colors.text.disabled} />
                    <Text style={styles.noSlotsText}>
                      No hay horarios disponibles para esta fecha
                    </Text>
                    <Text style={styles.noSlotsSubtext}>
                      Prueba seleccionando otra fecha
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* STEP 3: Confirmación */}
        {step === 3 && selectedTeacher && selectedSlot && selectedDate && (
          <View style={styles.stepContainer}>
            {/* Resumen de la reserva */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen de tu clase</Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="person" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Profesor</Text>
                  <Text style={styles.summaryValue}>
                    {selectedTeacher.user.first_name} {selectedTeacher.user.last_name}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="calendar" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Fecha</Text>
                  <Text style={styles.summaryValue}>{formatFullDate(selectedDate)}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="time" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Horario</Text>
                  <Text style={styles.summaryValue}>
                    {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="videocam" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Tipo de clase</Text>
                  <Text style={styles.summaryValue}>
                    {classType === 'individual' ? 'Clase Individual' : 'Clase Grupal'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tipo de clase */}
            <Text style={styles.sectionTitle}>Tipo de clase</Text>
            <View style={styles.classTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.classTypeOption,
                  classType === 'individual' && styles.classTypeSelected,
                ]}
                onPress={() => setClassType('individual')}
              >
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={classType === 'individual' ? '#FFFFFF' : theme.colors.primary.main} 
                />
                <Text style={[
                  styles.classTypeText,
                  classType === 'individual' && styles.classTypeTextSelected,
                ]}>
                  Individual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.classTypeOption,
                  classType === 'group' && styles.classTypeSelected,
                ]}
                onPress={() => setClassType('group')}
              >
                <Ionicons 
                  name="people" 
                  size={24} 
                  color={classType === 'group' ? '#FFFFFF' : theme.colors.primary.main} 
                />
                <Text style={[
                  styles.classTypeText,
                  classType === 'group' && styles.classTypeTextSelected,
                ]}>
                  Grupal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notas opcionales */}
            <Text style={styles.sectionTitle}>Notas para el profesor (opcional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Escribe algún tema específico que quieras practicar..."
              placeholderTextColor={theme.colors.text.disabled}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.notesCounter}>{notes.length}/500</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        {step === 2 && (
          <TouchableOpacity
            style={[styles.primaryButton, !selectedSlot && styles.buttonDisabled]}
            onPress={handleGoToConfirmation}
            disabled={!selectedSlot}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {step === 3 && (
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={handleScheduleClass}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Confirmar Reserva</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Helper function para preview de disponibilidad
function getAvailabilityPreview(availability: any[]): string {
  const daysMap: { [key: number]: string } = {
    0: 'Dom',
    1: 'Lun',
    2: 'Mar',
    3: 'Mié',
    4: 'Jue',
    5: 'Vie',
    6: 'Sáb',
  };

  const activeDays = [...new Set(
    availability
      .filter(a => a.is_active)
      .map(a => a.day_of_week)
  )].sort();

  if (activeDays.length === 0) return 'Sin disponibilidad';
  if (activeDays.length === 7) return 'Todos los días';
  
  return activeDays.map(d => daysMap[d]).join(', ');
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
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 22,
  },
  
  // Search
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
  
  // Teachers List
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
  availabilityPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  
  // Selected Teacher Banner
  selectedTeacherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  selectedTeacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTeacherInfo: {
    flex: 1,
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
  changeLink: {
    fontSize: 14,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  
  // Dates Scroll
  datesScroll: {
    marginBottom: 24,
    marginHorizontal: -22,
  },
  datesScrollContent: {
    paddingHorizontal: 22,
    gap: 12,
  },
  dateCard: {
    width: 70,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.small,
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
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  dateMonthSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Slots Grid
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotCard: {
    width: (width - 44 - 24) / 3, // 3 columnas
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.paper,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.small,
  },
  slotCardSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  slotTimeSelected: {
    color: '#FFFFFF',
  },
  
  // Loading slots
  loadingSlotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingSlotsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  
  // No slots message
  noSlotsMessage: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
  },
  noSlotsText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  noSlotsSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.text.disabled,
    textAlign: 'center',
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
    marginLeft: 64,
  },
  
  // Class Type
  classTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  classTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  classTypeSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  classTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  classTypeTextSelected: {
    color: '#FFFFFF',
  },
  
  // Notes Input
  notesInput: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  notesCounter: {
    fontSize: 12,
    color: theme.colors.text.disabled,
    textAlign: 'right',
    marginTop: 8,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Bottom Container
  bottomContainer: {
    padding: 22,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});