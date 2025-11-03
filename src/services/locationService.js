import * as Location from 'expo-location';
import ngeohash from 'ngeohash';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

/**
 * Request location permissions from the user
 */
export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('📍 Location permission:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get the user's current GPS location
 */
export async function getCurrentLocation() {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    console.log('📍 Getting current location...');
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };

    console.log('✅ Location:', result.latitude.toFixed(4), result.longitude.toFixed(4));
    return result;
    
  } catch (error) {
    console.error('❌ Location error:', error.message);
    throw error;
  }
}

/**
 * Get geohash query bounds for Firebase queries
 */
export function getGeohashRange(latitude, longitude, radiusMiles) {
  const radiusMeters = radiusMiles * 1609.34;
  const bounds = geohashQueryBounds([latitude, longitude], radiusMeters);
  return bounds[0]; // Return first bound [lower, upper]
}

/**
 * Calculate straight-line distance (for pre-filtering)
 */
export function calculateStraightLineDistance(point1, point2) {
  const distanceKm = distanceBetween(
    [point1.latitude, point1.longitude],
    [point2.latitude, point2.longitude]
  );
  return distanceKm * 0.621371; // Convert to miles
}
