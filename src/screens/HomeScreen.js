import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,  
  Platform,
  InteractionManager
} from 'react-native';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';
import { fetchActivities } from '../services/dataService';
import { db } from '../../firebaseConfig';
import ActivityCard from '../components/ActivityCard';
import FilterBar from '../components/FilterBar';
import AgeFilter from '../components/AgeFilter';
import LocationSearch from '../components/LocationSearch';
import { getCoordinatesFromZip, calculateDistance } from '../utils/geocoding';
import { useLocation } from '../contexts/LocationContext';
import MapModal from '../components/MapModal';
import { Colors } from '../utils/colors';


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
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [selectedAge, setSelectedAge] = useState('all');
  const [showFilters, setShowFilters] = useState(true); // ADD THIS LINE
  const { globalLocation, updateLocation, clearLocation } = useLocation();
  const flatListRef = useRef(null);

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

  // Handle map button press with scroll prevention
  function handleMapPress() {
    // Stop any ongoing scrolling momentum
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
    
    // Use InteractionManager to ensure scroll has stopped
    InteractionManager.runAfterInteractions(() => {
      setIsMapVisible(true);
    });
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
        <Text style={styles.headerTitle}>🎉 Activities</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterToggleIcon}>{showFilters ? '🔼' : '🔽'}</Text>
            <Text style={styles.filterToggleText}>Filters</Text>
            {(selectedCategory !== 'All' || showFreeOnly || selectedAge !== 'all' || globalLocation) && (
              <View style={styles.activeFilterDot} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleMapPress}
          >
            <Text style={styles.mapButtonIcon}>🗺️</Text>
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>
      


  {showFilters && (
    <>
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
    </>
  )}

      
      <FlatList
        ref={flatListRef}
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPress={() => handleActivityPress(item)}
          />
        )}
        scrollEnabled={!isMapVisible}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        // Additional props to prevent scroll interference
        removeClippedSubviews={true}
        scrollEventThrottle={1}
        // Prevent momentum when modal is about to open
        onMomentumScrollEnd={() => {}}
        // Ensure scroll stops when losing focus
        onScrollEndDrag={() => {}}
      />
      
      <MapModal
        isVisible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        items={filteredActivities}
        type="activities"
        userLocation={globalLocation}
        onItemPress={(activity) => {
          setIsMapVisible(false);
          navigation.navigate('ActivityDetail', { activity });
        }}
        onSearchArea={(newLocation) => {
          updateLocation(newLocation, newLocation.radius, 'map');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerButtons: {
  flexDirection: 'row',
  gap: 8,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
  },
  filterToggleIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterToggleText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  list: {
    paddingVertical: 8,
  },
});