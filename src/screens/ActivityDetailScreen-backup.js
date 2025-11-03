import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityDetailScreen({ route, navigation }) {
  const { activity } = route.params;
  
  // Determine if this is an event
  const isEvent = activity.parentCategory === 'Events & Programs' || 
                  activity.category === 'Events & Programs' ||
                  activity.type === 'Event' ||
                  activity.type === 'event';

  // Helper to get location string
  const getLocationString = () => {
    if (typeof activity.location === 'string') {
      return activity.location;
    }
    if (activity.location?.address) {
      return activity.location.address;
    }
    if (activity.venue) {
      return `${activity.venue}, Maryland`;
    }
    return 'Maryland';
  };

  // Helper to get venue name
  const getVenueName = () => {
    if (activity.venue) return activity.venue;
    if (activity.location?.name) return activity.location.name;
    return null;
  };

  // Open map directions
  const openDirections = () => {
    const address = getLocationString();
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${activity.coordinates?.lat || activity.location?.coordinates?.latitude || ''},${activity.coordinates?.lon || activity.location?.coordinates?.longitude || ''}`;
    const label = encodeURIComponent(activity.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url);
  };

  // Open website
  const openWebsite = () => {
    const url = activity.url || activity.website || activity.contact?.website;
    if (url && url !== '#') {
      Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
    }
  };

  // Call phone
  const callPhone = () => {
    const phone = activity.contact?.phone || activity.phone;
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.screenTitle}>
          {isEvent ? 'Event Details' : 'Activity Details'}
        </Text>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{activity.name}</Text>
        
        {activity.subcategory && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{activity.subcategory}</Text>
          </View>
        )}
        
        {activity.cost === 'Free' && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        )}
      </View>

      {/* Event Schedule Info */}
      {isEvent && activity.schedule && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          <Text style={styles.value}>{activity.schedule}</Text>
        </View>
      )}

      {/* Location - CLICKABLE */}
      <TouchableOpacity style={styles.section} onPress={openDirections} activeOpacity={0.7}>
        <View style={styles.locationHeader}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.tapHint}>Tap for directions</Text>
        </View>
        
        {/* Show venue name if available */}
        {getVenueName() && (
          <Text style={styles.locationName}>{getVenueName()}</Text>
        )}
        
        <Text style={styles.address}>{getLocationString()}</Text>
        
        {activity.distance && (
          <Text style={styles.distance}>
            📍 {activity.distance.toFixed(1)} miles away
          </Text>
        )}
      </TouchableOpacity>

      {/* About/Description */}
      {activity.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>
      )}

      {/* Age Range */}
      {(activity.ageRange || activity.filters?.ageRange) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👶 Age Range</Text>
          <Text style={styles.value}>
            {activity.ageRange || activity.filters?.ageRange}
          </Text>
        </View>
      )}

      {/* Cost */}
      {(activity.cost || activity.filters?.cost) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Cost</Text>
          <Text style={styles.value}>
            {activity.cost || activity.filters?.cost}
          </Text>
        </View>
      )}

      {/* Contact Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 Contact</Text>
        
        <View style={styles.actionButtons}>
          {(activity.url || activity.website || activity.contact?.website) && 
           (activity.url !== '#' && activity.website !== '#') && (
            <TouchableOpacity style={styles.actionButton} onPress={openWebsite}>
              <Ionicons name="globe-outline" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
          )}
          
          {(activity.contact?.phone || activity.phone) && (
            <TouchableOpacity style={styles.actionButton} onPress={callPhone}>
              <Ionicons name="call-outline" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Amenities */}
      {activity.amenities && activity.amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {activity.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Hours */}
      {activity.hours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Hours</Text>
          <Text style={styles.value}>{activity.hours}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  titleSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#1976D2',
  },
  freeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  freeBadgeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  distance: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 14,
    color: '#666',
  },
});
