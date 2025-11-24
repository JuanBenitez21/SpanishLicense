import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';

// Screens
import TeacherHomeScreen from '@/screens/teacher/TeacherHomeScreen';
import StudentsScreen from '@/screens/teacher/StudentsScreen';
import StudentDetailScreen from '@/screens/teacher/StudentDetailScreen';
import TeacherCalendarScreen from '@/screens/teacher/TeacherCalendarScreen';
import ManageAvailabilityScreen from '@/screens/teacher/ManageAvailabilityScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';
import ChatListScreen from '@/screens/shared/ChatListScreen';
import ChatScreen from '@/screens/shared/ChatScreen';
import SelectStudentScreen from '@/screens/shared/SelectStudentScreen';
import WaitingRoomScreen from '@/screens/video/WaitingRoomScreen';
import VideoCallScreen from '@/screens/video/VideoCallScreen';

// Type definitions
export type TeacherCalendarStackParamList = {
  CalendarMain: undefined;
  ManageAvailability: undefined;
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

const Tab = createBottomTabNavigator();
const HomeStackNav = createStackNavigator();
const StudentsStackNav = createStackNavigator();
const CalendarStackNav = createStackNavigator<TeacherCalendarStackParamList>();

// Stack para cada tab
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="TeacherHomeMain" component={TeacherHomeScreen} />
      <HomeStackNav.Screen name="Profile" component={ProfileScreen} />
      <HomeStackNav.Screen name="ChatList" component={ChatListScreen} />
      <HomeStackNav.Screen name="Chat" component={ChatScreen} />
      <HomeStackNav.Screen name="SelectStudent" component={SelectStudentScreen} />
    </HomeStackNav.Navigator>
  );
}

function StudentsStack() {
  return (
    <StudentsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <StudentsStackNav.Screen name="StudentsMain" component={StudentsScreen} />
      <StudentsStackNav.Screen name="StudentDetail" component={StudentDetailScreen} />
    </StudentsStackNav.Navigator>
  );
}

function CalendarStack() {
  return (
    <CalendarStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStackNav.Screen name="CalendarMain" component={TeacherCalendarScreen} />
      <CalendarStackNav.Screen name="ManageAvailability" component={ManageAvailabilityScreen} />
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

export default function TeacherNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
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
        name="Students"
        component={StudentsStack}
        options={{ tabBarLabel: 'Estudiantes' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{ tabBarLabel: 'Calendario' }}
      />
    </Tab.Navigator>
  );
}