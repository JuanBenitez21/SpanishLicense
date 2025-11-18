import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

export default function StudentsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Estudiantes</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar estudiante..."
          placeholderTextColor={theme.colors.text.disabled}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Students List */}
        <View style={styles.studentsList}>
          {[
            { name: 'Juan Pérez', level: 'A1', progress: 75, lastClass: 'Hace 2 días' },
            { name: 'María García', level: 'A2', progress: 60, lastClass: 'Hoy' },
            { name: 'Carlos López', level: 'A1', progress: 45, lastClass: 'Hace 1 semana' },
            { name: 'Ana Martínez', level: 'B1', progress: 85, lastClass: 'Ayer' },
          ].map((student, index) => (
            <TouchableOpacity key={index} style={styles.studentCard}>
              <View style={styles.studentAvatar}>
                <Ionicons name="person" size={32} color={theme.colors.primary.main} />
              </View>
              
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentLastClass}>Última clase: {student.lastClass}</Text>
                
                <View style={styles.studentStats}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{student.level}</Text>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${student.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{student.progress}%</Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>
          ))}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    marginHorizontal: 22,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    ...theme.shadows.small,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  studentsList: {
    paddingHorizontal: 22,
    gap: 12,
    paddingBottom: 20,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    ...theme.shadows.small,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    gap: 6,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  studentLastClass: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  studentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.colors.success + '20',
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});