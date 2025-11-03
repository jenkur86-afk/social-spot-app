import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityCard({ activity, onPress }) {
  // Safe getter for any field that might be an object
  const getSafeValue = (value) => {
    if (!value) return null;
    if (typeof value === 'object') {
      // If it's an object, try to extract meaningful data
      if (value.display) return value.display;
      if (value.text) return value.text;
      if (value.value) return value.value;
      if (value.name) return value.name;
      // Otherwise return null to avoid render error
      return null;
    }
    return value;
  };
  
  const getScheduleDisplay = () => {
    const schedule = getSafeValue(activity.scheduleDescription) || 
                    getSafeValue(activity.schedule) ||
                    getSafeValue(activity.frequency);
    
    if (schedule) return schedule;
    
    // Build from components
    if (activity.dayOfWeek && activity.startTime) {
      return `${activity.dayOfWeek}s at ${activity.startTime}`;
    }
    
    if (activity.eventStartDate) {
      return activity.eventStartDate + (activity.startTime ? ` at ${activity.startTime}` : '');
    }
    
    return null;
  };
  
  const getLocationDisplay = () => {
    if (activity.venue) {
      return getSafeValue(activity.venue);
    }
    if (typeof activity.location === 'string') {
      return activity.location.split(',')[0];
    }
    if (activity.location?.name) {
      return activity.location.name;
    }
    return activity.city || 'Location TBD';
  };
  
  const getCostDisplay = () => {
    const cost = getSafeValue(activity.cost);
    if (cost === 'Free' || activity.filters?.isFree) {
      return 'FREE';
    }
    return cost || 'Contact for pricing';
  };
  
  const getAgeDisplay = () => {
    return getSafeValue(activity.ageRange) || 
           getSafeValue(activity.filters?.ageRange) || 
           'All Ages';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {getSafeValue(activity.name) || 'Event'}
        </Text>
        
        {activity.subcategory && (
          <View style={styles.subcategoryRow}>
            <View style={styles.subcategoryBadge}>
              <Text style={styles.subcategoryText}>
                🎯 {getSafeValue(activity.subcategory)}
              </Text>
            </View>
          </View>
        )}
        
        {getScheduleDisplay() && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#FF6B35" />
            <Text style={styles.scheduleText}>{getScheduleDisplay()}</Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {getLocationDisplay()}
          </Text>
          {activity.distance && (
            <Text style={styles.distance}>
              {activity.distance.toFixed(1)} mi
            </Text>
          )}
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.ageContainer}>
            <Text style={styles.ageText}>{getAgeDisplay()}</Text>
          </View>
          
          {getCostDisplay() === 'FREE' && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          )}
          
          {getCostDisplay() !== 'FREE' && getCostDisplay() !== 'Contact for pricing' && (
            <Text style={styles.costText}>{getCostDisplay()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subcategoryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  subcategoryBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subcategoryText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  distance: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  ageContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ageText: {
    fontSize: 12,
    color: '#666',
  },
  freeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  costText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});
