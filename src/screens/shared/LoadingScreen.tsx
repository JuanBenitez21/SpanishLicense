import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme/theme';

export default function LoadingScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#FFFFFF', '#F5F7FA']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>🇪🇸</Text>
          <Text style={styles.appName}>SpanishLicense</Text>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary.main} 
            style={styles.loader}
          />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.secondary.main,
    marginBottom: 40,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});