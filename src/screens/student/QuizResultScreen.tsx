import React from 'react';
import { View, Text } from 'react-native';

type QuizResultScreenProps = {
  route: any;
  navigation: any;
};

export default function QuizResultScreen({ route, navigation }: QuizResultScreenProps) {
    const { result } = route.params; // QuizResult type

    return (
      <View>
        <Text>Puntaje: {result.attempt.score}%</Text>
        <Text>{result.passed ? '¡Aprobado!' : 'No aprobado'}</Text>
        <Text>{result.correctAnswers}/{result.totalQuestions} correctas</Text>

        {/* Mostrar resumen de cada pregunta */}
        {result.attempt.generated_questions.map((q: any, index: number) => (
          <View key={index}>
            <Text>{q.question}</Text>
            <Text>Tu respuesta: {result.attempt.user_answers[index]}</Text>
            <Text>Correcta: {q.correctAnswer}</Text>
          </View>
        ))}
      </View>
    );
  }