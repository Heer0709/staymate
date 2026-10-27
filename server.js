/**
 * StayMate AI - Optional Express Server & REST API
 * Provides REST endpoints for listings, bookings, roommate posts, and AI chat.
 * Can be run via: npm install && npm start
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory data store with fallback
let customListings = [];
let bookings = [];
let roommatePosts = [];

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StayMate AI API', time: new Date() });
});

// API: Get Listings
app.get('/api/listings', (req, res) => {
  res.json({ success: true, count: customListings.length, data: customListings });
});

// API: Create new PG Listing (Owner post)
app.post('/api/listings', (req, res) => {
  const newListing = {
    id: 'pg_' + Date.now(),
    verified: false,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  customListings.push(newListing);
  res.status(201).json({ success: true, message: 'Listing submitted for admin approval', data: newListing });
});

// API: Create Booking
app.post('/api/bookings', (req, res) => {
  const booking = {
    id: 'SM-' + Math.floor(100000 + Math.random() * 900000),
    createdAt: new Date().toISOString(),
    status: 'Confirmed',
    ...req.body
  };
  bookings.push(booking);
  res.status(201).json({ success: true, message: 'Booking confirmed!', data: booking });
});

// API: Roommates list & create
app.get('/api/roommates', (req, res) => {
  res.json({ success: true, data: roommatePosts });
});

app.post('/api/roommates', (req, res) => {
  const post = {
    id: 'rm_' + Date.now(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  roommatePosts.push(post);
  res.status(201).json({ success: true, message: 'Roommate post published!', data: post });
});

// API: AI Chat query handler
app.post('/api/ai-chat', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  // Intelligent response generation
  const q = query.toLowerCase();
  let reply = "I'm your StayMate AI assistant! I can help you find verified PGs, hostels, compare amenities, or check house rules.";

  if (q.includes('msu') || q.includes('baroda') || q.includes('vadodara')) {
    reply = "In Vadodara near MSU (Fatehgunj/Sayajigunj), we recommend **Sunrise Luxury Girls PG** (0.6 km from MSU, ₹8,000/mo) and **Green View Boys PG** (1.1 km from MSU, ₹7,500/mo). Both include vegetarian mess, high-speed WiFi, and 24x7 security.";
  } else if (q.includes('ac') && q.includes('study')) {
    reply = "For AC rooms with a dedicated silent study room, check out **Comfort Stay Executive PG** (Alkapuri, ₹9,000) and **Scholar's Den Student Living** (Fatehgunj, ₹8,200). Both have power backup for uninterrupted study sessions.";
  } else if (q.includes('deposit') || q.includes('security')) {
    reply = "Most PGs on StayMate AI require a refundable security deposit equal to 1 month's rent. Standard notice period is 30 days, with a lock-in period of 1 to 3 months depending on the owner.";
  } else if (q.includes('food') || q.includes('mess')) {
    reply = "Over 85% of our listings include 3-4 meals daily (Breakfast, Lunch, Evening Tea/Snacks, and Dinner). You can toggle between 100% Pure Veg and Veg+Non-Veg options using our filters!";
  }

  res.json({ reply });
});

// API: Admin moderation
app.get('/api/admin/pending', (req, res) => {
  const pending = customListings.filter(l => l.status === 'pending_approval');
  res.json({ success: true, count: pending.length, data: pending });
});

app.post('/api/admin/approve/:id', (req, res) => {
  const listing = customListings.find(l => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  listing.status = 'approved';
  listing.verified = true;
  res.json({ success: true, message: 'Listing approved & verified', data: listing });
});

app.post('/api/admin/reject/:id', (req, res) => {
  const listing = customListings.find(l => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  listing.status = 'rejected';
  res.json({ success: true, message: 'Listing rejected', data: listing });
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Only listen if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 StayMate AI server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
