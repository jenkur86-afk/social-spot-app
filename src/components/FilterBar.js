import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CATEGORIES = [
  'All',
  'Food & Dining',
  'Outdoor Fun',
  'Indoor Fun',
  'Arts, Culture & Learning'
];

export default function FilterBar({ selectedCategory, onCategoryChange, showFreeOnly, onToggleFree }) {
  return (
    <View style={styles.container}>
      {/* Category Filter - Wrapping */}
      <View style={styles.categoryContainer}>
        {CATEGORIES.map((category) => (
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
              {category}
            </Text>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
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
