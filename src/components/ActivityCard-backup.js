import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityCard({ activity, onPress }) {
  // Helper function to get display text for various fields
  const getDisplayText = (value) => {
    if (!value) return '';
    
    // If it's an object with recurrence/start/end (date object)
    if (typeof value === 'object' && value.start) {
      return value.start;
    }
    
    // If it's any other object, try to stringify it
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };
  
  // Get location text
  const getLocationText = () => {
    if (activity.location) {
      if (typeof activity.location === 'string') {
        return activity.location;
      }
      if (activity.location.name) {
        return activity.location.name;
      }
      if (activity.location.address) {
        return activity.location.address;
      }
      if (activity.location.city) {
        return activity.location.city;
      }
    }
    if (activity.venue) {
      return activity.venue;
    }
    if (activity.city) {
      return activity.city;
    }
    return 'Location TBD';
  };
  
  // Get cost text
  const getCostText = () => {
    const cost = activity.cost || activity.filters?.cost;
    if (!cost) return 'Free';
    if (typeof cost === 'object') {
      return cost.type || 'Check website';
    }
    return String(cost);
  };
  
  // Get age range
  const getAgeRange = () => {
    const age = activity.ageRange || activity.filters?.ageRange;
    if (!age) return 'All Ages';
    return String(age);
  };
  
  // Get schedule/date text
  const getScheduleText = () => {
    if (activity.schedule) {
      return getDisplayText(activity.schedule);
    }
    if (activity.date) {
      return getDisplayText(activity.date);
    }
    if (activity.frequency) {
      return activity.frequency;
    }
    return '';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {activity.name || 'Unnamed Event'}
          </Text>
          {activity.distance && (
            <Text style={styles.distance}>
              {activity.distance.toFixed(1)} mi
            </Text>
          )}
        </View>
        
        <Text style={styles.location} numberOfLines={1}>
          <Ionicons name="location-outline" size={14} color="#666" />
          {' ' + getLocationText()}
        </Text>
        
        {getScheduleText() ? (
          <Text style={styles.schedule} numberOfLines={1}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            {' ' + getScheduleText()}
          </Text>
        ) : null}
        
        <View style={styles.footer}>
          <View style={styles.tags}>
            <View style={[styles.tag, styles.costTag]}>
              <Text style={styles.tagText}>{getCostText()}</Text>
            </View>
            <View style={[styles.tag, styles.ageTag]}>
              <Text style={styles.tagText}>{getAgeRange()}</Text>
            </View>
          </View>
        </View>
        
        {activity.description && (
          <Text style={styles.description} numberOfLines={2}>
            {activity.description}
          </Text>
        )}
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  schedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  costTag: {
    backgroundColor: '#E8F5E9',
  },
  ageTag: {
    backgroundColor: '#FFF3E0',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    lineHeight: 20,
  },
});
