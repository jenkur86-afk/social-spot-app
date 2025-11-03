import React, { useState, useEffect } from 'react';
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
};

export default function MapScreen({ navigation }) {
  const [allActivities, setAllActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [locationFilter, setLocationFilter] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [region, setRegion] = useState({
    latitude: 38.8,
    longitude: -76.5,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });

  useEffect(() => {
    loadSavedPreferences();
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [locationFilter, selectedCategory, showFreeOnly, allActivities]);

  // Save preferences whenever they change
  useEffect(() => {
    savePreferences();
  }, [selectedCategory, showFreeOnly, locationFilter]);

  async function loadSavedPreferences() {
    try {
      const savedCategory = await AsyncStorage.getItem(STORAGE_KEYS.MAP_CATEGORY);
      const savedFreeOnly = await AsyncStorage.getItem(STORAGE_KEYS.MAP_FREE_ONLY);
      const savedLocation = await AsyncStorage.getItem(STORAGE_KEYS.MAP_LOCATION);
      
      if (savedCategory) {
        setSelectedCategory(savedCategory);
        console.log('📌 Restored map category:', savedCategory);
      }
      
      if (savedFreeOnly) {
        setShowFreeOnly(savedFreeOnly === 'true');
        console.log('📌 Restored free only:', savedFreeOnly === 'true');
      }
      
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        setLocationFilter(location);
        
        // Update map region to saved location
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: location.radius / 50,
          longitudeDelta: location.radius / 50,
        });
        
        console.log('📌 Restored location:', location.zipCode, `${location.radius}mi`);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async function savePreferences() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAP_CATEGORY, selectedCategory);
      await AsyncStorage.setItem(STORAGE_KEYS.MAP_FREE_ONLY, showFreeOnly.toString());
      
      if (locationFilter) {
        await AsyncStorage.setItem(STORAGE_KEYS.MAP_LOCATION, JSON.stringify(locationFilter));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.MAP_LOCATION);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  async function loadActivities() {
    try {
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
      
      setAllActivities(activitiesData);
      setFilteredActivities(activitiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoading(false);
    }
  }

  async function handleLocationSearch(searchData, radius, searchType) {
    if (!searchData) {
      setLocationFilter(null);
      setRegion({
        latitude: 38.8,
        longitude: -76.5,
        latitudeDelta: 1.5,
        longitudeDelta: 1.5,
      });
      return;
    }

    setSearchLoading(true);
    
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
      
      setLocationFilter({ 
        ...coords, 
        radius, 
        zipCode: searchData.zipCode || searchData 
      });
      
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: radius / 50,
        longitudeDelta: radius / 50,
      });
      
      setShowSearchModal(false);
      
    } catch (error) {
      console.error('Error processing location:', error);
    }
    
    setSearchLoading(false);
  }

  function applyFilters() {
    let filtered = [...allActivities];

    if (locationFilter) {
      filtered = filtered
        .map(activity => {
          const distance = calculateDistance(
            locationFilter.latitude,
            locationFilter.longitude,
            activity.location.coordinates.latitude,
            activity.location.coordinates.longitude
          );
          return { ...activity, distance };
        })
        .filter(activity => activity.distance <= locationFilter.radius)
        .sort((a, b) => a.distance - b.distance);
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(a => a.displayCategory === selectedCategory);
    }

    if (showFreeOnly) {
      filtered = filtered.filter(a => a.filters?.isFree === true);
    }

    setFilteredActivities(filtered);
  }

  function getSearchButtonText() {
    if (!locationFilter && selectedCategory === 'All' && !showFreeOnly) {
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

    if (locationFilter) {
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

  function clearFilters() {
    setSelectedCategory('All');
    setShowFreeOnly(false);
    setLocationFilter(null);
    setShowSearchModal(false);
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
        {locationFilter && (
          <Circle
            center={{
              latitude: locationFilter.latitude,
              longitude: locationFilter.longitude,
            }}
            radius={locationFilter.radius * 1609.34}
            strokeColor="rgba(76, 175, 80, 0.5)"
            fillColor="rgba(76, 175, 80, 0.1)"
          />
        )}

        {locationFilter && (
          <Marker
            coordinate={{
              latitude: locationFilter.latitude,
              longitude: locationFilter.longitude,
            }}
            pinColor="blue"
            title={locationFilter.zipCode}
            description={`${locationFilter.radius} mile radius`}
          />
        )}

        {filteredActivities.map((activity) => {
          const color = CATEGORY_COLORS[activity.displayCategory] || 'red';
          
          return (
            <Marker
              key={activity.id}
              coordinate={{
                latitude: activity.location.coordinates.latitude,
                longitude: activity.location.coordinates.longitude,
              }}
              pinColor={color}
              title={activity.name}
              onPress={() => handleMarkerPress(activity)}
            />
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      )}

      {/* Floating Search Button */}
      <TouchableOpacity 
        style={styles.floatingSearchButton}
        onPress={() => setShowSearchModal(true)}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchButtonText} numberOfLines={1}>
          {getSearchButtonText()}
        </Text>
        {(selectedCategory !== 'All' || showFreeOnly) && (
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

              {(locationFilter || selectedCategory !== 'All' || showFreeOnly) && (
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
