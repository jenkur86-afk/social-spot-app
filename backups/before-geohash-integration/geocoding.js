// Simple ZIP code to coordinates lookup for Maryland area
// In production, you'd use Google Geocoding API
const ZIP_COORDINATES = {
  '21201': { latitude: 39.2904, longitude: -76.6122 }, // Baltimore
  '21202': { latitude: 39.2904, longitude: -76.6122 },
  '21853': { latitude: 38.2046, longitude: -75.6939 }, // Princess Anne
  '21222': { latitude: 39.2575, longitude: -76.5226 }, // Dundalk
};

export async function getCoordinatesFromZip(zipCode) {
  // For demo: use a free API or return approximate MD center
  // Real implementation would use Google Geocoding API
  
  // Check our local lookup first
  if (ZIP_COORDINATES[zipCode]) {
    return ZIP_COORDINATES[zipCode];
  }
  
  // Default to Maryland center if ZIP not found
  return {
    latitude: 38.8,
    longitude: -76.5,
  };
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula to calculate distance in miles
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}
