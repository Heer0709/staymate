# StayMate AI 🏡🍃
> *"Find Your Perfect Stay, Anywhere"* — India's Smart PG, Hostel, Room & Shared-Accommodation Finder

StayMate AI is a modern, responsive single-page web application (SPA) tailored for Indian college students, interns, and young working professionals. Designed with a soft cream aesthetic (`#FFF6EA`), signature indigo buttons (`#5B5BD6`), cheerful green call actions, yellow star ratings, and hand-drawn typography accents, it delivers a seamless mobile-first app experience alongside an expansive desktop dashboard.

---

## 🌟 Key Highlights & Design Matching

- **Design System & Palette**:
  - Soft cream background (`#FFF6EA` / Dark mode `#151419`)
  - Indigo/purple primary action buttons (`#5B5BD6`)
  - Emerald green for success, calls & WhatsApp (`#10B981`)
  - Yellow/Amber stars for ratings (`#F59E0B`)
  - Rounded cards (`22px`), soft elevation shadows, and friendly handwritten headings (`Caveat`, `Poppins`, `Nunito`).
- **Zero Build Step Dependency**: Runs immediately by opening `index.html` in any browser, or via the included Node.js / Express backend server.
- **Vadodara Centric**: Full local coverage across Fatehgunj (MSU Main & Tech Campuses), Sayajigunj (Railway/Bus Station), Alkapuri, Karelibaug, Manjalpur, and Waghodia Road (Parul University), alongside listings across Ahmedabad, Mumbai, Pune, Bengaluru, Delhi NCR, Kota, and Jaipur.

---

## 📱 Screens & Pages Overview

### 1. Splash Screen
- StayMate AI Logo (House + Leaf SVG) with animated pulsing effect.
- Tagline: *"Find Your Perfect Stay, Anywhere"*.
- Illustrated buildings skyline with a backpacker accent.
- 2-second automatic redirect with a quick "Skip" button.

### 2. Login / Sign Up
- Switchable tabs for **Login** and **Sign Up**.
- Role selector badge: **Tenant / Student** vs. **PG Owner / Warden**.
- Email or Mobile number input with form validation.
- Password input with interactive show/hide eye toggle icon.
- "Forgot Password?" instant recovery trigger.
- "Continue with Google" and "Continue with Facebook" simulated OAuth buttons.
- Pre-loaded Demo Account for instant one-click testing.

### 3. Home Dashboard
- Personalized greeting: *"Hi, Aryan! Ready to find your next home?"*
- Notifications bell with unread indicator and popover drawer.
- **StayMate AI Natural Language Search Box**: Try typing *"girls PG near MSU under 8000 with food"* or use voice search.
- Banner Carousel: *"Better Stays, Brighter Futures"* & 100% Zero Brokerage promise.
- Category icons: **PGs**, **Hostels**, **Rooms**, and **Shared**.
- Quick Services banner: **Nearby PGs (Map)**, **100% Verified Listings**, **24x7 Student Support**, **Zero Brokerage Guarantee**.
- **"Best Match for You"** AI Recommendations section.
- **Trending in Vadodara** horizontal card carousel.
- Locality explorer for Vadodara (Fatehgunj, Sayajigunj, Alkapuri, Karelibaug, etc.).

### 4. Search & Filter
- Multi-level location selector: **State** > **City** > **Area / Locality** (defaulting to Gujarat > Vadodara > All).
- Real-time budget slider: **₹3,000 to ₹25,000 / month**.
- Room type chips: Single Room, Sharing Room, Private Flat.
- Gender filter: Boys, Girls, Co-ed.
- Sharing options: Single, Double, Triple.
- Facilities checkboxes: High-speed WiFi, Air Conditioning (AC), Mess/Food Included, Laundry Service, Silent Study Room, Parking, Gym.
- Food preference: 100% Pure Veg & Jain food vs. Veg + Non-Veg.
- "Verified Only" toggle switch.
- Sorting dropdown: Top Rated, Rent: Low to High, Rent: High to Low, Distance: Nearest.

### 5. PG Results
- Cards with high-resolution Unsplash interior photos.
- Property name, distance to major landmarks (e.g. *"0.6 km from MSU"*), area, and city.
- Monthly rent with per-month pricing.
- Rating badge with yellow stars and verified review count.
- **Verified badge** and color-coded gender pills.
- Heart icon for Save / Wishlist with bounce animation.
- "Schedule Visit" button (in-person physical visit or live video call).
- "Compare" checkbox to compare up to 3 stays side-by-side.

### 6. PG Details Screen
- **Photo Gallery Slider with Lightbox Viewer**: Room interior, washroom, kitchen, dining area, study lounge, and exterior.
- **Virtual 360° Video Tour** modal preview.
- **Rent Details**: Rent per bed for single/double/triple sharing, refundable security deposit, maintenance, electricity/water charges, notice period (30 days), lock-in period (1 month).
- **Rooms & Bed Availability**: Total beds vs. available beds with occupancy status.
- **Current Tenants (Anonymised)**: Student % vs. Working %, total occupants, gender mix, average age.
- **House Rules**: Gate closing timings, visitor policies, smoking/alcohol rules, pet friendliness.
- **Weekly Food Menu**: Interactive Monday to Sunday tabs detailing Breakfast, Lunch, Evening Snacks, and Dinner.
- **Nearby Places with Distances**: MSU Faculty of Tech, MSU Main Campus, Vadodara Railway Station, Sayaji Baug, Sterling Hospital with walk/drive commute times.
- **Review Category Scores**: Cleanliness, Food Quality, Safety & Security, Value for Money (with visual score progress bars).
- Verified user reviews list + **"Add Your Review"** form.
- Similar PGs nearby section.

