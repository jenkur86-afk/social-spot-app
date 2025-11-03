const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const EVENTS = [
  {
    name: "Storytime",
    location: "Barnes & Noble Annapolis",
    address: "2002 Annapolis Mall, Annapolis, MD 21401",
    zipCode: "21401",
    city: "Annapolis",
    county: "Anne Arundel",
    lat: 38.9903,
    lng: -76.5514,
    date: "Every Saturday",
    time: "11:00 AM",
    ageRange: "0-3",
    cost: "Free",
    description: "Free weekly storytime for preschoolers featuring picture books, songs, and activities.",
    website: "https://www.barnesandnoble.com"
  },
  {
    name: "Kids Eat Free Night",
    location: "Chick-fil-A Severna Park",
    address: "558 Ritchie Hwy, Severna Park, MD 21146",
    zipCode: "21146",
    city: "Severna Park",
    county: "Anne Arundel",
    lat: 39.0709,
    lng: -76.5455,
    date: "Every Tuesday",
    time: "5:00 PM - 8:00 PM",
    ageRange: "4-12",
    cost: "Free with adult purchase",
    description: "Kids eat free with purchase of adult entree. One kids meal per adult entree.",
    website: "https://www.chick-fil-a.com"
  },
  {
    name: "Family Movie Night",
    location: "Maryland Live Casino",
    address: "7002 Arundel Mills Cir, Hanover, MD 21076",
    zipCode: "21076",
    city: "Hanover",
    county: "Anne Arundel",
    lat: 39.1589,
    lng: -76.7289,
    date: "First Friday monthly",
    time: "7:30 PM",
    ageRange: "All Ages",
    cost: "Free",
    description: "Free family movie on the big screen. Bring blankets for lawn seating.",
    website: "https://www.marylandlivecasino.com"
  },
  {
    name: "Toddler Art Class",
    location: "Columbia Art Center",
    address: "6100 Foreland Garth, Columbia, MD 21045",
    zipCode: "21045",
    city: "Columbia",
    county: "Howard",
    lat: 39.2037,
    lng: -76.8610,
    date: "Every Wednesday",
    time: "10:00 AM - 10:45 AM",
    ageRange: "0-3",
    cost: "$15 per class",
    description: "Messy play art exploration for toddlers! Painting and sensory bins.",
    website: "https://www.columbiaartcenter.org"
  },
  {
    name: "Free Museum Day",
    location: "Maryland Science Center",
    address: "601 Light St, Baltimore, MD 21230",
    zipCode: "21230",
    city: "Baltimore",
    county: "Baltimore City",
    lat: 39.2808,
    lng: -76.6122,
    date: "First Thursday monthly",
    time: "10:00 AM - 5:00 PM",
    ageRange: "All Ages",
    cost: "Free",
    description: "Free admission to all exhibits with hands-on science demonstrations.",
    website: "https://www.mdsci.org"
  },
  {
    name: "Toddler Time",
    location: "Bethesda Library",
    address: "7400 Arlington Rd, Bethesda, MD 20814",
    zipCode: "20814",
    city: "Bethesda",
    county: "Montgomery",
    lat: 38.9847,
    lng: -77.0947,
    date: "Mondays & Wednesdays",
    time: "10:30 AM - 11:00 AM",
    ageRange: "0-3",
    cost: "Free",
    description: "Story time, songs, and movement activities for toddlers.",
    website: "https://www.montgomerycountymd.gov/library"
  },
  {
    name: "Outdoor Movie Night",
    location: "Rockville Town Square",
    address: "200 E Middle Ln, Rockville, MD 20850",
    zipCode: "20850",
    city: "Rockville",
    county: "Montgomery",
    lat: 39.0840,
    lng: -77.1528,
    date: "Fridays (June-August)",
    time: "8:30 PM",
    ageRange: "All Ages",
    cost: "Free",
    description: "Family movies on a giant screen. Bring blankets and chairs.",
    website: "https://www.rockvillemd.gov"
  },
  {
    name: "Storytime & Craft",
    location: "Frederick County Public Library",
    address: "110 E Patrick St, Frederick, MD 21701",
    zipCode: "21701",
    city: "Frederick",
    county: "Frederick",
    lat: 39.4143,
    lng: -77.4105,
    date: "Thursdays",
    time: "10:00 AM - 10:45 AM",
    ageRange: "4-12",
    cost: "Free",
    description: "Story reading followed by related craft activity.",
    website: "https://www.fcpl.org"
  },
  {
    name: "Beach Bonfire Night",
    location: "Ocean City Beach",
    address: "Boardwalk & 27th St, Ocean City, MD 21842",
    zipCode: "21842",
    city: "Ocean City",
    county: "Worcester",
    lat: 38.3365,
    lng: -75.0849,
    date: "Saturdays (June-August)",
    time: "7:00 PM - 9:00 PM",
    ageRange: "All Ages",
    cost: "Free",
    description: "Family bonfire on the beach with s'mores and music.",
    website: "https://www.ococean.com"
  },
  {
    name: "Farm Day",
    location: "Clarks Elioak Farm",
    address: "10500 Clarksville Pike, Ellicott City, MD 21042",
    zipCode: "21042",
    city: "Ellicott City",
    county: "Howard",
    lat: 39.2437,
    lng: -76.9044,
    date: "Weekends (March-November)",
    time: "10:00 AM - 5:00 PM",
    ageRange: "All Ages",
    cost: "$18 per person",
    description: "Visit farm animals, hayrides, and pick seasonal produce.",
    website: "https://www.clarklandfarm.com"
  }
];

async function addEvents() {
  console.log('\nAdding Maryland events...\n');
  
  try {
    const batch = db.batch();
    
    for (const event of EVENTS) {
      const docRef = db.collection('events').doc();
      batch.set(docRef, {
        name: event.name,
        type: "Event",
        parentCategory: "Events & Programs",
        subcategory: "Community Events",
        tags: ["family", "kids", event.city.toLowerCase()],
        dataType: "Event",
        seasonality: "Year-round",
        location: {
          name: event.location,
          address: event.address,
          city: event.city,
          county: event.county,
          zipCode: event.zipCode,
          coordinates: {
            latitude: event.lat,
            longitude: event.lng
          },
          geohash: require('ngeohash').encode(event.lat, event.lng, 6)
        },
        contact: {
          website: event.website
        },
        eventDate: {
          display: event.date,
          recurring: true
        },
        eventTime: event.time,
        description: event.description,
        filters: {
          ageRange: event.ageRange,
          isFree: event.cost.toLowerCase().includes('free') && !event.cost.toLowerCase().includes('extra'),
          costType: event.cost.toLowerCase().includes('free') ? "free" : "paid",
          costDetails: event.cost
        },
        goodForKids: true,
        metadata: {
          sourceName: "Macaroni Kid Maryland",
          addedDate: new Date().toISOString()
        }
      });
      
      console.log('Added:', event.name, '-', event.location);
    }
    
    await batch.commit();
    console.log('\nSuccess! Added', EVENTS.length, 'events\n');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addEvents();
