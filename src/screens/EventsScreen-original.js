import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { ScrollView } from 'react-native';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ActivityCard from '../components/ActivityCard';
import AgeFilter from '../components/AgeFilter';
import LocationSearch from '../components/LocationSearch';
import { getCoordinatesFromZip, calculateDistance } from '../utils/geocoding';
import { useLocation } from '../contexts/LocationContext';
import { Ionicons } from '@expo/vector-icons';

export default function EventsScreen({ navigation }) {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { globalLocation, updateLocation } = useLocation();
  const [selectedAge, setSelectedAge] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming'); // 'upcoming', 'today', 'week', 'month', 'all'
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [globalLocation, selectedAge, allEvents, dateFilter, showPastEvents]);

  // Parse event dates to Date objects
  function parseEventDate(event) {
    // Try to parse from eventDate or scheduleDescription
    const dateStr = event.eventDate || event.eventStartDate || '';
    const scheduleStr = event.scheduleDescription || '';
    
    // Common date patterns
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // 12/7/2024
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,  // Dec 7, 2024
      /(\d{4})-(\d{2})-(\d{2})/  // 2024-12-07
    ];
    
    // Try eventDate first
    if (dateStr) {
      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (pattern.source.includes('Jan|Feb')) {
            // Month name format
            const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, 
                              Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
            const monthName = match[1].substring(0, 3);
            return new Date(match[3], monthMap[monthName], match[2]);
          } else if (match[0].includes('-')) {
            // ISO format
            return new Date(match[1], match[2] - 1, match[3]);
          } else {
            // MM/DD/YYYY format
            return new Date(match[3], match[1] - 1, match[2]);
          }
        }
      }
    }
    
    // Try scheduleDescription
    if (scheduleStr) {
      for (const pattern of patterns) {
        const match = scheduleStr.match(pattern);
        if (match) {
          if (pattern.source.includes('Jan|Feb')) {
            const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                              Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
            const monthName = match[1].substring(0, 3);
            return new Date(match[3], monthMap[monthName], match[2]);
          } else if (match[0].includes('-')) {
            return new Date(match[1], match[2] - 1, match[3]);
          } else {
            return new Date(match[3], match[1] - 1, match[2]);
          }
        }
      }
    }
    
    // For recurring events, return today's date so they show up
    if (event.recurring || event.schedule === 'Weekly' || event.schedule === 'Daily') {
      return new Date();
    }
    
    return null;
  }

  async function loadEvents() {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('parentCategory', '==', 'Events & Programs'),
        limit(3000)
      );
      const snapshot = await getDocs(q);
      
      let eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Add parsed dates to events
      eventsData = eventsData.map(event => ({
        ...event,
        parsedDate: parseEventDate(event)
      }));
      
      // Sort by date (earliest first)
      eventsData.sort((a, b) => {
        if (!a.parsedDate && !b.parsedDate) return 0;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate - b.parsedDate;
      });
      
      console.log(`Loaded ${eventsData.length} events`);
      
      setAllEvents(eventsData);
      setFilteredEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  }

  function matchesDateFilter(event) {
    const eventDate = event.parsedDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Hide past events unless showPastEvents is true
    if (!showPastEvents && eventDate && eventDate < today) {
      // Exception for recurring events
      if (!event.recurring && event.schedule !== 'Weekly' && event.schedule !== 'Daily') {
        return false;
      }
    }
    
    // Apply date filter
    switch (dateFilter) {
      case 'today':
        if (!eventDate) return false;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return eventDate >= today && eventDate < tomorrow;
        
      case 'week':
        if (!eventDate) return false;
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return eventDate >= today && eventDate < nextWeek;
        
      case 'month':
        if (!eventDate) return false;
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return eventDate >= today && eventDate < nextMonth;
        
      case 'upcoming':
        // Show future events and recurring events
        if (!eventDate) return true; // Show events without dates
        if (event.recurring || event.schedule === 'Weekly' || event.schedule === 'Daily') return true;
        return eventDate >= today;
        
      case 'all':
        return true;
        
      default:
        return true;
    }
  }

  function matchesAgeFilter(event) {
    if (selectedAge === 'all') return true;
    
    const ageRange = event.ageRange || event.filters?.ageRange;
    if (!ageRange) return true;
    
    const ageLower = ageRange.toLowerCase();
    
    switch (selectedAge) {
      case 'toddler':
        return ageLower.includes('0-3') || 
               ageLower.includes('0-2') ||
               ageLower.includes('toddler') || 
               ageLower.includes('infant') ||
               ageLower.includes('all ages');
      
      case 'kids':
        return ageLower.includes('4-12') || 
               ageLower.includes('3-5') ||
               ageLower.includes('5-12') ||
               ageLower.includes('kids') || 
               ageLower.includes('children') ||
               ageLower.includes('all ages');
      
      case 'teens':
        return ageLower.includes('13-18') || 
               ageLower.includes('13-17') ||
               ageLower.includes('teen') || 
               ageLower.includes('youth') ||
               ageLower.includes('all ages');
      
      case 'adults':
        return ageLower.includes('18+') || 
               ageLower.includes('adult') ||
               ageLower.includes('all ages');
      
      default:
        return true;
    }
  }

  function applyFilters() {
    let filtered = [...allEvents];
    
    // Date filter (includes hiding past events)
    filtered = filtered.filter(e => matchesDateFilter(e));
    
    // Location filter
    if (globalLocation) {
      filtered = filtered
        .map(event => {
          const coords = event.location?.coordinates || event.coordinates;
          
          if (!coords) return null;
          
          const lat = coords.latitude || coords.lat;
          const lon = coords.longitude || coords.lon || coords.lng;
          
          if (!lat || !lon) return null;
          
          const distance = calculateDistance(
            globalLocation.latitude,
            globalLocation.longitude,
            lat,
            lon
          );
          
          return { ...event, distance };
        })
        .filter(event => event && event.distance <= globalLocation.radius);
    }
    
    // Age filter
    if (selectedAge !== 'all') {
      filtered = filtered.filter(e => matchesAgeFilter(e));
    }
    
    // Sort by date (already sorted in loadEvents, but re-sort after filtering)
    filtered.sort((a, b) => {
      // Put recurring events first if today
      if (dateFilter === 'today') {
        if (a.recurring && !b.recurring) return -1;
        if (!a.recurring && b.recurring) return 1;
      }
      
      // Sort by date
      if (!a.parsedDate && !b.parsedDate) return 0;
      if (!a.parsedDate) return 1;
      if (!b.parsedDate) return -1;
      return a.parsedDate - b.parsedDate;
    });
    
    setFilteredEvents(filtered);
  }

  async function handleLocationSearch(searchData, radius, searchType) {
    await updateLocation(searchData, radius, searchType);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  function handleEventPress(event) {
    navigation.navigate('ActivityDetail', { activity: event });
  }

  const DateFilterButton = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[styles.dateFilterBtn, dateFilter === value && styles.dateFilterBtnActive]}
      onPress={() => setDateFilter(value)}
    >
      {icon && <Ionicons name={icon} size={16} color={dateFilter === value ? '#FFF' : '#666'} />}
      <Text style={[styles.dateFilterText, dateFilter === value && styles.dateFilterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Events & Programs</Text>
        <Text style={styles.subtitle}>
          {filteredEvents.length} events
          {globalLocation && ` within ${globalLocation.radius} mi of ${globalLocation.zipCode}`}
          {!showPastEvents && ' (hiding past events)'}
        </Text>
      </View>

      <LocationSearch 
        onSearch={handleLocationSearch}
        loading={false}
      />

      {/* Date Filter */}
      <View style={styles.dateFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <DateFilterButton label="Upcoming" value="upcoming" icon="calendar" />
          <DateFilterButton label="Today" value="today" icon="today" />
          <DateFilterButton label="This Week" value="week" icon="calendar-outline" />
          <DateFilterButton label="This Month" value="month" icon="calendar-outline" />
          <DateFilterButton label="All Dates" value="all" icon="infinite" />
        </ScrollView>
      </View>

      {/* Show Past Events Toggle */}
      <TouchableOpacity
        style={styles.pastEventsToggle}
        onPress={() => setShowPastEvents(!showPastEvents)}
      >
        <Ionicons 
          name={showPastEvents ? "checkbox" : "square-outline"} 
          size={20} 
          color="#4CAF50" 
        />
        <Text style={styles.pastEventsText}>Show past events</Text>
      </TouchableOpacity>

      <AgeFilter
        selectedAge={selectedAge}
        onAgeChange={setSelectedAge}
      />
      
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard 
            activity={item} 
            onPress={() => handleEventPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              {dateFilter === 'today' ? 'No events scheduled for today' :
               dateFilter === 'week' ? 'No events this week' :
               dateFilter === 'month' ? 'No events this month' :
               'Try adjusting your filters'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  list: {
    paddingVertical: 8,
  },
  dateFilterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  dateFilterBtnActive: {
    backgroundColor: '#4CAF50',
  },
  dateFilterText: {
    fontSize: 14,
    color: '#666',
  },
  dateFilterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  pastEventsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  pastEventsText: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
