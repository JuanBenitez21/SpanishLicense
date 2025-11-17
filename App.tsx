// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/services/auth/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { theme } from './src/theme/theme';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {!user ? (
        <AuthNavigator />
      ) : (
        // Aquí irán los navegadores de Student/Teacher/Admin
        // Por ahora solo mostramos una vista temporal
        <View style={styles.tempContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
  },
  tempContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
  },
});