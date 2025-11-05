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
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ActivityCard from '../components/ActivityCard';
import EventFilterBar from '../components/EventFilterBar';
import AgeFilter from '../components/AgeFilter';
import LocationSearch from '../components/LocationSearch';
import { calculateDistance } from '../utils/geocoding';
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

export default function EventsScreen({ navigation }) {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [selectedAge, setSelectedAge] = useState('all');

  const { globalLocation, updateLocation } = useLocation();
  const flatListRef = useRef(null);

  useEffect(() => {
    loadAllEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, showFreeOnly, selectedAge, globalLocation, allEvents]);

  async function loadAllEvents() {
    try {
      console.log('ðŸ“… Loading events...');
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('name'), limit(1000));
      const snapshot = await getDocs(q);
      
      const eventsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const displayCategory = CATEGORY_MAPPING[data.parentCategory] || data.parentCategory;
        
        return {
          id: doc.id,
          ...data,
          displayCategory
        };
      });
      
      console.log(`âœ… Loaded ${eventsData.length} events`);
      setAllEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  }

  async function handleLocationSearch(searchData, radius, searchType) {
    await updateLocation(searchData, radius, searchType);
  }

  function matchesAgeFilter(event) {
    if (selectedAge === 'all') return true;
    
    const ageRange = event.filters?.ageRange;
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
    let filtered = [...allEvents];
    
    // Location filter
    if (globalLocation) {
      console.log(`ðŸ“ Filtering by location (${globalLocation.radius} mi radius)`);
      
      filtered = filtered
        .filter(event => event.location?.coordinates?.latitude)
        .map(event => {
          const distance = calculateDistance(
            globalLocation.latitude,
            globalLocation.longitude,
            event.location.coordinates.latitude,
            event.location.coordinates.longitude
          );
          
          return {
            ...event,
            distance
          };
        })
        .filter(event => event.distance <= globalLocation.radius)
        .sort((a, b) => a.distance - b.distance);
      
      console.log(`âœ… Found ${filtered.length} events within ${globalLocation.radius} mi`);
    }
    
    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(e => e.displayCategory === selectedCategory);
    }
    
    // Free filter
    if (showFreeOnly) {
      filtered = filtered.filter(e => e.filters?.isFree === true);
    }
    
    // Age filter
    if (selectedAge !== 'all') {
      filtered = filtered.filter(e => matchesAgeFilter(e));
    }
    
    // Sort by name if no location filter
    if (!globalLocation) {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setFilteredEvents(filtered);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAllEvents();
    setRefreshing(false);
  }

  function handleEventPress(event) {
    navigation.navigate('ActivityDetail', { activity: event });
  }

  // Handle map button press with scroll prevention
  function handleMapPress() {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
    
    InteractionManager.runAfterInteractions(() => {
      setIsMapVisible(true);
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ðŸ“… Events</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterToggleIcon}>{showFilters ? 'ðŸ”¼' : 'ðŸ”½'}</Text>
            <Text style={styles.filterToggleText}>Filters</Text>
            {(selectedCategory !== 'All' || showFreeOnly || selectedAge !== 'all' || globalLocation) && (
              <View style={styles.activeFilterDot} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleMapPress}
          >
            <Text style={styles.mapButtonIcon}>ðŸ—ºï¸</Text>
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
          
          <EventFilterBar
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
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPress={() => handleEventPress(item)}
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
        removeClippedSubviews={true}
        scrollEventThrottle={1}
        onMomentumScrollEnd={() => {}}
        onScrollEndDrag={() => {}}
      />
      
      <MapModal
        isVisible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        items={filteredEvents}
        type="events"
        userLocation={globalLocation}
        onItemPress={(event) => {
          setIsMapVisible(false);
          navigation.navigate('ActivityDetail', { activity: event });
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
    backgroundColor: Colors.secondary,  // Rose/Pink for events
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