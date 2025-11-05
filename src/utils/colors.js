// Social Spot - Nature & Wellness Color Palette

export const Colors = {
  // Primary Brand Colors
  primary: '#6C5CE7',        // Periwinkle (Activities)
  secondary: '#FD79A8',      // Rose (Events)
  accent: '#FDCB6E',         // Sunflower (Accents)

  // Category Colors
  categories: {
    'Food & Dining': '#FF7675',           // Coral
    'Outdoor Fun': '#55EFC4',             // Mint
    'Indoor Fun': '#74B9FF',              // Sky
    'Arts, Culture & Learning': '#A29BFE', // Lilac
    'Events & Programs': '#FD79A8',       // Rose
  },

  // UI Colors
  background: '#F5F6FA',     // Light gray-blue
  cardBackground: '#FFFFFF', // White
  text: {
    primary: '#2D3436',      // Dark gray
    secondary: '#636E72',    // Medium gray
    disabled: '#B2BEC3',     // Light gray
  },
  borders: {
    light: '#DFE6E9',        // Very light gray
    medium: '#B2BEC3',       // Medium gray
  },

  // Status Colors
  success: '#00B894',        // Green (kept for success states)
  error: '#D63031',          // Red
  warning: '#FDCB6E',        // Yellow
  info: '#74B9FF',           // Blue

  // Map Colors
  searchLocation: '#0984E3', // Blue for search marker
  searchRadius: {
    stroke: 'rgba(9, 132, 227, 0.5)',
    fill: 'rgba(9, 132, 227, 0.1)',
  },

  // Marker Colors (for map pins)
  markers: {
    activities: '#6C5CE7',   // Periwinkle
    events: '#FD79A8',       // Rose
  },
};

// Helper function to get category color
export const getCategoryColor = (category) => {
  return Colors.categories[category] || Colors.primary;
};

// Helper function with opacity
export const withOpacity = (color, opacity) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};