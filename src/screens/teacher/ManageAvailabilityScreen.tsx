// src/screens/teacher/ManageAvailabilityScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { calendarService } from '@/services/calendar/calendarService';
import { supabase } from '@/services/supabase/client';

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DayAvailability {
  day: number;
  dayName: string;
  slots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { day: 0, name: 'Domingo', shortName: 'D' },
  { day: 1, name: 'Lunes', shortName: 'L' },
  { day: 2, name: 'Martes', shortName: 'M' },
  { day: 3, name: 'Miércoles', shortName: 'M' },
  { day: 4, name: 'Jueves', shortName: 'J' },
  { day: 5, name: 'Viernes', shortName: 'V' },
  { day: 6, name: 'Sábado', shortName: 'S' },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
];

export default function ManageAvailabilityScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [weekAvailability, setWeekAvailability] = useState<DayAvailability[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('17:00');

  useEffect(() => {
    loadAvailability();
  }, [profile]);

  const loadAvailability = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get teacher_id
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (teacherError) throw teacherError;
      setTeacherId(teacher.id);

      // Get current availability
      const availability = await calendarService.getTeacherAvailability(teacher.id);

      // Organize by day and deduplicate
      const dayAvailabilityMap = new Map<number, Map<string, TimeSlot>>();

      availability.forEach((slot) => {
        if (!dayAvailabilityMap.has(slot.day_of_week)) {
          dayAvailabilityMap.set(slot.day_of_week, new Map<string, TimeSlot>());
        }

        // Use a unique key combining start_time and end_time to avoid duplicates
        const slotKey = `${slot.start_time}-${slot.end_time}`;
        const dayMap = dayAvailabilityMap.get(slot.day_of_week)!;

        // Only add if not already present
        if (!dayMap.has(slotKey)) {
          dayMap.set(slotKey, {
            id: slot.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active,
          });
        }
      });

      // Create week structure
      const weekData: DayAvailability[] = DAYS_OF_WEEK.map(({ day, name }) => {
        const dayMap = dayAvailabilityMap.get(day);
        return {
          day,
          dayName: name,
          slots: dayMap ? Array.from(dayMap.values()) : [],
        };
      });

      setWeekAvailability(weekData);
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'No se pudo cargar la disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    if (selectedDay === null) {
      Alert.alert('Error', 'Por favor selecciona un día');
      return;
    }

    if (newSlotStart >= newSlotEnd) {
      Alert.alert('Error', 'La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    const newSlot: TimeSlot = {
      day_of_week: selectedDay,
      start_time: newSlotStart,
      end_time: newSlotEnd,
      is_active: true,
    };

    setWeekAvailability((prev) =>
      prev.map((day) =>
        day.day === selectedDay
          ? { ...day, slots: [...day.slots, newSlot] }
          : day
      )
    );

    setShowAddSlot(false);
    setNewSlotStart('09:00');
    setNewSlotEnd('17:00');
  };

  const handleToggleSlot = (dayIndex: number, slotIndex: number) => {
    setWeekAvailability((prev) =>
      prev.map((day, dIdx) =>
        dIdx === dayIndex
          ? {
              ...day,
              slots: day.slots.map((slot, sIdx) =>
                sIdx === slotIndex ? { ...slot, is_active: !slot.is_active } : slot
              ),
            }
          : day
      )
    );
  };

  const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
    setWeekAvailability((prev) =>
      prev.map((day, dIdx) =>
        dIdx === dayIndex
          ? {
              ...day,
              slots: day.slots.filter((_, sIdx) => sIdx !== slotIndex),
            }
          : day
      )
    );
  };

  const handleSave = async () => {
    if (!teacherId) return;

    try {
      setSaving(true);

      // Flatten all slots
      const allSlots: Omit<TimeSlot, 'id'>[] = [];
      weekAvailability.forEach((day) => {
        day.slots.forEach((slot) => {
          allSlots.push({
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active,
          });
        });
      });

      await calendarService.updateTeacherAvailability(teacherId, allSlots);

      Alert.alert('Éxito', 'Disponibilidad actualizada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'No se pudo guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando disponibilidad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Disponibilidad</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary.main} />
            <Text style={styles.instructionsText}>
              Configura tus horarios disponibles para cada día de la semana. Los estudiantes podrán
              agendar clases en los horarios que marques como activos.
            </Text>
          </View>

          {/* Week Days */}
          {weekAvailability.map((day, dayIndex) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <TouchableOpacity
                  style={styles.addSlotButton}
                  onPress={() => {
                    setSelectedDay(day.day);
                    setShowAddSlot(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary.main} />
                </TouchableOpacity>
              </View>

              {/* Time Slots */}
              {day.slots.length > 0 ? (
                <View style={styles.slotsContainer}>
                  {day.slots.map((slot, slotIndex) => (
                    <View
                      key={`${day.day}-${slotIndex}`}
                      style={[
                        styles.slotCard,
                        !slot.is_active && styles.slotCardInactive,
                      ]}
                    >
                      <View style={styles.slotInfo}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color={slot.is_active ? theme.colors.primary.main : theme.colors.text.disabled}
                        />
                        <Text
                          style={[
                            styles.slotTime,
                            !slot.is_active && styles.slotTimeInactive,
                          ]}
                        >
                          {slot.start_time} - {slot.end_time}
                        </Text>
                      </View>

                      <View style={styles.slotActions}>
                        <TouchableOpacity
                          onPress={() => handleToggleSlot(dayIndex, slotIndex)}
                          style={styles.slotActionButton}
                        >
                          <Ionicons
                            name={slot.is_active ? 'toggle' : 'toggle-outline'}
                            size={28}
                            color={slot.is_active ? theme.colors.success : theme.colors.text.disabled}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveSlot(dayIndex, slotIndex)}
                          style={styles.slotActionButton}
                        >
                          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySlots}>
                  <Text style={styles.emptyText}>No hay horarios configurados</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Slot Modal */}
      {showAddSlot && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Horario</Text>
            <Text style={styles.modalSubtitle}>
              {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.name}
            </Text>

            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Hora Inicio</Text>
                <ScrollView style={styles.timePicker} showsVerticalScrollIndicator={false}>
                  {TIME_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[
                        styles.timeOption,
                        newSlotStart === time && styles.timeOptionSelected,
                      ]}
                      onPress={() => setNewSlotStart(time)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          newSlotStart === time && styles.timeOptionTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Hora Fin</Text>
                <ScrollView style={styles.timePicker} showsVerticalScrollIndicator={false}>
                  {TIME_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeOption,
                        newSlotEnd === time && styles.timeOptionSelected,
                      ]}
                      onPress={() => setNewSlotEnd(time)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          newSlotEnd === time && styles.timeOptionTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddSlot(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddSlot}
              >
                <Text style={styles.modalAddText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    padding: 22,
    gap: 16,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary.main + '10',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  addSlotButton: {
    padding: 4,
  },
  slotsContainer: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.default,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary.main + '30',
  },
  slotCardInactive: {
    backgroundColor: theme.colors.background.default,
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  slotTimeInactive: {
    color: theme.colors.text.disabled,
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotActionButton: {
    padding: 4,
  },
  emptySlots: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.disabled,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.medium,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timePickerSection: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  timePicker: {
    maxHeight: 200,
    backgroundColor: theme.colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timeOptionSelected: {
    backgroundColor: theme.colors.primary.main + '20',
  },
  timeOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.background.default,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonContainer: {
    padding: 22,
    paddingTop: 12,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    ...theme.shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
