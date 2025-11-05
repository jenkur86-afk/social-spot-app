import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityDetailScreen({ route, navigation }) {
  const { activity } = route.params;

  const openMap = () => {
    const address = activity.location || activity.venue || '';
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.apple.com/?q=${encodedAddress}`;
    Linking.openURL(url);
  };

  const openWebsite = () => {
    const url = activity.contact?.website || activity.url;
    if (url) {
      Linking.openURL(url);
    }
  };

  const getScheduleDisplay = () => {
    // First check for the formatted schedule from the events list
    if (activity.scheduleDescription) {
      // If it already has "Wednesdays 10:00 AM - 10:45 AM" format, use it
      if (activity.scheduleDescription.includes(' at ') || 
          activity.scheduleDescription.match(/\d{1,2}:\d{2}\s*(AM|PM)/)) {
        return activity.scheduleDescription;
      }
    }
    
    // Build schedule from components (for recurring events)
    if (activity.recurring || activity.schedule === 'Weekly' || activity.schedule === 'Daily') {
      let schedule = '';
      
      // Day of week
      if (activity.dayOfWeek) {
        schedule = `${activity.dayOfWeek}s`;
      } else if (activity.schedule === 'Daily') {
        schedule = 'Daily';
      } else if (activity.schedule === 'Weekly') {
        schedule = 'Weekly';
      }
      
      // Time
      if (activity.startTime && activity.endTime) {
        schedule += ` ${activity.startTime} - ${activity.endTime}`;
      } else if (activity.startTime) {
        schedule += ` at ${activity.startTime}`;
      } else if (activity.eventTime) {
        schedule += ` ${activity.eventTime}`;
      }
      
      if (schedule.trim()) return schedule;
    }
    
    // For one-time events, show date and time
    if (activity.eventDate) {
      let dateStr = activity.eventDate;
      if (activity.eventTime) {
        dateStr += ` at ${activity.eventTime}`;
      } else if (activity.startTime && activity.endTime) {
        dateStr += ` ${activity.startTime} - ${activity.endTime}`;
      } else if (activity.startTime) {
        dateStr += ` at ${activity.startTime}`;
      }
      return dateStr;
    }
    
    // Fallback to schedule description or schedule type
    return activity.scheduleDescription || activity.schedule || 'Contact for schedule';
  };

  const getLocationDisplay = () => {
    if (typeof activity.location === 'string') {
      return activity.location;
    }
    if (activity.location?.address) {
      return `${activity.location.address}, ${activity.location.city || ''}`;
    }
    if (activity.location?.name) {
      return activity.location.name;
    }
    return activity.venue || 'Location TBD';
  };

  const getCostDisplay = () => {
    if (activity.cost === 'Free' || activity.filters?.isFree) {
      return 'FREE';
    }
    return activity.cost || activity.filters?.cost || 'Contact for pricing';
  };

  const getAgeDisplay = () => {
    return activity.ageRange || activity.filters?.ageRange || 'All Ages';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{activity.name}</Text>
        
        {activity.subcategory && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{activity.subcategory}</Text>
          </View>
        )}

        {/* Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
          <Text style={styles.scheduleText}>{getScheduleDisplay()}</Text>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={openMap}>
              <Text style={styles.directionsLink}>Tap for directions</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.venueName}>{activity.venue}</Text>
          <Text style={styles.address}>{getLocationDisplay()}</Text>
          {activity.distance && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <Text style={styles.distanceText}>{activity.distance.toFixed(1)} miles away</Text>
            </View>
          )}
        </View>

        {/* About Section */}
          {(activity.description || activity.moreInfo) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={24} color="#2196F3" />
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              
              {activity.description && (
                <Text style={styles.description}>{activity.description}</Text>
              )}
              
              {activity.moreInfo && (
                <View style={{ marginTop: activity.description ? 12 : 0 }}>
                  <Text style={[styles.description, { fontWeight: '600', marginBottom: 4 }]}>
                    More Info:
                  </Text>
                  <Text style={styles.description}>{activity.moreInfo}</Text>
                </View>
              )}
            </View>
        )}

        {/* Age Range Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.emoji}>ðŸ‘¶</Text>
            <Text style={styles.sectionTitle}>Age Range</Text>
          </View>
          <Text style={styles.infoText}>{getAgeDisplay()}</Text>
        </View>

        {/* Cost Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Cost</Text>
          </View>
          <Text style={[styles.infoText, getCostDisplay() === 'FREE' && styles.freeText]}>
            {getCostDisplay()}
          </Text>
        </View>

        {/* Contact Section */}
        {(activity.contact?.website || activity.contact?.phone || activity.url) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={24} color="#9C27B0" />
              <Text style={styles.sectionTitle}>Contact</Text>
            </View>
            
            {(activity.contact?.website || activity.url) && (
              <TouchableOpacity style={styles.contactItem} onPress={openWebsite}>
                <Ionicons name="globe" size={20} color="#007AFF" />
                <Text style={styles.linkText}>Visit Website</Text>
              </TouchableOpacity>
            )}
            
            {activity.contact?.phone && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => Linking.openURL(`tel:${activity.contact.phone}`)}
              >
                <Ionicons name="call" size={20} color="#007AFF" />
                <Text style={styles.linkText}>{activity.contact.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
  },
  backText: {
    color: '#007AFF',
    fontSize: 17,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    paddingTop: 60,
  },
  content: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  categoryText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  scheduleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  address: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  directionsLink: {
    color: '#007AFF',
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginTop: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  freeText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 15,
    marginLeft: 8,
  },
  emoji: {
    fontSize: 24,
  },
});