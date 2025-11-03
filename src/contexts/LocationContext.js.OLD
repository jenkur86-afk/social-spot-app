import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoordinatesFromZip } from '../utils/geocoding';

const LocationContext = createContext();
const LOCATION_STORAGE_KEY = '@global_location_filter';

export function LocationProvider({ children }) {
  const [globalLocation, setGlobalLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  useEffect(() => {
    if (!loading && globalLocation) {
      saveLocation();
    }
  }, [globalLocation, loading]);

  async function loadSavedLocation() {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        setGlobalLocation(location);
        console.log('🌍 Loaded global location:', location.zipCode, `${location.radius}mi`);
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveLocation() {
    try {
      if (globalLocation) {
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(globalLocation));
        console.log('💾 Saved global location:', globalLocation.zipCode, `${globalLocation.radius}mi`);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  async function updateLocation(searchData, radius, searchType) {
    if (!searchData) {
      setGlobalLocation(null);
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      console.log('🧹 Cleared global location');
      return null;
    }

    try {
      let coords;
      
      if (searchType === 'coords') {
        coords = {
          latitude: searchData.latitude,
          longitude: searchData.longitude
        };
      } else if (searchType === 'zip') {
        coords = await getCoordinatesFromZip(searchData);
      }
      
      const newLocation = {
        ...coords,
        radius,
        zipCode: searchData.zipCode || searchData
      };
      
      setGlobalLocation(newLocation);
      console.log('📍 Updated global location:', newLocation.zipCode, `${radius}mi`);
      return newLocation;
      
    } catch (error) {
      console.error('Error updating location:', error);
      return null;
    }
  }

  function clearLocation() {
    setGlobalLocation(null);
    AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    console.log('🧹 Cleared global location');
  }

  const value = {
    globalLocation,
    updateLocation,
    clearLocation,
    loading
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}