import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FilterButton({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={active ? 'white' : '#666'}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
  textActive: {
    color: 'white',
    fontWeight: '600',
  },
});
