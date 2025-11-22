// src/screens/teacher/StudentsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';

interface StudentData {
  id: string;
  user_id: string;
  current_level: string;
  streak_days: number;
  total_classes_completed: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
  lastClass?: {
    scheduled_date: string;
    status: string;
  };
  progress?: number;
}

export default function StudentsScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  useFocusEffect(
    React.useCallback(() => {
      if (teacherId) {
        loadData();
      }
    }, [teacherId])
  );

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);

  const loadData = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Obtener teacher_id
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (teacherError) throw teacherError;
      setTeacherId(teacher.id);

      // Obtener estudiantes que tienen clases con este profesor
      const { data: classes, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('student_id')
        .eq('teacher_id', teacher.id)
        .neq('status', 'cancelled');

      if (classesError) throw classesError;

      // Obtener IDs únicos de estudiantes
      const uniqueStudentIds = [...new Set(classes?.map(c => c.student_id) || [])];

      if (uniqueStudentIds.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      // Obtener información de estudiantes
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          current_level,
          streak_days,
          total_classes_completed,
          user:user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .in('id', uniqueStudentIds);

      if (studentsError) throw studentsError;

      // Obtener última clase de cada estudiante con este profesor
      const studentsWithData: StudentData[] = await Promise.all(
        (studentsData || []).map(async (student: any) => {
          // Obtener última clase del estudiante con este profesor
          const { data: lastClass } = await supabase
            .from('scheduled_classes')
            .select('scheduled_date, status')
            .eq('student_id', student.id)
            .eq('teacher_id', teacher.id)
            .order('scheduled_date', { ascending: false })
            .limit(1)
            .single();

          // Calcular progreso (basado en clases completadas)
          const { data: completedClasses } = await supabase
            .from('scheduled_classes')
            .select('id')
            .eq('student_id', student.id)
            .eq('teacher_id', teacher.id)
            .eq('status', 'completed');

          const { data: totalClasses } = await supabase
            .from('scheduled_classes')
            .select('id')
            .eq('student_id', student.id)
            .eq('teacher_id', teacher.id)
            .neq('status', 'cancelled');

          const progress = totalClasses && totalClasses.length > 0
            ? Math.round((completedClasses?.length || 0) / totalClasses.length * 100)
            : 0;

          return {
            ...student,
            lastClass: lastClass || undefined,
            progress,
          };
        })
      );

      setStudents(studentsWithData);
      setFilteredStudents(studentsWithData);

    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'No se pudo cargar la lista de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(student => {
      const fullName = `${student.user.first_name} ${student.user.last_name}`.toLowerCase();
      const email = student.user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });

    setFilteredStudents(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getLastClassText = (lastClass?: { scheduled_date: string; status: string }) => {
    if (!lastClass) return 'Sin clases previas';

    const classDate = new Date(lastClass.scheduled_date);
    const now = new Date();
    const diffTime = now.getTime() - classDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Cargando estudiantes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Estudiantes</Text>
        <View style={styles.studentsCount}>
          <Text style={styles.studentsCountText}>{students.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar estudiante..."
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Students List */}
        <View style={styles.studentsList}>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => navigation.navigate('StudentDetail', { studentId: student.id })}
              >
                <View style={styles.studentAvatar}>
                  <Ionicons name="person" size={32} color={theme.colors.primary.main} />
                </View>

                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {student.user.first_name} {student.user.last_name}
                  </Text>
                  <Text style={styles.studentLastClass}>
                    Última clase: {getLastClassText(student.lastClass)}
                  </Text>

                  <View style={styles.studentStats}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{student.current_level}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${student.progress || 0}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{student.progress || 0}%</Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.miniStats}>
                    <View style={styles.miniStatItem}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.success} />
                      <Text style={styles.miniStatText}>{student.total_classes_completed} clases</Text>
                    </View>
                    <View style={styles.miniStatItem}>
                      <Ionicons name="flame-outline" size={14} color={theme.colors.warning} />
                      <Text style={styles.miniStatText}>{student.streak_days} días</Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.colors.text.disabled} />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No se encontraron estudiantes' : 'Sin estudiantes'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? 'Intenta con otro nombre o email'
                  : 'Aún no tienes estudiantes con clases programadas'}
              </Text>
            </View>
          )}
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
    paddingVertical: 20,
    backgroundColor: theme.colors.background.paper,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  studentsCount: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  studentsCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  miniStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
  },
});
