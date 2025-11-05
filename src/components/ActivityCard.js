import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';

// Subcategory icons mapping
function getSubcategoryIcon(subcategory) {
  if (!subcategory) return '🎯';
  
  const sub = subcategory.toLowerCase();
  
  // Animals/Nature (check these FIRST before museum)
  if (sub.includes('petting zoo')) return '🐐';
  if (sub.includes('zoo')) return '🦁';
  if (sub.includes('aquarium')) return '🐠';
  if (sub.includes('farm')) return '🚜';
  
  // Parks & Outdoor
  if (sub.includes('park')) return '🌳';
  if (sub.includes('playground')) return '🛝';
  if (sub.includes('trail') || sub.includes('hiking')) return '🥾';
  if (sub.includes('beach')) return '🏖️';
  if (sub.includes('garden')) return '🌺';
  
  // Food related
  if (sub.includes('restaurant')) return '🍽️';
  if (sub.includes('cafe') || sub.includes('coffee')) return '☕';
  if (sub.includes('bakery')) return '🥐';
  if (sub.includes('ice cream') || sub.includes('dessert')) return '🍦';
  if (sub.includes('pizza')) return '🍕';
  
  // Indoor Fun
  if (sub.includes('arcade') || sub.includes('gaming')) return '🎮';
  if (sub.includes('bowling')) return '🎳';
  if (sub.includes('trampoline')) return '🤸';
  if (sub.includes('climbing')) return '🧗';
  if (sub.includes('laser')) return '🔫';
  if (sub.includes('pool') || sub.includes('swim')) return '🏊';
  if (sub.includes('gym') || sub.includes('fitness')) return '💪';
  if (sub.includes('dance')) return '💃';
  if (sub.includes('martial arts') || sub.includes('karate')) return '🥋';
  
  // Arts & Culture (check AFTER animals/nature)
  if (sub.includes('museum')) return '🏛️';
  if (sub.includes('library')) return '📚';
  if (sub.includes('theater') || sub.includes('theatre')) return '🎭';
  if (sub.includes('music')) return '🎵';
  if (sub.includes('art')) return '🎨';
  if (sub.includes('pottery') || sub.includes('ceramics')) return '🏺';
  if (sub.includes('craft')) return '✂️';
  
  // Sports
  if (sub.includes('soccer')) return '⚽';
  if (sub.includes('basketball')) return '🏀';
  if (sub.includes('baseball')) return '⚾';
  if (sub.includes('tennis')) return '🎾';
  if (sub.includes('golf')) return '⛳';
  if (sub.includes('skate')) return '🛹';
  
  // Events
  if (sub.includes('festival')) return '🎪';
  if (sub.includes('concert')) return '🎤';
  if (sub.includes('fair')) return '🎡';
  if (sub.includes('market')) return '🛍️';
  
  // Education
  if (sub.includes('class') || sub.includes('lesson')) return '📖';
  if (sub.includes('workshop')) return '🔨';
  if (sub.includes('stem') || sub.includes('science')) return '🔬';
  
  // Default
  return '🎯';
}

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
                {getSubcategoryIcon(activity.subcategory)} {getSafeValue(activity.subcategory)}
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