import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type AdminDashboardScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const { profile } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Panel de Administración</Text>
            <Text style={styles.subtitle}>Bienvenido, {profile?.first_name}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={30} color={theme.colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary.main + '20' }]}>
              <Ionicons name="people" size={32} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="person-add" size={32} color={theme.colors.success} />
            </View>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>Estudiantes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.info + '20' }]}>
              <Ionicons name="school" size={32} color={theme.colors.info} />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Profesores</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="calendar" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>48</Text>
            <Text style={styles.statLabel}>Clases Hoy</Text>
          </View>
        </View>

        {/* Admin Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Gestión</Text>
          
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary.main + '20' }]}>
                  <Ionicons name="people-outline" size={28} color={theme.colors.primary.main} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Gestionar Usuarios</Text>
                  <Text style={styles.actionSubtitle}>Ver y administrar usuarios</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <Ionicons name="book-outline" size={28} color={theme.colors.success} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Gestionar Contenido</Text>
                  <Text style={styles.actionSubtitle}>Clases, unidades y quizzes</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Ionicons name="calendar-outline" size={28} color={theme.colors.warning} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Ver Clases Programadas</Text>
                  <Text style={styles.actionSubtitle}>Todas las clases del sistema</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '20' }]}>
                  <Ionicons name="stats-chart-outline" size={28} color={theme.colors.info} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Reportes y Estadísticas</Text>
                  <Text style={styles.actionSubtitle}>Analíticas del sistema</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.error + '20' }]}>
                  <Ionicons name="key-outline" size={28} color={theme.colors.error} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Códigos de Acceso</Text>
                  <Text style={styles.actionSubtitle}>Generar y gestionar códigos</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Actividad Reciente</Text>
          
          <View style={styles.activityList}>
            {[
              { icon: 'person-add', text: 'Nuevo estudiante registrado: Juan Pérez', time: 'Hace 10 min' },
              { icon: 'checkmark-circle', text: 'Clase completada: Prof. María con Carlos', time: 'Hace 1 hora' },
              { icon: 'book', text: 'Nueva lección añadida: Presente Simple', time: 'Hace 3 horas' },
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
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