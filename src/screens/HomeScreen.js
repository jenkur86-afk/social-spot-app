import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ActivityCard from '../components/ActivityCard';
import FilterBar from '../components/FilterBar';
import AgeFilter from '../components/AgeFilter';
import LocationSearch from '../components/LocationSearch';
import { getCoordinatesFromZip, calculateDistance } from '../utils/geocoding';
import { useLocation } from '../contexts/LocationContext';

const CATEGORY_MAPPING = {
  'Food & Dining': 'Food & Dining',
  'Outdoor': 'Outdoor Fun',
  'Indoor': 'Indoor Fun',
  'Educational & Enrichment': 'Arts, Culture & Learning',
  'Events & Programs': 'Events & Programs'
};

export default function HomeScreen({ navigation }) {
  const [allActivities, setAllActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [selectedAge, setSelectedAge] = useState('all');
  const { globalLocation, updateLocation, clearLocation } = useLocation();

  useEffect(() => {
    loadAllActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, showFreeOnly, selectedAge, globalLocation, allActivities]);

  async function loadAllActivities() {
    try {
      console.log('📚 Loading activities...');
      const activitiesRef = collection(db, 'activities');
      
      let allDocs = [];
      let lastDoc = null;
      const batchSize = 1000;
      
      while (true) {
        let q = query(activitiesRef, orderBy('name'), limit(batchSize));
        
        if (lastDoc) {
          q = query(activitiesRef, orderBy('name'), startAfter(lastDoc), limit(batchSize));
        }
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) break;
        
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          const displayCategory = CATEGORY_MAPPING[data.parentCategory] || data.parentCategory;
          
          return {
            id: doc.id,
            ...data,
            displayCategory
          };
        });
        
        allDocs = [...allDocs, ...docs];
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        if (snapshot.docs.length < batchSize) break;
      }
      
      console.log(`✅ Loaded ${allDocs.length} activities`);
      setAllActivities(allDocs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoading(false);
    }
  }

  async function handleLocationSearch(searchData, radius, searchType) {
      await updateLocation(searchData, radius, searchType);
  }

  function matchesAgeFilter(activity) {
    if (selectedAge === 'all') return true;
    
    const ageRange = activity.filters?.ageRange;
    if (!ageRange) return true;
    
    const ageLower = ageRange.toLowerCase();
    
    switch (selectedAge) {
      case 'toddler':
        return ageLower.includes('0-3') ||
               ageLower.includes('toddler') ||
               ageLower.includes('infant') ||
               ageLower.includes('all ages');
      
      case 'kids':
        return ageLower.includes('4-12') ||
               ageLower.includes('kids') ||
               ageLower.includes('children') ||
               ageLower.includes('all ages');
      
      case 'teens':
        return ageLower.includes('13-18') ||
               ageLower.includes('teen') ||
               ageLower.includes('youth') ||
               ageLower.includes('all ages');
      
      case 'adults':
        return ageLower.includes('18+') ||
               ageLower.includes('adult') ||
               ageLower.includes('21+') ||
               ageLower.includes('all ages');
      
      default:
        return true;
    }
  }

  function applyFilters() {
    let filtered = [...allActivities];
    
    // Location filter with simple distance
    if (globalLocation) {
      console.log(`📍 Filtering by location (${globalLocation.radius} mi radius)`);
      
      filtered = filtered
        .filter(activity => activity.location?.coordinates?.latitude)
        .map(activity => {
          const distance = calculateDistance(
            globalLocation.latitude,
            globalLocation.longitude,
            activity.location.coordinates.latitude,
            activity.location.coordinates.longitude
          );
          
          return {
            ...activity,
            distance
          };
        })
        .filter(activity => activity.distance <= globalLocation.radius)
        .sort((a, b) => a.distance - b.distance);
      
      console.log(`✅ Found ${filtered.length} activities within ${globalLocation.radius} mi`);
    }
    
    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(a => a.displayCategory === selectedCategory);
    }
    
    // Free filter
    if (showFreeOnly) {
      filtered = filtered.filter(a => a.filters?.isFree === true);
    }
    
    // Age filter
    if (selectedAge !== 'all') {
      filtered = filtered.filter(a => matchesAgeFilter(a));
    }
    
    // Sort by name if no location filter
    if (!globalLocation) {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setFilteredActivities(filtered);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAllActivities();
    setRefreshing(false);
  }

  function handleActivityPress(activity) {
    navigation.navigate('ActivityDetail', { activity });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Discover Activities</Text>
        <Text style={styles.subtitle}>
          {filteredActivities.length} of {allActivities.length} activities
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          {globalLocation && ` within ${globalLocation.radius} mi`}
        </Text>
      </View>
      
      <LocationSearch
        onSearch={handleLocationSearch}
        loading={searchLoading}
      />
      
      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showFreeOnly={showFreeOnly}
        onToggleFree={() => setShowFreeOnly(!showFreeOnly)}
      />
      
      <AgeFilter
        selectedAge={selectedAge}
        onAgeChange={setSelectedAge}
      />
      
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPress={() => handleActivityPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  list: {
    paddingVertical: 8,
  },
});
