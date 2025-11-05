import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../utils/colors';

function getCategoryIcon(category) {
  if (!category) return '🎉';
  
  const iconMap = {
    'Food & Dining': '🍽️',
    'Outdoor Fun': '🌳',
    'Indoor Fun': '🎲',
    'Arts, Culture & Learning': '🎨',
    'Events & Programs': '🎪',
  };
  return iconMap[category] || '🎉';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MapModal({
  isVisible,
  onClose,
  items = [],
  type = 'activities',
  userLocation,
  onItemPress,
  onSearchArea,
}) {
  const [region, setRegion] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [currentMapRegion, setCurrentMapRegion] = useState(null);

  const config = {
    activities: {
      markerColor: Colors.primary,        // Periwinkle
      title: 'Activities Map',
      storageKey: 'activities_map_region',
    },
    events: {
      markerColor: Colors.secondary,      // Rose
      title: 'Events Map',
      storageKey: 'events_map_region',
    },
  };

  const currentConfig = config[type] || config.activities;

  useEffect(() => {
    if (isVisible) {
      initializeRegion();
    }
  }, [isVisible, userLocation, items]);

  const initializeRegion = async () => {
    try {
      // STEP 1: Check user location FIRST (before saved region)
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        console.log('📍 Using user location:', userLocation);
        const newRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          // Calculate zoom based on radius - smaller number = more zoomed in
          latitudeDelta: userLocation.radius ? (userLocation.radius / 50) : 0.1,
          longitudeDelta: userLocation.radius ? (userLocation.radius / 50) : 0.1,
        };
        setRegion(newRegion);
        
        // Animate map to this region after it's ready
        if (mapRef.current && mapReady) {
          setTimeout(() => {
            mapRef.current.animateToRegion(newRegion, 300);
          }, 100);
        }
        return; // EXIT HERE - don't load saved region
      }

      // STEP 2: Only check saved region if NO user location
      const savedRegion = await AsyncStorage.getItem(currentConfig.storageKey);
      if (savedRegion) {
        const parsedRegion = JSON.parse(savedRegion);
        setRegion(parsedRegion);
        if (mapRef.current && mapReady) {
          setTimeout(() => {
            mapRef.current.animateToRegion(parsedRegion, 100);
          }, 100);
        }
        return;
      }

      // STEP 3: Fall back to first item
      if (items.length > 0) {
        const firstItem = items[0];
        if (firstItem.location?.coordinates) {
          setRegion({
            latitude: firstItem.location.coordinates.latitude,
            longitude: firstItem.location.coordinates.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
          return;
        }
      }
      
      // STEP 4: Default to Green Haven, Maryland
      setRegion({
        latitude: 38.8462,
        longitude: -76.8483,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } catch (error) {
      console.error('Error initializing map region:', error);
    }
  };

const handleRegionChangeComplete = async (newRegion) => {
  try {
    await AsyncStorage.setItem(
      currentConfig.storageKey,
      JSON.stringify(newRegion)
    );
    setRegion(newRegion);
    setCurrentMapRegion(newRegion);
    
    // Show "Search This Area" button if user moved the map
    if (userLocation) {
      const distance = calculateMapDistance(
        userLocation.latitude,
        userLocation.longitude,
        newRegion.latitude,
        newRegion.longitude
      );
      
      // Show button if moved more than 0.5 miles
      setShowSearchButton(distance > 0.5);
    }
  } catch (error) {
    console.error('Error saving map region:', error);
  }
};

const calculateMapDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const handleSearchThisArea = () => {
  if (currentMapRegion && onSearchArea) {
    // Calculate approximate radius from map viewport
    const estimatedRadius = (currentMapRegion.latitudeDelta * 69) / 2; // Rough conversion
    
    onSearchArea({
      latitude: currentMapRegion.latitude,
      longitude: currentMapRegion.longitude,
      radius: Math.max(5, Math.min(50, estimatedRadius)), // Between 5-50 miles
    });
    
    setShowSearchButton(false);
  }
};

  const handleMarkerPress = (item) => {
    setSelectedItem(item);
  };

  const handleViewDetails = () => {
    if (selectedItem && onItemPress) {
      onItemPress(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    onClose();
  };

  if (!region) {
    return (
      <Modal
        isVisible={isVisible}
        onBackdropPress={handleClose}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropTransitionOutTiming={0}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentConfig.markerColor} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionOutTiming={0}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      // Remove all swipe-related props to prevent conflicts
    >
      <View 
        style={styles.modalContent}
        // Block touch events from propagating
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={() => false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dragHandle} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{currentConfig.title}</Text>
            <Text style={styles.headerSubtitle}>
              {items.length} {type} shown
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search This Area Button */}
        {showSearchButton && (
          <TouchableOpacity 
            style={styles.searchAreaButton}
            onPress={handleSearchThisArea}
          >
            <Text style={styles.searchAreaText}>🔍 Search This Area</Text>
          </TouchableOpacity>
        )}

        {/* Map Container with explicit touch handling */}
        <View 
          style={styles.mapContainer}
          // Prevent any touch events from bubbling up
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            onMapReady={() => {
              setMapReady(true);
              // Ensure map is positioned correctly after ready
              if (mapRef.current && region) {
                mapRef.current.animateToRegion(region, 100);
              }
            }}
            showsUserLocation
            showsMyLocationButton
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
            // Explicitly handle touch to prevent propagation
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            // Prevent scroll momentum from parent
            scrollEventThrottle={1}
          >
            {/* User's search location marker */}
            {userLocation && userLocation.latitude && userLocation.longitude && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Search Location"
                description={`${userLocation.radius || 'N/A'} mile radius`}
              >
                <View style={styles.searchMarker}>
                  <Text style={styles.searchMarkerText}>📍</Text>
                </View>
              </Marker>
            )}

            {/* Search radius circle */}
            {userLocation && userLocation.radius && userLocation.latitude && userLocation.longitude && (
              <Circle
                center={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                radius={userLocation.radius * 1609.34}
                strokeColor="rgba(33, 150, 243, 0.5)"
                fillColor="rgba(33, 150, 243, 0.1)"
                strokeWidth={2}
              />
            )}

            {/* Activity/Event markers */}
            {mapReady &&
              items.map((item) => {
                if (!item.location?.coordinates) return null;

                return (
                  <Marker
                    key={item.id}
                    coordinate={{
                      latitude: item.location.coordinates.latitude,
                      longitude: item.location.coordinates.longitude,
                    }}
                    onPress={() => handleMarkerPress(item)}
                  >
                    <View
                      style={[
                        styles.customMarker,
                        { backgroundColor: currentConfig.markerColor },
                      ]}
                    >
                      <Text style={styles.markerText}>
                        {type === 'activities' ? getCategoryIcon(item.displayCategory) : '📅'}
                      </Text>
                    </View>
                  </Marker>
                );
              })}
          </MapView>
        </View>

        {/* Selected item card */}
        {selectedItem && (
          <View style={styles.selectedCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {selectedItem.name || selectedItem.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedItem(null)}
                  style={styles.cardCloseButton}
                >
                  <Text style={styles.cardCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedItem.displayCategory && (
                <Text style={styles.cardCategory}>
                  {selectedItem.displayCategory}
                </Text>
              )}

              {selectedItem.distance && (
                <Text style={styles.cardDistance}>
                  📍 {selectedItem.distance.toFixed(1)} miles away
                </Text>
              )}

              {selectedItem.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {selectedItem.description}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.viewDetailsButton,
                  { backgroundColor: currentConfig.markerColor },
                ]}
                onPress={handleViewDetails}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders.light,
    backgroundColor: Colors.cardBackground,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    fontSize: 16,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  cardCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCloseText: {
    fontSize: 14,
    color: '#666',
  },
  cardCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    lineHeight: 20,
  },
  viewDetailsButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.searchLocation,  // Blue
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  searchMarkerText: {
    fontSize: 20,
  },
  searchAreaButton: {
  position: 'absolute',
  top: 80,
  alignSelf: 'center',
  backgroundColor: '#4CAF50',  // Changed from currentConfig.markerColor
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 25,
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
  }),
},
searchAreaText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
},
});