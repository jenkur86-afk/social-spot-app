import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getGeohashRange, calculateStraightLineDistance } from './locationService';

const CATEGORY_MAPPING = {
  'Food & Dining': 'Food & Dining',
  'Outdoor': 'Outdoor Fun',
  'Indoor': 'Indoor Fun',
  'Educational & Enrichment': 'Arts, Culture & Learning',
  'Events & Programs': 'Events & Programs'
};

export async function fetchNearbyActivities(
  userLocation,
  radiusMiles = 10,
  options = {}
) {
  const startTime = Date.now();
  
  try {
    console.log('\n🔍 GEOHASH QUERY START');
    console.log('📍 Center:', userLocation.latitude.toFixed(4), userLocation.longitude.toFixed(4));
    console.log('📏 Radius:', radiusMiles, 'miles');
    
    const [lowerBound, upperBound] = getGeohashRange(
      userLocation.latitude,
      userLocation.longitude,
      radiusMiles * 1.5
    );
    
    console.log('🔑 Geohash range:', lowerBound, '→', upperBound);
    
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('location.geohash', '>=', lowerBound),
      where('location.geohash', '<=', upperBound),
      limit(500)
    );
    
    console.log('📡 Querying Firebase...');
    const snapshot = await getDocs(q);
    console.log('📦 Firebase returned:', snapshot.size, 'documents');
    
    let activities = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      if (!data.location?.coordinates?.latitude) {
        return;
      }
      
      const distance = calculateStraightLineDistance(
        userLocation,
        {
          latitude: data.location.coordinates.latitude,
          longitude: data.location.coordinates.longitude
        }
      );
      
      if (distance <= radiusMiles) {
        const displayCategory = CATEGORY_MAPPING[data.parentCategory] || data.parentCategory;
        
        activities.push({
          id: doc.id,
          ...data,
          displayCategory,
          distance
        });
      }
    });
    
    console.log('✂️ After distance filter:', activities.length, 'activities');
    
    // Sort by distance (closest first)
    activities.sort((a, b) => a.distance - b.distance);
    
    const endTime = Date.now();
    console.log('⏱️ Total time:', endTime - startTime, 'ms');
    console.log('💾 Firebase reads:', snapshot.size);
    console.log('✅ Final results:', activities.length, 'activities\n');
    
    return activities;
    
  } catch (error) {
    console.error('❌ Error in fetchNearbyActivities:', error);
    throw error;
  }
}
