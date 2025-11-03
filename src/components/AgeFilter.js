import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const AGE_RANGES = [
  { label: 'All Ages', value: 'all' },
  { label: 'Toddlers (0-3)', value: 'toddler', emoji: '👶' },
  { label: 'Kids (4-12)', value: 'kids', emoji: '🧒' },
  { label: 'Teens (13-18)', value: 'teens', emoji: '👦' },
  { label: 'Adults (18+)', value: 'adults', emoji: '👨' },
];

export default function AgeFilter({ selectedAge, onAgeChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Age Range:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        {AGE_RANGES.map((age) => (
          <TouchableOpacity
            key={age.value}
            style={[
              styles.ageButton,
              selectedAge === age.value && styles.ageButtonActive
            ]}
            onPress={() => onAgeChange(age.value)}
          >
            {age.emoji && <Text style={styles.emoji}>{age.emoji}</Text>}
            <Text style={[
              styles.ageText,
              selectedAge === age.value && styles.ageTextActive
            ]}>
              {age.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  scroll: {
    flexDirection: 'row',
  },
  ageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  ageButtonActive: {
    backgroundColor: '#4CAF50',
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  ageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  ageTextActive: {
    color: 'white',
  },
});
