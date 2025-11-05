import React from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
function ActivitiesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ActivitiesMain" 
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
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
      }}
    >
      <Tab.Screen 
        name="Activities"
        component={ActivitiesStack}
        options={{
          tabBarLabel: 'Activities',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🎉</Text>
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
