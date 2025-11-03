import { collection, query, where, getDocs, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { geohashQueryBounds } from 'geofire-common';

/**
 * Fetch activities within radius of location with optional filters
 * @param {Object} location - {latitude, longitude}
 * @param {number} radiusInKm - Search radius in kilometers
 * @param {Object} filters - {categories, ageRanges}
 * @param {number} pageSize - Items per page
 * @param {Object} lastDoc - Last document for pagination
 * @returns {Promise<{activities: Array, lastVisible: Object}>}
 */
export const fetchActivities = async (
  location,
  radiusInKm,
  filters = {},
  pageSize = 50,
  lastDoc = null
) => {
  try {
    const center = [location.latitude, location.longitude];
    const radiusInM = radiusInKm * 1000;
    const bounds = geohashQueryBounds(center, radiusInM);

    const activities = [];
    const promises = [];

    // Query each geohash range
    for (const bound of bounds) {
      let q = query(
        collection(db, 'activities'),
        where('geohash', '>=', bound[0]),
        where('geohash', '<=', bound[1]),
        orderBy('geohash'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      promises.push(getDocs(q));
    }

    const snapshots = await Promise.all(promises);
    let lastVisible = null;

    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const distance = calculateDistance(location, data.location);

        if (distance <= radiusInKm) {
          activities.push({
            id: doc.id,
            ...data,
            distance: parseFloat(distance.toFixed(2)),
          });
        }
      });

      if (snapshot.docs.length > 0) {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
      }
    });

    // Apply filters
    let filtered = activities;
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(a => 
        filters.categories.includes(a.parentCategory)
      );
    }
    if (filters.ageRanges && filters.ageRanges.length > 0) {
      filtered = filtered.filter(a =>
        filters.ageRanges.some(range => a.ageRanges?.includes(range))
      );
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    return {
      activities: filtered,
      lastVisible,
    };
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Fetch events within radius of location with optional filters
 * @param {Object} location - {latitude, longitude}
 * @param {number} radiusInKm - Search radius in kilometers
 * @param {Object} filters - {eventTypes, ageRanges}
 * @param {number} pageSize - Items per page
 * @param {Object} lastDoc - Last document for pagination
 * @returns {Promise<{events: Array, lastVisible: Object}>}
 */
export const fetchEvents = async (
  location,
  radiusInKm,
  filters = {},
  pageSize = 50,
  lastDoc = null
) => {
  try {
    const center = [location.latitude, location.longitude];
    const radiusInM = radiusInKm * 1000;
    const bounds = geohashQueryBounds(center, radiusInM);

    const events = [];
    const promises = [];

    for (const bound of bounds) {
      let q = query(
        collection(db, 'events'),
        where('geohash', '>=', bound[0]),
        where('geohash', '<=', bound[1]),
        orderBy('geohash'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      promises.push(getDocs(q));
    }

    const snapshots = await Promise.all(promises);
    let lastVisible = null;

    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const distance = calculateDistance(location, data.location);

        if (distance <= radiusInKm) {
          events.push({
            id: doc.id,
            ...data,
            distance: parseFloat(distance.toFixed(2)),
          });
        }
      });

      if (snapshot.docs.length > 0) {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
      }
    });

    // Apply filters
    let filtered = events;
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      filtered = filtered.filter(e =>
        filters.eventTypes.includes(e.eventType)
      );
    }
    if (filters.ageRanges && filters.ageRanges.length > 0) {
      filtered = filtered.filter(e =>
        filters.ageRanges.some(range => e.ageRanges?.includes(range))
      );
    }

    // Sort by date, then distance
    filtered.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date();
      const dateB = b.startDate ? new Date(b.startDate) : new Date();
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      return a.distance - b.distance;
    });

    return {
      events: filtered,
      lastVisible,
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - {latitude, longitude}
 * @param {Object} point2 - {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
