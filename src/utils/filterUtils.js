/**
 * Filter Utilities for Social Spot
 * Centralized filtering logic used across all screens
 */

/**
 * Filter items by categories
 * @param {Array} items - Items to filter
 * @param {Array} selectedCategories - Categories to include
 * @returns {Array} Filtered items
 */
export const filterByCategory = (items, selectedCategories) => {
  if (!selectedCategories || selectedCategories.length === 0) {
    return items;
  }
  return items.filter(item => selectedCategories.includes(item.parentCategory));
};

/**
 * Filter items by event type
 * @param {Array} items - Items to filter
 * @param {Array} selectedTypes - Event types to include
 * @returns {Array} Filtered items
 */
export const filterByEventType = (items, selectedTypes) => {
  if (!selectedTypes || selectedTypes.length === 0) {
    return items;
  }
  return items.filter(item => selectedTypes.includes(item.eventType));
};

/**
 * Filter items by age ranges
 * @param {Array} items - Items to filter
 * @param {Array} selectedAgeRanges - Age ranges to include
 * @returns {Array} Filtered items
 */
export const filterByAge = (items, selectedAgeRanges) => {
  if (!selectedAgeRanges || selectedAgeRanges.length === 0) {
    return items;
  }
  return items.filter(item => {
    if (!item.ageRanges || item.ageRanges.length === 0) {
      return true; // Include "All Ages" items
    }
    return selectedAgeRanges.some(range => item.ageRanges.includes(range));
  });
};

/**
 * Filter items by maximum distance
 * @param {Array} items - Items to filter (must have distance property)
 * @param {number} maxDistance - Maximum distance in km
 * @returns {Array} Filtered items
 */
export const filterByDistance = (items, maxDistance) => {
  if (!maxDistance || maxDistance === Infinity) {
    return items;
  }
  return items.filter(item => item.distance <= maxDistance);
};

/**
 * Apply all filters to items
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter configuration
 * @param {Array} filters.categories - Selected categories
 * @param {Array} filters.eventTypes - Selected event types
 * @param {Array} filters.ageRanges - Selected age ranges
 * @param {number} filters.maxDistance - Maximum distance in km
 * @returns {Array} Filtered items
 */
export const applyAllFilters = (items, filters = {}) => {
  let filtered = items;

  // Category filter
  if (filters.categories) {
    filtered = filterByCategory(filtered, filters.categories);
  }

  // Event type filter
  if (filters.eventTypes) {
    filtered = filterByEventType(filtered, filters.eventTypes);
  }

  // Age filter
  if (filters.ageRanges) {
    filtered = filterByAge(filtered, filters.ageRanges);
  }

  // Distance filter
  if (filters.maxDistance) {
    filtered = filterByDistance(filtered, filters.maxDistance);
  }

  return filtered;
};

/**
 * Sort items by distance (ascending)
 * @param {Array} items - Items to sort (must have distance property)
 * @returns {Array} Sorted items
 */
export const sortByDistance = (items) => {
  return [...items].sort((a, b) => a.distance - b.distance);
};

/**
 * Sort items by date (ascending)
 * @param {Array} items - Items to sort (must have startDate property)
 * @returns {Array} Sorted items
 */
export const sortByDate = (items) => {
  return [...items].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate) : new Date();
    const dateB = b.startDate ? new Date(b.startDate) : new Date();
    return dateA - dateB;
  });
};

/**
 * Get unique categories from items
 * @param {Array} items - Items to extract categories from
 * @returns {Array} Unique categories
 */
export const getUniqueCategories = (items) => {
  const categories = new Set();
  items.forEach(item => {
    if (item.parentCategory) {
      categories.add(item.parentCategory);
    }
  });
  return Array.from(categories).sort();
};

/**
 * Get unique event types from items
 * @param {Array} items - Items to extract event types from
 * @returns {Array} Unique event types
 */
export const getUniqueEventTypes = (items) => {
  const types = new Set();
  items.forEach(item => {
    if (item.eventType) {
      types.add(item.eventType);
    }
  });
  return Array.from(types).sort();
};

/**
 * Get count of items matching filters
 * @param {Array} items - All items
 * @param {Object} filters - Filter configuration
 * @returns {number} Count of matching items
 */
export const getFilteredCount = (items, filters) => {
  return applyAllFilters(items, filters).length;
};
