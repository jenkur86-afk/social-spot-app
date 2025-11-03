import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as Location from 'expo-location';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function LocationSearch({ onSearch, loading }) {
  const [zipCode, setZipCode] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(25);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [lastSearchData, setLastSearchData] = useState(null);
  const [lastSearchType, setLastSearchType] = useState(null);

  function handleSearch() {
    if (zipCode.length === 5) {
      setLastSearchData(zipCode);
      setLastSearchType('zip');
      onSearch(zipCode, selectedRadius, 'zip');
    }
  }

  function handleClear() {
    setZipCode('');
    setLastSearchData(null);
    setLastSearchType(null);
    onSearch(null, selectedRadius, null);
  }

  function handleRadiusChange(radius) {
    setSelectedRadius(radius);
    
    // If there's an active search, re-run it with new radius
    if (lastSearchData && lastSearchType) {
      onSearch(lastSearchData, radius, lastSearchType);
    }
  }

  async function handleUseMyLocation() {
    setGettingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow location access to use this feature.',
          [{ text: 'OK' }]
        );
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const zip = address[0]?.postalCode || '';
      
      if (zip) {
        setZipCode(zip);
      }

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zipCode: zip || 'Current Location'
      };
      
      setLastSearchData(locationData);
      setLastSearchType('coords');
      
      onSearch(locationData, selectedRadius, 'coords');

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Please try entering a ZIP code.',
        [{ text: 'OK' }]
      );
    }
    
    setGettingLocation(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter ZIP code"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="number-pad"
          maxLength={5}
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        
        <TouchableOpacity 
          style={[styles.searchButton, zipCode.length !== 5 && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={zipCode.length !== 5 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>

        {zipCode.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.locationButton}
        onPress={handleUseMyLocation}
        disabled={gettingLocation || loading}
      >
        {gettingLocation ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationButtonText}>Use My Location</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Radius:</Text>
        {RADIUS_OPTIONS.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusButton,
              selectedRadius === radius && styles.radiusButtonActive
            ]}
            onPress={() => handleRadiusChange(radius)}
          >
            <Text style={[
              styles.radiusText,
              selectedRadius === radius && styles.radiusTextActive
            ]}>
              {radius} mi
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 80,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  clearText: {
    fontSize: 24,
    color: '#999',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    fontWeight: '600',
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  radiusButtonActive: {
    backgroundColor: '#4CAF50',
  },
  radiusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  radiusTextActive: {
    color: 'white',
  },
});
