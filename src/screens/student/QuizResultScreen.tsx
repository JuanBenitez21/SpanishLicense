import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { QuizResult } from '@/types/quiz.types';

type QuizResultScreenProps = {
  route: any;
  navigation: any;
};

export default function QuizResultScreen({ route, navigation }: QuizResultScreenProps) {
  const { result } = route.params as { result: QuizResult };

  // Calcular tiempo empleado
  const timeSpent = useMemo(() => {
    if (!result.attempt.started_at || !result.attempt.completed_at) {
      return 'N/A';
    }
    const start = new Date(result.attempt.started_at);
    const end = new Date(result.attempt.completed_at);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  }, [result.attempt]);

  const handleFinish = () => {
    // Volver a la pantalla de aprendizaje
    navigation.navigate('LearningMain');
  };

  const handleRetry = () => {
    // Volver atrás y reiniciar el quiz
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header con gradiente según resultado */}
      <LinearGradient
        colors={
          result.passed
            ? [theme.colors.success, '#059669']
            : [theme.colors.error, '#dc2626']
        }
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons
            name={result.passed ? 'checkmark-circle' : 'close-circle'}
            size={80}
            color="#FFFFFF"
          />
          <Text style={styles.headerTitle}>
            {result.passed ? '¡Felicitaciones!' : 'Sigue intentando'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {result.passed
              ? 'Has aprobado el quiz'
              : 'No alcanzaste el puntaje mínimo'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Puntaje principal */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Tu Puntaje</Text>
          <Text style={[styles.scoreValue, result.passed ? styles.scorePassed : styles.scoreFailed]}>
            {result.attempt.score}%
          </Text>
          <Text style={styles.scoreRequired}>
            Puntaje mínimo: {result.quiz.passing_score}%
          </Text>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
            <Text style={styles.statValue}>{result.correctAnswers}</Text>
            <Text style={styles.statLabel}>Correctas</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={32} color={theme.colors.error} />
            <Text style={styles.statValue}>
              {result.totalQuestions - result.correctAnswers}
            </Text>
            <Text style={styles.statLabel}>Incorrectas</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={theme.colors.primary.main} />
            <Text style={styles.statValue}>{timeSpent}</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        {/* Desglose de preguntas */}
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Revisión de Preguntas</Text>

          {result.attempt.generated_questions.map((question, index) => {
            const userAnswer = result.attempt.user_answers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <View
                key={index}
                style={[
                  styles.questionCard,
                  isCorrect ? styles.questionCorrect : styles.questionIncorrect,
                ]}
              >
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={isCorrect ? theme.colors.success : theme.colors.error}
                  />
                </View>

                <Text style={styles.questionText}>{question.question}</Text>

                <View style={styles.answerSection}>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Tu respuesta:</Text>
                    <Text
                      style={[
                        styles.answerText,
                        isCorrect ? styles.answerCorrect : styles.answerWrong,
                      ]}
                    >
                      {userAnswer || 'Sin respuesta'}
                    </Text>
                  </View>

                  {!isCorrect && (
                    <View style={styles.answerRow}>
                      <Text style={styles.answerLabel}>Respuesta correcta:</Text>
                      <Text style={[styles.answerText, styles.answerCorrect]}>
                        {question.correctAnswer}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.footer}>
        {!result.passed && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.finishButton, !result.passed && styles.finishButtonSecondary]}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>
            {result.passed ? 'Continuar' : 'Volver'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scoreCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  scoreLabel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scorePassed: {
    color: theme.colors.success,
  },
  scoreFailed: {
    color: theme.colors.error,
  },
  scoreRequired: {
    fontSize: 14,
    color: theme.colors.text.disabled,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  questionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  questionCorrect: {
    borderLeftColor: theme.colors.success,
  },
  questionIncorrect: {
    borderLeftColor: theme.colors.error,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  questionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 22,
  },
  answerSection: {
    gap: 8,
  },
  answerRow: {
    flexDirection: 'column',
    gap: 4,
  },
  answerLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background.default,
  },
  answerCorrect: {
    color: theme.colors.success,
    backgroundColor: theme.colors.success + '15',
  },
  answerWrong: {
    color: theme.colors.error,
    backgroundColor: theme.colors.error + '15',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.warning,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
  },
  finishButtonSecondary: {
    backgroundColor: theme.colors.text.secondary,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});