// src/screens/shared/SelectStudentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { supabase } from '@/services/supabase/client';
import { chatService } from '@/services/chat/chatService';

type SelectStudentScreenProps = {
  navigation: any;
};

interface Student {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  current_level: string;
}

export default function SelectStudentScreen({ navigation }: SelectStudentScreenProps) {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [profile]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);

  const loadStudents = async () => {
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

      // Get students who have had classes with this teacher
      const { data: classes, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('student_id')
        .eq('teacher_id', teacher.id)
        .neq('status', 'cancelled');

      if (classesError) throw classesError;

      const uniqueStudentIds = [...new Set(classes?.map(c => c.student_id) || [])];

      if (uniqueStudentIds.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      // Get student details
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          current_level,
          user:profiles!students_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .in('id', uniqueStudentIds);

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading students:', error);
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
    const filtered = students.filter((student) => {
      const fullName = `${student.user.first_name} ${student.user.last_name}`.toLowerCase();
      return fullName.includes(query);
    });

    setFilteredStudents(filtered);
  };

  const handleStudentSelect = async (student: Student) => {
    if (!teacherId) return;

    try {
      // Get or create conversation
      const conversation = await chatService.getOrCreateConversation(
        student.id,
        teacherId
      );

      // Navigate to chat screen
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherParticipant: {
          id: student.id,
          name: `${student.user.first_name} ${student.user.last_name}`,
          avatar_url: student.user.avatar_url,
          role: 'student' as const,
        },
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seleccionar Estudiante</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredStudents.length > 0 ? (
          <View style={styles.studentsList}>
            {filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => handleStudentSelect(student)}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Ionicons name="person" size={28} color={theme.colors.primary.main} />
                </View>

                {/* Content */}
                <View style={styles.studentContent}>
                  <Text style={styles.studentName}>
                    {student.user.first_name} {student.user.last_name}
                  </Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Nivel {student.current_level}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.disabled} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No se encontraron estudiantes' : 'Sin estudiantes'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Intenta con otro nombre'
                : 'No tienes estudiantes registrados aún'}
            </Text>
          </View>
        )}
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
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    gap: 12,
    ...theme.shadows.small,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentContent: {
    flex: 1,
    gap: 6,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary.main + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
