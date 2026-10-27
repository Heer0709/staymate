/**
 * StayMate AI - Application State Manager
 * Handles view routing, user profile, wishlist, comparison list, filters, and local persistence.
 */

class StayMateState {
  constructor() {
    this.listeners = [];

    // Load persisted state or defaults
    this.currentView = 'home';
    this.previousView = 'home';
    this.selectedListingId = 'pg-vbr-01';
    this.selectedHostelId = null;
    this.activeBooking = null;

    // Current User Session
    const savedUser = localStorage.getItem('staymate_user');
    this.currentUser = savedUser ? JSON.parse(savedUser) : {
      id: 'usr-901',
      name: 'Aryan Sharma',
      role: 'tenant', // 'tenant' or 'owner' or 'admin'
      email: 'aryan.sharma@msubaroda.ac.in',
      phone: '+91 98250 88910',
      college: 'MSU Faculty of Technology & Engineering',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      preferences: {
        budget: 8500,
        sharing: 'Double',
        diet: 'Vegetarian',
        city: 'Vadodara'
      }
    };

    // Wishlist / Saved PGs
    const savedFavs = localStorage.getItem('staymate_saved');
    this.savedListings = savedFavs ? JSON.parse(savedFavs) : ['pg-vbr-01', 'pg-vbr-03'];

    // Comparison List (Max 3)
    const savedCompare = localStorage.getItem('staymate_compare');
    this.compareListings = savedCompare ? JSON.parse(savedCompare) : ['pg-vbr-01', 'pg-vbr-02'];

    // Bookings History
    const savedBookings = localStorage.getItem('staymate_bookings');
    this.bookings = savedBookings ? JSON.parse(savedBookings) : [
      {
        id: 'SM-782910',
        listingId: 'pg-vbr-01',
        listingName: 'Sunrise Luxury Girls PG',
        area: 'Fatehgunj, Vadodara',
        photo: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80',
        checkIn: '2026-11-01',
        checkOut: '2027-05-01',
        sharingType: 'Double Sharing',
        rentPerMonth: 8000,
        depositPaid: 8000,
        totalInitial: 16000,
        status: 'Confirmed',
        bookedOn: '2026-10-25',
        ownerName: 'Smt. Manjula Patel',
        ownerPhone: '+91 98250 14820'
      }
    ];

    // Roommate posts
    const savedRoommates = localStorage.getItem('staymate_roommates');
    this.roommates = savedRoommates ? JSON.parse(savedRoommates) : window.staymateData.roommates;

    // Owner Custom Listings
    const savedOwnerListings = localStorage.getItem('staymate_owner_listings');
    this.ownerListings = savedOwnerListings ? JSON.parse(savedOwnerListings) : [];

    // Dark Mode
    this.darkMode = localStorage.getItem('staymate_theme') === 'dark';

    // Active Search Filters
    this.filters = {
      state: 'Gujarat',
      city: 'Vadodara',
      area: 'All',
      minBudget: 3000,
      maxBudget: 20000,
      gender: 'All', // 'All', 'Girls', 'Boys', 'Co-ed'
      roomTypes: [], // 'Single', 'Sharing', 'Private'
      sharingTypes: [], // 'Single', 'Double', 'Triple', '4+'
      facilities: [], // 'wifi', 'ac', 'food', 'laundry', 'study_room', 'parking'
      foodChoice: 'All', // 'All', 'Pure Veg', 'Veg + Non-Veg'
      verifiedOnly: false,
      minRating: 0,
      sortBy: 'rating', // 'rating', 'price_asc', 'price_desc', 'distance'
      searchQuery: '',
      aiNaturalQuery: ''
    };

    // System Notifications
    this.notifications = [
      { id: 1, title: 'Welcome to StayMate AI! 🎉', message: 'Explore verified PGs near MSU Vadodara with zero brokerage.', time: 'Just now', unread: true },
      { id: 2, title: 'AI Match Ready ⚡', message: 'Sunrise Luxury PG matches 98% of your preferences!', time: '2h ago', unread: true },
      { id: 3, title: 'Schedule Visit Reminder 📅', message: 'Your visit for Green View PG is confirmed for tomorrow.', time: '1d ago', unread: false }
    ];
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify(event, payload) {
    this.listeners.forEach(cb => cb(event, payload, this));
  }

  // View Navigation
  setView(viewName, params = {}) {
    if (this.currentView !== viewName) {
      this.previousView = this.currentView;
      this.currentView = viewName;
    }
    if (params.listingId) {
      this.selectedListingId = params.listingId;
    }
    if (params.hostelId) {
      this.selectedHostelId = params.hostelId;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify('view_change', { view: viewName, params });
  }

  // Toggle Wishlist
  toggleSaved(listingId) {
    const idx = this.savedListings.indexOf(listingId);
    let isSaved = false;
    if (idx > -1) {
      this.savedListings.splice(idx, 1);
      isSaved = false;
    } else {
      this.savedListings.push(listingId);
      isSaved = true;
    }
    localStorage.setItem('staymate_saved', JSON.stringify(this.savedListings));
    this.notify('saved_change', { listingId, isSaved, count: this.savedListings.length });
    return isSaved;
  }

  isSaved(listingId) {
    return this.savedListings.includes(listingId);
  }

  // Toggle Compare (Max 3)
  toggleCompare(listingId) {
    const idx = this.compareListings.indexOf(listingId);
    let added = false;
    if (idx > -1) {
      this.compareListings.splice(idx, 1);
      added = false;
    } else {
      if (this.compareListings.length >= 3) {
        return { success: false, message: 'You can compare at most 3 PGs at a time.' };
      }
      this.compareListings.push(listingId);
      added = true;
    }
    localStorage.setItem('staymate_compare', JSON.stringify(this.compareListings));
    this.notify('compare_change', { listingId, added, list: this.compareListings });
    return { success: true, added, list: this.compareListings };
  }

  isCompared(listingId) {
    return this.compareListings.includes(listingId);
  }

  // Add Booking
  addBooking(bookingData) {
    const newBooking = {
      id: 'SM-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Confirmed',
      bookedOn: new Date().toISOString().split('T')[0],
      ...bookingData
    };
    this.bookings.unshift(newBooking);
    this.activeBooking = newBooking;
    localStorage.setItem('staymate_bookings', JSON.stringify(this.bookings));
    this.notify('booking_added', newBooking);
    return newBooking;
  }

  // Add Roommate Post
  addRoommatePost(post) {
    const newPost = {
      id: 'rm-' + Date.now(),
      avatar: this.currentUser ? this.currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      ...post
    };
    this.roommates.unshift(newPost);
    localStorage.setItem('staymate_roommates', JSON.stringify(this.roommates));
    this.notify('roommate_added', newPost);
    return newPost;
  }

  // Add Owner PG Listing
  addOwnerListing(listing) {
    const newListing = {
      id: 'pg-usr-' + Date.now(),
      verified: false,
      status: 'Pending Verification',
      rating: 4.8,
      reviewCount: 0,
      reviews: [],
      ...listing
    };
    this.ownerListings.unshift(newListing);
    localStorage.setItem('staymate_owner_listings', JSON.stringify(this.ownerListings));
    this.notify('owner_listing_added', newListing);
    return newListing;
  }

  // Set Theme
  setTheme(isDark) {
    this.darkMode = isDark;
    localStorage.setItem('staymate_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    this.notify('theme_change', { darkMode: this.darkMode });
  }

  toggleTheme() {
    this.setTheme(!this.darkMode);
  }

  // Filter Updates
  updateFilters(newFilters = {}) {
    this.filters = { ...this.filters, ...newFilters };
    this.notify('filters_change', this.filters);
  }

  resetFilters() {
    this.filters = {
      state: 'Gujarat',
      city: 'Vadodara',
      area: 'All',
      minBudget: 3000,
      maxBudget: 20000,
      gender: 'All',
      roomTypes: [],
      sharingTypes: [],
      facilities: [],
      foodChoice: 'All',
      verifiedOnly: false,
      minRating: 0,
      sortBy: 'rating',
      searchQuery: '',
      aiNaturalQuery: ''
    };
    this.notify('filters_change', this.filters);
  }

  // Get All Active Listings (Builtin + Approved Owner Listings)
  getAllListings() {
    const builtin = window.staymateData ? window.staymateData.listings : [];
    return [...builtin, ...this.ownerListings];
  }

  // Get Filtered Listings
  getFilteredListings() {
    const all = this.getAllListings();
    const f = this.filters;

    return all.filter(item => {
      // City check
      if (f.city && f.city !== 'All' && item.city.toLowerCase() !== f.city.toLowerCase()) {
        return false;
      }
      // Area check
      if (f.area && f.area !== 'All' && item.area.toLowerCase() !== f.area.toLowerCase()) {
        return false;
      }
      // State check
      if (f.state && f.state !== 'All' && item.state.toLowerCase() !== f.state.toLowerCase()) {
        return false;
      }
      // Budget check
      if (item.rent > f.maxBudget || item.rent < f.minBudget) {
        return false;
      }
      // Gender check
      if (f.gender && f.gender !== 'All' && item.gender.toLowerCase() !== f.gender.toLowerCase()) {
        return false;
      }
      // Verified only
      if (f.verifiedOnly && !item.verified) {
        return false;
      }
      // Minimum rating
      if (f.minRating > 0 && item.rating < f.minRating) {
        return false;
      }
      // Food choice
      if (f.foodChoice && f.foodChoice !== 'All') {
        if (f.foodChoice === 'Pure Veg' && !item.foodType.toLowerCase().includes('veg')) return false;
      }
      // Facilities / Amenities
      if (f.facilities && f.facilities.length > 0) {
        const hasAllFacilities = f.facilities.every(fac => item.amenities && item.amenities.includes(fac));
        if (!hasAllFacilities) return false;
      }
      // Sharing types
      if (f.sharingTypes && f.sharingTypes.length > 0) {
        const hasSharing = item.roomsSharing && item.roomsSharing.some(r => f.sharingTypes.includes(r.type));
        if (!hasSharing) return false;
      }
      // General text query
      if (f.searchQuery && f.searchQuery.trim() !== '') {
        const q = f.searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesArea = item.area.toLowerCase().includes(q);
        const matchesAddress = item.address.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesArea && !matchesAddress && !matchesCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (f.sortBy === 'price_asc') return a.rent - b.rent;
      if (f.sortBy === 'price_desc') return b.rent - a.rent;
      if (f.sortBy === 'distance') {
        // approximate by parse float in distanceText
        const distA = parseFloat(a.distanceText) || 99;
        const distB = parseFloat(b.distanceText) || 99;
        return distA - distB;
      }
      // default: rating desc
      return b.rating - a.rating;
    });
  }
}

// Global instance
window.staymateState = new StayMateState();
