# 🚀 SOCIAL SPOT - FUTURE FEATURES & IMPROVEMENTS

## 📋 TO-DO LIST

### High Priority
- [ ] **Remember Map Location Preference** - Save and restore ZIP code + radius search on Map tab
  - Currently saves category/free filters but not location search
  - Should restore map center and search radius when app reopens
  - Use AsyncStorage to persist location data

### Medium Priority
- [ ] **Favorites Feature** - Let users save favorite activities
  - Heart icon on activity cards
  - Dedicated Favorites tab or section
  - Persist favorites locally with AsyncStorage

- [ ] **More Event Sources** - Expand event data collection
  - More Macaroni Kid cities (Columbia, Baltimore, Bethesda, etc.)
  - Additional county library systems (Howard, Montgomery, Baltimore)
  - More gym/recreation centers
  - Park & Rec departments

- [ ] **App Icon & Splash Screen** - Professional branding
  - Design custom app icon
  - Create splash screen
  - App Store assets preparation

- [ ] **Age Filter Enhancement** - Better age filtering if data improves
  - Currently 99% of activities are "All Ages"
  - Need more granular age data from sources
  - Consider "Kid-Friendly" badges instead

### Low Priority
- [ ] **Push Notifications** - Alert users about new events
- [ ] **Share Activities** - Share activities with friends
- [ ] **User Reviews** - Let users rate/review activities
- [ ] **Calendar Integration** - Add events to device calendar
- [ ] **Offline Mode** - Cache activities for offline viewing

---

## 🎯 CURRENT STATUS: 90% COMPLETE

### ✅ Completed Features
- Firebase database with 5,294+ activities
- 40+ events (libraries, gyms, Macaroni Kid)
- 3-tab navigation (Home, Map, Events)
- 6-category filtering system
- ZIP code + current location search
- Distance calculations
- Age range filtering
- Free/Paid filtering
- Interactive map with category colors
- Event scheduling (dates, times, recurring)
- Location names for events
- Activity detail pages
- Clean floating search UI
- Pull to refresh

---

## 📝 NOTES
- Map location persistence issue needs debugging in AsyncStorage
- Consider using react-navigation state persistence as alternative
- Test on both iOS and Android for consistency

---

**Last Updated:** November 2025
