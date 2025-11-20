import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type ProfileScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { profile, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'student':
        return 'Estudiante';
      case 'teacher':
        return 'Profesor';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color={theme.colors.primary.main} />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleName(profile?.role || '')}</Text>
          </View>
        </View>

        {/* Stats Section (only for students) */}
        {profile?.role === 'student' && (
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Días de racha</Text>
              <Ionicons name="flame" size={24} color={theme.colors.warning} style={styles.statIcon} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>A1</Text>
              <Text style={styles.statLabel}>Nivel actual</Text>
              <Ionicons name="trophy" size={24} color={theme.colors.success} style={styles.statIcon} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>15</Text>
              <Text style={styles.statLabel}>Clases completadas</Text>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary.main} style={styles.statIcon} />
            </View>
          </View>
        )}

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.primary.main + '20' }]}>
                <Ionicons name="person-outline" size={24} color={theme.colors.primary.main} />
              </View>
              <Text style={styles.menuItemText}>Editar Perfil</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.info + '20' }]}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.info} />
              </View>
              <Text style={styles.menuItemText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
              </View>
              <Text style={styles.menuItemText}>Privacidad y Seguridad</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="help-circle-outline" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.menuItemText}>Ayuda y Soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.text.secondary + '20' }]}>
                <Ionicons name="document-text-outline" size={24} color={theme.colors.text.secondary} />
              </View>
              <Text style={styles.menuItemText}>Términos y Condiciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: theme.colors.background.paper,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.background.paper,
    ...theme.shadows.medium,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background.paper,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary.main + '20',
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
    textTransform: 'uppercase',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0.3,
  },
  menuSection: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  logoutSection: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.error + '15',
    borderRadius: 16,
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.text.disabled,
  },
});