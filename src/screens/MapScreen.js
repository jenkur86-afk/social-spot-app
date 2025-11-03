import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import LocationSearch from '../components/LocationSearch';
import FilterBar from '../components/FilterBar';
import { getCoordinatesFromZip, calculateDistance } from '../utils/geocoding';
import { useLocation } from '../contexts/LocationContext';

const { width, height } = Dimensions.get('window');

const CATEGORY_COLORS = {
  'Food & Dining': 'red',
  'Outdoor Fun': 'green',
  'Indoor Fun': 'blue',
  'Arts, Culture & Learning': 'purple',
  'Events & Programs': 'orange',
};

const CATEGORY_MAPPING = {
  'Food & Dining': 'Food & Dining',
  'Outdoor': 'Outdoor Fun',
  'Indoor': 'Indoor Fun',
  'Educational & Enrichment': 'Arts, Culture & Learning',
  'Events & Programs': 'Events & Programs'
};

const STORAGE_KEYS = {
  MAP_CATEGORY: '@map_category_filter',
  MAP_FREE_ONLY: '@map_free_only_filter',
  MAP_LOCATION: '@map_location_filter',
  MAP_REGION: '@map_region', // Add region saving too
};

export default function MapScreen({ navigation }) {
  const [allActivities, setAllActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const { globalLocation, updateLocation, clearLocation } = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false); // Track if preferences are loaded
  const [region, setRegion] = useState({
    latitude: 38.8,
    longitude: -76.5,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });
  
  // Use ref to track if this is initial mount
  const isInitialMount = useRef(true);

  // Load preferences first, THEN load activities
  useEffect(() => {
    const initializeScreen = async () => {
      await loadSavedPreferences();
      setPreferencesLoaded(true);
      await loadActivities();
    };
    
    initializeScreen();
  }, []);

  // Apply filters only after preferences are loaded
  useEffect(() => {
    if (preferencesLoaded) {
      applyFilters();
    }
  }, [globalLocation, selectedCategory, showFreeOnly, allActivities, preferencesLoaded]);

  // Save preferences whenever they change (but skip initial mount)
  useEffect(() => {
    if (!isInitialMount.current) {
      savePreferences();
    } else {
      isInitialMount.current = false;
    }
  }, [selectedCategory, showFreeOnly, globalLocation, region]);

  async function loadSavedPreferences() {
  try {
    console.log('🔄 Loading saved preferences...');
    
    // Only load category and free filter (location is now global)
    const [savedCategory, savedFreeOnly, savedRegion] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.MAP_CATEGORY),
      AsyncStorage.getItem(STORAGE_KEYS.MAP_FREE_ONLY),
      AsyncStorage.getItem(STORAGE_KEYS.MAP_REGION)
    ]);
    
    if (savedCategory) {
      setSelectedCategory(savedCategory);
      console.log('✅ Restored category:', savedCategory);
    }
    
    if (savedFreeOnly) {
      setShowFreeOnly(savedFreeOnly === 'true');
      console.log('✅ Restored free only:', savedFreeOnly === 'true');
    }
    
    // For MapScreen only - restore the map viewport position
    if (savedRegion) {
      const regionData = JSON.parse(savedRegion);
      setRegion(regionData);
      console.log('✅ Restored map region');
    }
    
    console.log('✅ Preferences loaded successfully');
  } catch (error) {
    console.error('❌ Error loading preferences:', error);
  }
}

  async function savePreferences() {
    try {
      console.log('💾 Saving preferences...');
      
      // Save all preferences
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MAP_CATEGORY, selectedCategory),
        AsyncStorage.setItem(STORAGE_KEYS.MAP_FREE_ONLY, showFreeOnly.toString()),
        globalLocation 
          ? AsyncStorage.setItem(STORAGE_KEYS.MAP_LOCATION, JSON.stringify(globalLocation))
          : AsyncStorage.removeItem(STORAGE_KEYS.MAP_LOCATION),
        AsyncStorage.setItem(STORAGE_KEYS.MAP_REGION, JSON.stringify(region))
      ]);
      
      console.log('✅ Preferences saved successfully');
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
    }
  }

  async function loadActivities() {
    try {
      console.log('📍 Loading activities from Firebase...');
      const activitiesRef = collection(db, 'activities');
      const q = query(activitiesRef, limit(1000));
      const snapshot = await getDocs(q);
      
      const activitiesData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const displayCategory = CATEGORY_MAPPING[data.parentCategory] || data.parentCategory;
          
          return {
            id: doc.id,
            ...data,
            displayCategory
          };
        })
        .filter(activity => 
          activity.location?.coordinates?.latitude && 
          activity.location?.coordinates?.longitude
        );
      
      console.log(`✅ Loaded ${activitiesData.length} activities`);
      setAllActivities(activitiesData);
      setFilteredActivities(activitiesData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      setLoading(false);
    }
  }

  async function handleLocationSearch(searchData, radius, searchType) {
      await updateLocation(searchData, radius, searchType);
  }

  function applyFilters() {
    let filtered = [...allActivities];

    if (globalLocation) {
      filtered = filtered
        .map(activity => {
          const distance = calculateDistance(
            globalLocation.latitude,
            globalLocation.longitude,
            activity.location.coordinates.latitude,
            activity.location.coordinates.longitude
          );
          return { ...activity, distance };
        })
        .filter(activity => activity.distance <= globalLocation.radius)
        .sort((a, b) => a.distance - b.distance);
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(a => a.displayCategory === selectedCategory);
    }

    if (showFreeOnly) {
      filtered = filtered.filter(a => a.filters?.isFree === true);
    }

    setFilteredActivities(filtered);
    console.log(`🔍 Applied filters: ${filtered.length} activities shown`);
  }

  function getSearchButtonText() {
    if (!globalLocation && selectedCategory === 'All' && !showFreeOnly) {
      return 'Search activities';
    }

    const count = filteredActivities.length;
    let text = `${count} `;

    if (selectedCategory !== 'All') {
      text += selectedCategory.toLowerCase();
    } else {
      text += count === 1 ? 'activity' : 'activities';
    }

    if (showFreeOnly) {
      text = `${count} free ` + (selectedCategory !== 'All' ? selectedCategory.toLowerCase() : count === 1 ? 'activity' : 'activities');
    }

    if (globalLocation) {
      text += ' nearby';
    }

    return text;
  }

  function handleMarkerPress(activity) {
    setSelectedActivity(activity);
  }

  function handleViewDetails() {
    if (selectedActivity) {
      navigation.navigate('ActivityDetail', { activity: selectedActivity });
    }
  }

  async function clearFilters() {
    setSelectedCategory('All');
    setShowFreeOnly(false);
    setShowSearchModal(false);
    
    // Clear saved location but keep other preferences
    await AsyncStorage.removeItem(STORAGE_KEYS.MAP_LOCATION);
    console.log('🧹 Filters cleared');
  }

  // Show loading while preferences are being loaded
  if (loading || !preferencesLoaded) {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {globalLocation && (
          <Circle
            center={{
              latitude: globalLocation.latitude,
              longitude: globalLocation.longitude,
            }}
            radius={globalLocation.radius * 1609.34}
            strokeColor="rgba(76, 175, 80, 0.5)"
            fillColor="rgba(76, 175, 80, 0.1)"
          />
        )}

        {globalLocation && (
          <Marker
            coordinate={{
              latitude: globalLocation.latitude,
              longitude: globalLocation.longitude,
            }}
            title="Search Center"
            description={`${globalLocation.radius} mile radius`}
            pinColor="#4CAF50"
          />
        )}

        {filteredActivities.map((activity, index) => (
          <Marker
            key={activity.id}
            coordinate={{
              latitude: activity.location.coordinates.latitude,
              longitude: activity.location.coordinates.longitude,
            }}
            title={activity.name}
            description={activity.subcategory || activity.displayCategory}
            pinColor={CATEGORY_COLORS[activity.displayCategory] || 'red'}
            onPress={() => handleMarkerPress(activity)}
          />
        ))}
      </MapView>

      {/* Floating Search Button */}
      <TouchableOpacity 
        style={styles.floatingSearchButton}
        onPress={() => setShowSearchModal(true)}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchButtonText} numberOfLines={1}>
          {getSearchButtonText()}
        </Text>
        {(selectedCategory !== 'All' || showFreeOnly || globalLocation) && (
          <View style={styles.filterDot} />
        )}
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search & Filter</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <LocationSearch 
                onSearch={handleLocationSearch}
                loading={searchLoading}
                currentLocation={globalLocation}
              />
              
              <View style={styles.divider} />
              
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>✅ Your preferences are saved</Text>
                <FilterBar
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  showFreeOnly={showFreeOnly}
                  onToggleFree={() => setShowFreeOnly(!showFreeOnly)}
                />
              </View>

              {(globalLocation || selectedCategory !== 'All' || showFreeOnly) && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom info card */}
      {selectedActivity && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {selectedActivity.name}
              </Text>
              {selectedActivity.subcategory && (
                <Text style={styles.cardSubcategory}>
                  {selectedActivity.subcategory}
                </Text>
              )}
              <Text style={styles.cardLocation}>
                📍 {selectedActivity.location.city}, {selectedActivity.location.zipCode}
                {selectedActivity.distance !== undefined && 
                  ` • ${selectedActivity.distance} mi away`}
              </Text>
              {selectedActivity.filters?.isFree && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>FREE</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedActivity(null)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={handleViewDetails}
          >
            <Text style={styles.detailsButtonText}>View Details →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  floatingSearchButton: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalText: {
    fontSize: 28,
    color: '#999',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  filterSection: {
    padding: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 12,
  },
  clearButton: {
    margin: 16,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubcategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  detailsButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
