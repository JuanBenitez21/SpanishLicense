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
import ScheduleClassScreen from '@/screens/student/ScheduleClassScreen';
import ChatListScreen from '@/screens/shared/ChatListScreen';
import ChatScreen from '@/screens/shared/ChatScreen';
import WaitingRoomScreen from '@/screens/video/WaitingRoomScreen';
import VideoCallScreen from '@/screens/video/VideoCallScreen';

// Type definitions
export type HomeStackParamList = {
  HomeMain: undefined;
  Profile: undefined;
  ChatList: undefined;
  Chat: {
    conversationId?: string;
    teacherId?: string;
    teacherName?: string;
  };
};

export type LearningStackParamList = {
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

export type CalendarStackParamList = {
  CalendarMain: undefined;
  ScheduleClass: {
    selectedDate?: string;
    preselectedTeacherId?: string;
  };
  WaitingRoom: {
    classId: string;
    channelName: string;
    token: string;
    isTeacher: boolean;
    teacherName?: string;
    studentName?: string;
  };
  VideoCall: {
    classId: string;
    channelName: string;
    isTeacher: boolean;
    teacherName?: string;
    studentName?: string;
  };
};

export type StudentTabParamList = {
  Home: undefined;
  Learning: undefined;
  Calendar: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();
const HomeStackNav = createStackNavigator<HomeStackParamList>();
const LearningStackNav = createStackNavigator<LearningStackParamList>();
const CalendarStackNav = createStackNavigator<CalendarStackParamList>();

// Stack para Home
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="Profile" component={ProfileScreen} />
      <HomeStackNav.Screen name="ChatList" component={ChatListScreen} />
      <HomeStackNav.Screen name="Chat" component={ChatScreen} />
    </HomeStackNav.Navigator>
  );
}

// Stack para Learning
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

// Stack para Calendar
function CalendarStack() {
  return (
    <CalendarStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStackNav.Screen name="CalendarMain" component={CalendarScreen} />
      <CalendarStackNav.Screen
        name="ScheduleClass"
        component={ScheduleClassScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <CalendarStackNav.Screen
        name="WaitingRoom"
        component={WaitingRoomScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <CalendarStackNav.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
    </CalendarStackNav.Navigator>
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