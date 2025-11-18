// src/navigation/StudentNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

// Screens
import HomeScreen from '@/screens/student/HomeScreen';
import LearningScreen from '@/screens/student/LearningScreen';
import CalendarScreen from '@/screens/student/CalendarScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';
import VideoPlayerScreen from '@/screens/student/VideoPlayerScreen';
import QuizResultScreen from '@/screens/student/QuizResultScreen';
import QuizScreen from '@/screens/student/QuizScreen';

type LearningStackParamList = {
  LearningMain: undefined;
  VideoPlayer: {
    lesson: any;
  };
  Quiz: {
    lessonId: string;
  };
  QuizResult: {
    result: any;
  };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const LearningStackNav = createStackNavigator<LearningStackParamList>();

// Stack para cada tab (para poder navegar a otras pantallas)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function LearningStack() {
  return (
    <LearningStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LearningStackNav.Screen name="LearningMain" component={LearningScreen} />
      <LearningStackNav.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <LearningStackNav.Screen name="Quiz" component={QuizScreen} />
      <LearningStackNav.Screen name="QuizResult" component={QuizResultScreen} />
    </LearningStackNav.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarMain" component={CalendarScreen} />
    </Stack.Navigator>
  );
}

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Learning') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.disabled,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background.paper,
          ...theme.shadows.medium,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name="Learning" 
        component={LearningStack}
        options={{ tabBarLabel: 'Aprender' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack}
        options={{ tabBarLabel: 'Calendario' }}
      />
    </Tab.Navigator>
  );
}