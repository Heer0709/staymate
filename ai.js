/**
 * StayMate AI - Intelligent NLP Parser, Recommendation Engine & Chat Assistant
 */

const StayMateAI = {
  /**
   * 1. Natural Language Search Parser
   * Parses natural conversational search sentences like:
   * "girls PG near MSU under 8000 with food"
   * "boys double sharing in alkapuri with AC under 10000"
   * "single room in karelibaug verified pure veg"
   */
  parseSearchQuery(query) {
    if (!query || typeof query !== 'string') return null;
    const q = query.toLowerCase();

    const result = {
      detected: false,
      summaryTags: [],
      filters: {}
    };

    // 1. Gender detection
    if (q.includes('girl') || q.includes('female') || q.includes('women') || q.includes('ladies')) {
      result.filters.gender = 'Girls';
      result.summaryTags.push('Girls PG');
      result.detected = true;
    } else if (q.includes('boy') || q.includes('male') || q.includes('men') || q.includes('gents')) {
      result.filters.gender = 'Boys';
      result.summaryTags.push('Boys PG');
      result.detected = true;
    } else if (q.includes('coed') || q.includes('co-ed') || q.includes('unisex') || q.includes('mixed')) {
      result.filters.gender = 'Co-ed';
      result.summaryTags.push('Co-ed');
      result.detected = true;
    }

    // 2. Budget extraction (e.g., "under 8000", "below 10k", "< 9000", "upto 7500", "8k")
    const budgetMatch = q.match(/(?:under|below|upto|within|budget|max|less than|<)?\s*(?:rs\.?|inr|₹)?\s*(\d{1,2}(?:\.\d+)?)\s*(?:k|thousand)/i) ||
                        q.match(/(?:under|below|upto|within|budget|max|less than|<)\s*(?:rs\.?|inr|₹)?\s*(\d{4,5})/i) ||
                        q.match(/(?:rs\.?|inr|₹)\s*(\d{4,5})/i);

    if (budgetMatch) {
      let val = parseFloat(budgetMatch[1]);
      if (val < 100) val = val * 1000; // e.g. 8k -> 8000
      result.filters.maxBudget = Math.round(val);
      result.summaryTags.push(`Max ₹${result.filters.maxBudget.toLocaleString('en-IN')}`);
      result.detected = true;
    }

    // 3. Landmarks and Localities (Vadodara & Metros)
    if (q.includes('msu') || q.includes('university') || q.includes('faculty of tech')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Fatehgunj';
      result.summaryTags.push('Near MSU (Fatehgunj)');
      result.detected = true;
    } else if (q.includes('fatehgunj')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Fatehgunj';
      result.summaryTags.push('Fatehgunj');
      result.detected = true;
    } else if (q.includes('sayajigunj') || q.includes('station') || q.includes('railway')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Sayajigunj';
      result.summaryTags.push('Sayajigunj');
      result.detected = true;
    } else if (q.includes('alkapuri')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Alkapuri';
      result.summaryTags.push('Alkapuri');
      result.detected = true;
    } else if (q.includes('karelibaug')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Karelibaug';
      result.summaryTags.push('Karelibaug');
      result.detected = true;
    } else if (q.includes('manjalpur')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Manjalpur';
      result.summaryTags.push('Manjalpur');
      result.detected = true;
    } else if (q.includes('waghodia') || q.includes('parul')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Waghodia Road';
      result.summaryTags.push('Near Parul (Waghodia Rd)');
      result.detected = true;
    } else if (q.includes('gotri')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Gotri';
      result.summaryTags.push('Gotri');
      result.detected = true;
    } else if (q.includes('vasna') || q.includes('bhayli')) {
      result.filters.city = 'Vadodara';
      result.filters.area = 'Vasna-Bhayli';
      result.summaryTags.push('Vasna-Bhayli');
      result.detected = true;
    } else if (q.includes('ahmedabad') || q.includes('navrangpura')) {
      result.filters.city = 'Ahmedabad';
      result.summaryTags.push('Ahmedabad');
      result.detected = true;
    } else if (q.includes('mumbai') || q.includes('bandra')) {
      result.filters.city = 'Mumbai';
      result.summaryTags.push('Mumbai');
      result.detected = true;
    } else if (q.includes('pune') || q.includes('hinjawadi') || q.includes('fergusson')) {
      result.filters.city = 'Pune';
      result.summaryTags.push('Pune');
      result.detected = true;
    } else if (q.includes('bengaluru') || q.includes('bangalore') || q.includes('koramangala')) {
      result.filters.city = 'Bengaluru';
      result.summaryTags.push('Bengaluru');
      result.detected = true;
    } else if (q.includes('delhi') || q.includes('kamla nagar') || q.includes('gurgaon') || q.includes('gurugram')) {
      result.filters.city = 'Delhi';
      result.summaryTags.push('Delhi NCR');
      result.detected = true;
    } else if (q.includes('kota') || q.includes('allen')) {
      result.filters.city = 'Kota';
      result.summaryTags.push('Kota');
      result.detected = true;
    }

    // 4. Amenities & Facilities detection
    const facilities = [];
    if (q.includes('ac') || q.includes('air conditioner') || q.includes('air conditioning')) {
      facilities.push('ac');
      result.summaryTags.push('AC');
      result.detected = true;
    }
    if (q.includes('food') || q.includes('mess') || q.includes('meals') || q.includes('tiffin')) {
      facilities.push('food');
      result.summaryTags.push('Mess / Food');
      result.detected = true;
    }
    if (q.includes('wifi') || q.includes('internet') || q.includes('wi-fi')) {
      facilities.push('wifi');
      result.summaryTags.push('High-speed WiFi');
      result.detected = true;
    }
    if (q.includes('study') || q.includes('library') || q.includes('reading room')) {
      facilities.push('study_room');
      result.summaryTags.push('Study Room');
      result.detected = true;
    }
    if (q.includes('laundry') || q.includes('washing machine')) {
      facilities.push('laundry');
      result.summaryTags.push('Laundry');
      result.detected = true;
    }
    if (q.includes('gym') || q.includes('fitness')) {
      facilities.push('gym');
      result.summaryTags.push('Gym');
      result.detected = true;
    }
    if (facilities.length > 0) {
      result.filters.facilities = facilities;
    }

    // 5. Sharing type
    const sharingTypes = [];
    if (q.includes('single') || q.includes('private room') || q.includes('1 seater')) {
      sharingTypes.push('Single');
      result.summaryTags.push('Single Room');
      result.detected = true;
    }
    if (q.includes('double') || q.includes('2 sharing') || q.includes('twin')) {
      sharingTypes.push('Double');
      result.summaryTags.push('Double Sharing');
      result.detected = true;
    }
    if (q.includes('triple') || q.includes('3 sharing')) {
      sharingTypes.push('Triple');
      result.summaryTags.push('Triple Sharing');
      result.detected = true;
    }
    if (sharingTypes.length > 0) {
      result.filters.sharingTypes = sharingTypes;
    }

    // 6. Food preference (Pure Veg)
    if (q.includes('pure veg') || q.includes('jain') || q.includes('vegetarian')) {
      result.filters.foodChoice = 'Pure Veg';
      result.summaryTags.push('Pure Veg');
      result.detected = true;
    }

    // 7. Verified
    if (q.includes('verified') || q.includes('safe') || q.includes('trusted')) {
      result.filters.verifiedOnly = true;
      result.summaryTags.push('Verified Only');
      result.detected = true;
    }

    return result;
  },

  /**
   * 2. AI Personalized Recommendations
   * Computes a match score (0 to 100%) for each listing against the user's active preferences
   */
  getRecommendations(user = null, limit = 4) {
    const all = window.staymateState.getAllListings();
    const targetBudget = (user && user.preferences && user.preferences.budget) || 8500;
    const targetCity = (user && user.preferences && user.preferences.city) || 'Vadodara';

    const scored = all.map(item => {
      let score = 70; // baseline

      // City alignment
      if (item.city.toLowerCase() === targetCity.toLowerCase()) score += 15;

      // Budget fit: within +/- 1500 is optimal
      const diff = Math.abs(item.rent - targetBudget);
      if (diff <= 1000) score += 10;
      else if (diff <= 2500) score += 5;
      else score -= 10;

      // Rating bonus
      score += Math.round((item.rating - 4.0) * 8);

      // Verified bonus
      if (item.verified) score += 5;

      // Safety and cleanliness scores
      if (item.reviewScores) {
        if (item.reviewScores.safety >= 4.8) score += 4;
        if (item.reviewScores.cleanliness >= 4.8) score += 3;
      }

      // Cap between 82% and 99% for realistic AI match
      const matchPercent = Math.min(99, Math.max(82, score));

      // Key reason
      let reason = 'Top rated stay in high demand';
      if (item.distanceText && item.distanceText.includes('MSU')) {
        reason = `Prime student location: ${item.distanceText}`;
      } else if (item.amenities.includes('study_room') && item.amenities.includes('wifi')) {
        reason = 'Ideal for studies with dedicated reading room & fast WiFi';
      } else if (item.foodType.includes('Pure Veg')) {
        reason = 'Authentic homestyle 4-meal pure veg mess included';
      }

      return {
        ...item,
        matchPercent,
        matchReason: reason
      };
    });

    // Sort descending by match percentage
    scored.sort((a, b) => b.matchPercent - a.matchPercent);
    return scored.slice(0, limit);
  },

  /**
   * 3. AI Chat Assistant Engine
   * Generates intelligent, contextual responses with direct quick actions
   */
  async askChatbot(userMessage) {
    const q = (userMessage || '').toLowerCase().trim();
    if (!q) return { text: "Hello! Ask me anything about PGs, hostels, house rules, or budgeting across India." };

    // Check if query is looking for specific amenities
    if (q.includes('ac') && (q.includes('study') || q.includes('library'))) {
      return {
        text: "Here are top-rated PGs featuring both **Air Conditioning** and a dedicated **Silent Study Room**:\n\n" +
              "• **Comfort Stay Executive PG** (Alkapuri, Vadodara) — ₹9,500/mo, 100 Mbps fiber & 24x7 study lounge.\n" +
              "• **Sunrise Luxury Girls PG** (Fatehgunj, Vadodara) — ₹8,000/mo, 0.6 km from MSU with power backup.\n" +
              "• **Allen Aspirants Hostel** (Kota, Rajasthan) — ₹9,500/mo, 24-hr air-conditioned library.\n\n" +
              "Would you like me to filter for AC & Study Room right now?",
        action: { label: "Apply AC + Study Room Filter", actionType: "apply_filter", filters: { facilities: ['ac', 'study_room'] } }
      };
    }

    if (q.includes('girls') && (q.includes('msu') || q.includes('fatehgunj'))) {
      return {
        text: "The top verified Girls PGs within 1 km walking distance of MSU Vadodara are:\n\n" +
              "1. **Sunrise Luxury Girls PG** (0.6 km from MSU) — ₹8,000/mo, 4 meals, gate timing 10 PM, 4.7★ (42 reviews).\n" +
              "2. **Heritage Residency for Girls** (Karelibaug) — ₹7,200/mo, Jain food available, 4.6★.\n\n" +
              "Both have female wardens, biometric entry, and CCTV surveillance.",
        action: { label: "View Sunrise Luxury PG", actionType: "view_listing", listingId: "pg-vbr-01" }
      };
    }

    if (q.includes('deposit') || q.includes('security') || q.includes('refund')) {
      return {
        text: "### Security Deposit & Refund Policy on StayMate AI:\n" +
              "• **Amount**: In Vadodara, most PGs ask for 1 month's rent as a refundable security deposit. Metros like Mumbai & Bengaluru may ask for 1-2 months.\n" +
              "• **Notice Period**: Standard notice period is 30 days before vacating.\n" +
              "• **Refund Timeline**: The owner refunds the deposit on your move-out day after deducting pending electricity bills (if any).\n" +
              "• **No Brokerage**: StayMate AI charges 0% brokerage to tenants!",
        action: null
      };
    }

    if (q.includes('rule') || q.includes('timing') || q.includes('curfew')) {
      return {
        text: "### Typical PG House Rules:\n" +
              "• **Gate Timings**: Standard student PGs close gates between 10:00 PM and 10:30 PM (extension passes available for late college projects/exams).\n" +
              "• **Executive Co-living Stays**: (e.g. *Comfort Stay Alkapuri*, *Bandra Sea Breeze*) provide 24x7 smart biometric access with no curfew.\n" +
              "• **Visitors**: Most student PGs allow parents and friends in designated common lounges until 7:00 PM - 8:00 PM.\n" +
              "• **Substances**: Smoking and alcohol are strictly prohibited in 95% of student properties.",
        action: null
      };
    }

    if (q.includes('food') || q.includes('mess') || q.includes('menu')) {
      return {
        text: "Over 85% of StayMate AI listings include full mess facilities:\n\n" +
              "• **Meals**: 3 to 4 meals daily (Breakfast, Lunch, Evening Tea & Snacks, Dinner).\n" +
              "• **Diet**: You can filter specifically for 100% Pure Veg, Jain, or Veg+Non-Veg.\n" +
              "• **Sunday Special**: Gujarati sweet feasts, Dal Baati, Pav Bhaji or Biryani.\n\n" +
              "You can view the full Monday-to-Sunday interactive food menu on any listing's details page!",
        action: { label: "Show Food Included PGs", actionType: "apply_filter", filters: { facilities: ['food'] } }
      };
    }

    if (q.includes('roommate') || q.includes('flatmate')) {
      return {
        text: "Looking for someone to share rent with? Check out our **Find a Roommate** section!\n" +
              "You can browse student & professional profiles, filter by habits (Vegetarian, Non-Smoker, Night Owl), or post your own vacancy.",
        action: { label: "Go to Roommates Board", actionType: "navigate", view: "roommates" }
      };
    }

    if (q.includes('hostel') || q.includes('samras') || q.includes('govt')) {
      return {
        text: "We maintain a verified directory of **Government & University Hostels** across India, including:\n" +
              "• **Samras Chhatralaya Vadodara** (Free subsidized accommodation for eligible students)\n" +
              "• **MSU Halls of Residence** (Affordable campus dorms from ₹4,500/term)\n" +
              "• **Working Women's Hostels** across major cities.",
        action: { label: "Browse State Hostels", actionType: "navigate", view: "hostels" }
      };
    }

    // Default fallback with helpful recommendations
    return {
      text: "I can assist you with:\n" +
            "1. Finding verified PGs near specific colleges (MSU, Parul, DU, MNIT, FC Pune)\n" +
            "2. Comparing rent, amenities, and security deposits side-by-side\n" +
            "3. Checking weekly mess menus and house rules\n" +
            "4. Finding compatible flatmates\n\n" +
            "Try asking: *'Suggest a boys PG near Vadodara station under 7000'* or *'Which PGs have pure veg food?'*",
      action: { label: "Explore Vadodara PGs", actionType: "navigate", view: "search" }
    };
  }
};

window.StayMateAI = StayMateAI;
