import React from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import EventsScreen from '../screens/EventsScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ActivityDetail" 
        component={ActivityDetailScreen}
        options={{ 
          title: 'Activity Details',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
}

// Map Stack
function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MapMain" 
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ActivityDetail" 
        component={ActivityDetailScreen}
        options={{ 
          title: 'Activity Details',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
}

// Events Stack
function EventsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="EventsMain" 
        component={EventsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ActivityDetail" 
        component={ActivityDetailScreen}
        options={{ 
          title: 'Event Details',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 25 : 8, // More padding for iOS home indicator
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 60, // Taller tab bar for iOS
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Events" 
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>📅</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
