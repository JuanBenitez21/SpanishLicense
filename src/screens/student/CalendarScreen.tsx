import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(16);

  // Mock data
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const daysWithClasses = [16, 18, 22, 25];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View style={styles.monthNavigator}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>Noviembre 2024</Text>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.daysHeader}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <Text key={index} style={styles.dayLabel}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {daysInMonth.map((day) => {
            const hasClass = daysWithClasses.includes(day);
            const isSelected = day === selectedDate;
            const isToday = day === 16;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {day}
                </Text>
                {hasClass && !isSelected && <View style={styles.classDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

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
          <Text style={styles.classesSectionTitle}>
            Clases del {selectedDate} de Noviembre
          </Text>

          {selectedDate === 16 ? (
            <View style={styles.classCard}>
              <View style={styles.classTime}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary.main} />
                <Text style={styles.timeText}>10:00 AM</Text>
              </View>
              
              <View style={styles.classInfo}>
                <View style={styles.teacherInfo}>
                  <View style={styles.teacherAvatar}>
                    <Ionicons name="person" size={24} color={theme.colors.primary.main} />
                  </View>
                  <View>
                    <Text style={styles.teacherName}>Prof. María González</Text>
                    <Text style={styles.classType}>Clase Individual</Text>
                  </View>
                </View>

                <View style={styles.classActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="videocam" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Iniciar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.disabled} />
              <Text style={styles.emptyStateText}>
                No hay clases programadas para este día
              </Text>
            </View>
          )}

          {/* Add Class Button */}
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary.main} />
            <Text style={styles.addButtonText}>Agendar nueva clase</Text>
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
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
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
});