import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Event category icons mapping
function getEventCategoryIcon(category) {
  const iconMap = {
    'Festivals & Celebrations': '🎉',
    'Storytimes & Library': '📚',
    'Classes & Workshops': '🎓',
    'Arts & Culture': '🎭',
    'Community Events': '🏘️',
    'Indoor Activities': '🎮',
    'Outdoor & Nature': '🌳',
    'Animals & Wildlife': '🦁',
  };
  return iconMap[category] || '';
}

const EVENT_CATEGORIES = [
  'All',
  'Festivals & Celebrations',
  'Storytimes & Library',
  'Classes & Workshops',
  'Arts & Culture',
  'Community Events',
  'Indoor Activities',
  'Outdoor & Nature',
  'Animals & Wildlife'
];

export default function EventFilterBar({ selectedCategory, onCategoryChange, showFreeOnly, onToggleFree }) {
  return (
    <View style={styles.container}>
      {/* Event Category Filter - Wrapping */}
      <View style={styles.categoryContainer}>
        {EVENT_CATEGORIES.map((category) => {
          const icon = getEventCategoryIcon(category);
          const displayText = category === 'All' ? 'All' : category;
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => onCategoryChange(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {icon && `${icon} `}{displayText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Free Filter Toggle */}
      <TouchableOpacity 
        style={[styles.freeToggle, showFreeOnly && styles.freeToggleActive]}
        onPress={onToggleFree}
      >
        <Text style={[styles.freeText, showFreeOnly && styles.freeTextActive]}>
          {showFreeOnly ? '✓ Free Only' : 'Free Only'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#FD79A8', // Rose/Pink for events
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: 'white',
  },
  freeToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-start',
  },
  freeToggleActive: {
    backgroundColor: '#FD79A8', // Rose/Pink for events
  },
  freeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  freeTextActive: {
    color: 'white',
  },
});