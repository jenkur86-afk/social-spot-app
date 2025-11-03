import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { LocationProvider } from './src/contexts/LocationContext';

export default function App() {
  return (
    <LocationProvider>
      <AppNavigator />
    </LocationProvider>
  );
}