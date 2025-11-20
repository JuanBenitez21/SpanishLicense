// src/screens/teacher/TeacherHomeScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type TeacherHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function TeacherHomeScreen({ navigation }: TeacherHomeScreenProps) {
  const { profile } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Estudiantes Activos</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={32} color={theme.colors.success} />
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Clases Hoy</Text>
          </View>
        </View>

        {/* Upcoming Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Próximas Clases</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.classList}>
            {[
              { time: '10:00 AM', student: 'Juan Pérez', type: 'Individual' },
              { time: '11:30 AM', student: 'María García', type: 'Individual' },
              { time: '3:00 PM', student: 'Carlos López', type: 'Grupal' },
            ].map((classItem, index) => (
              <View key={index} style={styles.classCard}>
                <View style={styles.classLeft}>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.primary.main} />
                    <Text style={styles.classTime}>{classItem.time}</Text>
                  </View>
                  <Text style={styles.studentName}>{classItem.student}</Text>
                  <View style={styles.classTypeBadge}>
                    <Text style={styles.classTypeText}>{classItem.type}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.startButton}>
                  <Ionicons name="videocam" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary.main + '20' }]}>
                <Ionicons name="calendar-outline" size={28} color={theme.colors.primary.main} />
              </View>
              <Text style={styles.actionText}>Gestionar Disponibilidad</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
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

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Actividad Reciente</Text>
          
          <View style={styles.activityList}>
            {[
              { icon: 'checkmark-circle', text: 'Clase completada con Juan Pérez', time: 'Hace 2 horas' },
              { icon: 'star', text: 'Nueva reseña: 5 estrellas de María García', time: 'Hace 5 horas' },
              { icon: 'calendar', text: 'Nueva clase agendada para mañana', time: 'Hace 1 día' },
            ].map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name={activity.icon as any} size={20} color={theme.colors.primary.main} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
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
    paddingVertical: 20,
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
    marginBottom: 16,
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
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...theme.shadows.small,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});