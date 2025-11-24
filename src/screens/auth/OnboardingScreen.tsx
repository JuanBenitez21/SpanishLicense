// src/screens/auth/OnboardingScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { Button } from '../../components/common/Button';
import { StackNavigationProp } from '@react-navigation/stack';

type OnboardingScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#FFFFFF', '#F5F7FA']}
        style={styles.gradient}
      >
        {/* Elipse decorativa superior */}
        <View style={styles.ellipseTop} />

        {/* Logo y Branding */}
        <View style={styles.header}>
          <Text style={styles.logo}></Text>
          <Text style={styles.appName}>SpanishLicense</Text>
          <Text style={styles.tagline}>Aprende español con nativos</Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <Button
            title="Crear Cuenta"
            subtitle="Comienza tu viaje ahora"
            onPress={() => navigation.navigate('Register')}
            variant="primary"
            style={styles.primaryButton}
          />

          <Button
            title="Ya tengo cuenta"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
            style={styles.secondaryButton}
          />

          {/* Trust Signals */}
          <View style={styles.trustSignals}>
            <View style={styles.trustItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.trustText}>Profesores nativos certificados</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.trustText}>Más de 10,000 estudiantes</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.trustText}>Clases en vivo y pregrabadas</Text>
            </View>
          </View>
        </View>

        {/* Ilustración o espacio */}
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>📚</Text>
        </View>

        {/* Elipse decorativa inferior */}
        <View style={styles.ellipseBottom} />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  ellipseTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.primary.main,
    opacity: 0.1,
  },
  ellipseBottom: {
    position: 'absolute',
    bottom: -120,
    left: -90,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: theme.colors.primary.main,
    opacity: 0.15,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.secondary.main,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.primary.main,
  },
  buttonsContainer: {
    paddingHorizontal: 22,
    marginTop: 'auto',
    marginBottom: 40,
  },
  primaryButton: {
    marginBottom: 16,
  },
  secondaryButton: {
    marginBottom: 24,
  },
  trustSignals: {
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 16,
    color: theme.colors.success,
  },
  trustText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  illustration: {
    position: 'absolute',
    bottom: 200,
    alignSelf: 'center',
    opacity: 0.3,
  },
  illustrationEmoji: {
    fontSize: 120,
  },
});