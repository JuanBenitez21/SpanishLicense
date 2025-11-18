import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useAuth } from '@/services/auth/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type HomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { profile } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola {profile?.first_name}</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.level}>A1</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[theme.colors.primary.main, theme.colors.primary.dark]}
                  style={[styles.progressFill, { width: '70%' }]}
                />
              </View>
              <Text style={styles.percentage}>70%</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('ChatList')}
            >
              <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text.primary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={30} color={theme.colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Learning Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>📚</Text>
              <Text style={styles.sectionTitle}>Continúa Aprendiendo</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todo →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.lessonCard}>
            <View style={styles.lessonThumbnail}>
              <Ionicons name="play-circle" size={40} color={theme.colors.primary.main} />
            </View>
            <View style={styles.lessonContent}>
              <Text style={styles.lessonTitle}>Clase 3</Text>
              <Text style={styles.lessonSubtitle}>Saludos básicos</Text>
              <View style={styles.lessonProgress}>
                <View style={styles.progressDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
                <Text style={styles.lessonPercentage}>60%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Upcoming Classes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>🗓️</Text>
              <Text style={styles.sectionTitle}>Próximas Clases</Text>
            </View>
          </View>

          <View style={styles.classCard}>
            <View style={styles.classLeft}>
              <View style={styles.teacherAvatar}>
                <Ionicons name="person" size={24} color={theme.colors.primary.main} />
              </View>
              <View>
                <Text style={styles.teacherName}>Prof. María</Text>
                <Text style={styles.classTime}>Hoy • 3:00 PM</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Explore Cultures Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>🌍</Text>
              <Text style={styles.sectionTitle}>Explora Culturas</Text>
            </View>
          </View>

          <View style={styles.culturesContainer}>
            {[
              { flag: '🇪🇸', name: 'España' },
              { flag: '🇲🇽', name: 'México' },
              { flag: '🇦🇷', name: 'Argentina' },
            ].map((culture, index) => (
              <TouchableOpacity key={index} style={styles.cultureCard}>
                <Text style={styles.cultureFlag}>{culture.flag}</Text>
                <Text style={styles.cultureName}>{culture.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>🏆</Text>
              <Text style={styles.sectionTitle}>Logros Recientes</Text>
            </View>
          </View>

          <View style={styles.achievementsContainer}>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🔥</Text>
              <Text style={styles.achievementText}>Racha: 7 días</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>⭐</Text>
              <Text style={styles.achievementText}>Nivel A1</Text>
            </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  level: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.paper,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  section: {
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  lessonCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    ...theme.shadows.small,
  },
  lessonThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  lessonProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary.main,
  },
  lessonPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 16,
    ...theme.shadows.small,
  },
  classLeft: {
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
  classTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  culturesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cultureCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  cultureFlag: {
    fontSize: 36,
    marginBottom: 8,
  },
  cultureName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  achievementsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});