### 7. Compare PGs
- Compare up to 3 PGs side-by-side in a sticky table.
- Direct row-by-row feature check: Rent, Deposit, Rating, Distance, WiFi, Mess/Food, AC, Study Room, Laundry, Gate Timings with clear `✓` and `—` marks.

### 8. Booking & Contact Screen / Modal
- Selected PG summary card with thumbnail and distance.
- Room type selector (Single, Double, Triple sharing).
- Check-in and Check-out date pickers with dynamic validation (Check-out must be after check-in).
- Rent + Refundable Security Deposit price calculation summary.
- Verified Owner Card: Owner Name, green **Call Owner** button (`tel:`) and **WhatsApp** chat button (`wa.me`).
- "Confirm Booking" action (0% brokerage, pay at property upon move-in).

### 9. Map View (Nearby PGs)
- Interactive Leaflet map with custom price pins (color coded by gender).
- Quick locality search and "Recenter Vadodara" button.
- Tapping any pin pops up an interactive bottom preview card with photo, price, rating, and direct "Book" / "Details" buttons.

### 10. Booking Confirmed
- Animated green success checkmark.
- *"Booking Confirmed!"* header with unique Reference ID (`#SM-849201`).
- Check-in and check-out dates summary and initial rent payable.
- Interactive star rating prompt for user booking experience.
- Action buttons: *"View in My Stays"*, *"Back to Home"*.

---

## 🚀 Extra Pages & Features (Beyond Prototype)

1. **Find a Roommate / Sharing Feed**:
   - Tenants and students post *"Need a Roommate"* or *"Bed Available in PG"*.
   - Filter by budget, location, move-in date, and lifestyle tags (#Vegetarian, #Non-smoker, #EarlyRiser, #PetFriendly).
   - Direct WhatsApp connect button.
   - **"Post Roommate Requirement"** modal form.
2. **State-Wise Browsing**:
   - Interactive directory of all 28 Indian States & 8 Union Territories with capitals, student hubs, and listing counts.
3. **Government & University Hostels Directory**:
   - Organized directory including Samras Chhatralaya Vadodara (free govt accommodation), MSU Halls of Residence, and Working Women's Hostels with eligibility criteria, fees, and contact details.
4. **Post Your PG (Owner Multi-Step Form)**:
   - 4-step wizard: Basic property info, rent & deposit, rooms & beds, amenities & house rules, and photo upload.
5. **Owner Management Dashboard**:
   - Active listings, occupancy rate (92%), inquiries, monthly revenue tracking, and inquiry management.
6. **Admin Dashboard**:
   - Listing verification queue with "Approve" (grants Verified badge) and "Reject" buttons.
7. **My Stays / Bookings History**:
   - View confirmed bookings, check-in dates, sharing type, and download official StayMate invoice receipts.
8. **Saved Wishlist**:
   - Grid of all bookmarked PGs with quick compare, view, and book actions.
9. **User Profile & Settings**:
   - Edit contact info, college/workplace, preferred city, budget preferences, and switch accounts.
10. **Informational & Legal Pages**:
    - About Us, Contact Us with Vadodara office address, FAQ accordion, Privacy Policy, Terms of Service.

---

## 🤖 StayMate AI Features

1. **AI Natural Language Search Parser (`StayMateAI.parseSearchQuery`)**:
   - Translates conversational queries (e.g. *"girls PG near MSU under 8000 with food"*) into structured filters:
     - Gender: `Girls`
     - Location: `Fatehgunj (Near MSU, Vadodara)`
     - Max Budget: `₹8,000`
     - Amenities: `food`
   - Automatically applies filters and displays an *"AI Filters Applied"* banner.
2. **AI Recommendation Match Engine (`StayMateAI.getRecommendations`)**:
   - Computes an compatibility match score (85% to 99%) based on user budget, college location, safety score, and dietary habits.
3. **Interactive Floating AI Assistant**:
   - Accessible via the floating bottom-right magic sparkle bubble.
   - Answers student queries regarding AC + study rooms, MSU girls PGs, security deposits, gate timings, and mess menus.
   - Provides one-click action buttons inside chat to apply filters or jump directly to properties.

---

## 📁 Project Structure

```
staymate/
├── index.html           # Main Single Page Application structure with all views & modals
├── css/
│   └── styles.css       # Design system tokens (#FFF6EA, #5B5BD6), dark mode & custom cards
├── js/
│   ├── data.js          # 28+ rich PG listings, 28 States & 8 UTs, Hostels, Roommates & FAQs
│   ├── state.js         # Reactive state manager (auth, wishlist, compare, filters, bookings)
│   ├── ai.js            # NLP parser, recommendation scorer & AI chatbot knowledge engine
│   └── app.js           # UI controllers, routing, modals, Leaflet map, review & booking logic
├── server.js            # Optional Express backend with REST API endpoints & static serving
├── package.json         # Node.js manifest with express & cors
└── README.md            # Comprehensive project documentation
```

---

## 💻 How to Run Locally

### Option 1: Direct Browser Launch (Fastest & Simplest)
Simply double-click `index.html` or open it in Google Chrome, Microsoft Edge, Firefox, or Safari. All styles, icons, map tiles, and scripts load instantly via CDN without needing any local build step or server!

### Option 2: Run via Node.js Express Server
If Node.js is installed on your machine:
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ License
MIT License. Built for students and shared accommodation seekers across India.
