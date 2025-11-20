import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/services/auth/AuthContext';

// Navigators
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import TeacherNavigator from './TeacherNavigator';
import AdminNavigator from './AdminNavigator';

// Screens
import LoadingScreen from '@/screens/shared/LoadingScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    // Simular un pequeño delay para asegurar que el perfil esté cargado
    if (!loading) {
      const timer = setTimeout(() => {
        setIsCheckingRole(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, profile]);

  // Mostrar loading mientras se verifica la autenticación y el rol
  if (loading || isCheckingRole) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  // Si no hay usuario autenticado, mostrar Auth
  if (!user || !profile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // Según el rol, mostrar el navegador correspondiente
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {profile.role === 'student' && (
        <Stack.Screen name="Student" component={StudentNavigator} />
      )}
      {profile.role === 'teacher' && (
        <Stack.Screen name="Teacher" component={TeacherNavigator} />
      )}
      {profile.role === 'admin' && (
        <Stack.Screen name="Admin" component={AdminNavigator} />
      )}
    </Stack.Navigator>
  );
}