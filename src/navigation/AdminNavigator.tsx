import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';

const Stack = createStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}