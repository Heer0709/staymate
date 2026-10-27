/**
 * StayMate AI - Main Application Controller
 * Handles SPA routing, screen renderers, interactive filters, modals, Leaflet map,
 * booking validation, and AI chatbot integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Application
  initApp();
});

function initApp() {
  // Apply saved theme
  if (window.staymateState.darkMode) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }

  // Bind global event listeners
  setupNavigationEvents();
  setupAuthEvents();
  setupAiChatEvents();
  setupModalEvents();
  setupCompareTrayEvents();

  // Handle splash screen auto-dismiss (2 seconds)
  setupSplashScreen();

  // Initial screen render
  renderCurrentView();

  // Subscribe to state updates
  window.staymateState.subscribe((event, data) => {
    handleStateChange(event, data);
  });
}

/**
 * 1. SPLASH SCREEN CONTROLLER
 */
function setupSplashScreen() {
  const splash = document.getElementById('splashScreen');
  const skipBtn = document.getElementById('skipSplashBtn');

  const hideSplash = () => {
    if (!splash || splash.classList.contains('fade-out')) return;
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 500);
  };

  // Auto redirect after 2 seconds
  const timer = setTimeout(hideSplash, 2000);

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      clearTimeout(timer);
      hideSplash();
    });
  }
}

/**
 * 2. TOAST NOTIFICATION SYSTEM
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = '<i class="fa-solid fa-circle-info text-indigo-600"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check text-emerald-500"></i>';
  if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-circle-xmark text-rose-500"></i>';

  toast.innerHTML = `
    <div class="text-lg">${icon}</div>
    <div class="flex-1">${message}</div>
    <button class="text-gray-400 hover:text-gray-600 text-xs ml-2">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * 3. GLOBAL NAVIGATION & HEADER EVENTS
 */
function setupNavigationEvents() {
  // Brand logo click
  document.getElementById('brandLogoBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.staymateState.setView('home');
  });

  // Delegated data-nav clicks
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      e.preventDefault();
      const targetView = navBtn.getAttribute('data-nav');
      window.staymateState.setView(targetView);
    }

    // Quick area buttons
    const quickAreaBtn = e.target.closest('[data-quick-area]');
    if (quickAreaBtn) {
      e.preventDefault();
      const area = quickAreaBtn.getAttribute('data-quick-area');
      window.staymateState.updateFilters({ city: 'Vadodara', area });
      window.staymateState.setView('search');
    }

    // Quick category buttons
    const catBtn = e.target.closest('[data-category]');
    if (catBtn) {
      e.preventDefault();
      const cat = catBtn.getAttribute('data-category');
      if (cat === 'PG') window.staymateState.updateFilters({ roomTypes: [] });
      if (cat === 'Hostels') {
        window.staymateState.setView('hostels');
        return;
      }
      if (cat === 'Rooms') window.staymateState.updateFilters({ roomTypes: ['Single', 'Private'] });
      if (cat === 'Shared') window.staymateState.updateFilters({ sharingTypes: ['Double', 'Triple', '4+'] });
      window.staymateState.setView('search');
    }
  });

  // Quick Location pill click
  document.getElementById('quickLocationPill')?.addEventListener('click', () => {
    window.staymateState.setView('search');
    showToast('Select your target State, City, and Locality in the filters!', 'info');
  });

  // Dark/Light Theme toggle
  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    window.staymateState.toggleTheme();
  });

  // Notification bell toggle
  const notifBell = document.getElementById('notifBellBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifBell && notifDropdown) {
    notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      renderNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBell.contains(e.target)) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    window.staymateState.notifications.forEach(n => n.unread = false);
    renderNotifications();
    showToast('All notifications marked as read', 'success');
  });

  // Header user profile / auth button
  document.getElementById('headerAuthBtn')?.addEventListener('click', () => {
    if (window.staymateState.currentUser) {
      window.staymateState.setView('profile');
    } else {
      openAuthModal('login');
    }
  });
}

function renderNotifications() {
  const container = document.getElementById('notifListContainer');
  if (!container) return;

  const notifs = window.staymateState.notifications;
  if (!notifs || notifs.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 py-4 text-center">No new notifications</p>`;
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div class="py-2.5 px-1 flex items-start gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer ${n.unread ? 'font-bold' : 'opacity-80'}">
      <div class="w-2 h-2 rounded-full mt-1.5 ${n.unread ? 'bg-indigo-600' : 'bg-transparent'}"></div>
      <div class="flex-1 text-xs">
        <div class="text-gray-900 dark:text-white">${n.title}</div>
        <div class="text-[11px] text-gray-500 font-normal mt-0.5">${n.message}</div>
        <div class="text-[10px] text-gray-400 font-normal mt-1">${n.time}</div>
      </div>
    </div>
  `).join('');
}

/**
 * 4. AUTH MODAL & FORM LOGIC
 */
function setupAuthEvents() {
  const modal = document.getElementById('authModal');
  const closeBtn = document.getElementById('closeAuthModalBtn');
  const tabLogin = document.getElementById('authTabLogin');
  const tabSignup = document.getElementById('authTabSignup');
  const title = document.getElementById('authModalTitle');
  const roleBox = document.getElementById('signupRoleContainer');
  const nameBox = document.getElementById('signupNameContainer');
  const form = document.getElementById('authForm');
  const eyeBtn = document.getElementById('togglePasswordEyeBtn');
  const passInput = document.getElementById('authPasswordInput');

  window.openAuthModal = (mode = 'login') => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (mode === 'signup') {
      tabSignup.click();
    } else {
      tabLogin.click();
    }
  };

  closeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  tabLogin?.addEventListener('click', () => {
    tabLogin.className = 'flex-1 py-2 rounded-xl bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white font-bold transition-all';
    tabSignup.className = 'flex-1 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-bold transition-all';
    title.innerText = 'Welcome Back to StayMate AI';
    roleBox.classList.add('hidden');
    nameBox.classList.add('hidden');
  });

  tabSignup?.addEventListener('click', () => {
    tabSignup.className = 'flex-1 py-2 rounded-xl bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white font-bold transition-all';
    tabLogin.className = 'flex-1 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-bold transition-all';
    title.innerText = 'Join StayMate AI Today';
    roleBox.classList.remove('hidden');
    nameBox.classList.remove('hidden');
  });

  // Toggle Password Show/Hide Eye
  eyeBtn?.addEventListener('click', () => {
    const isPass = passInput.getAttribute('type') === 'password';
    passInput.setAttribute('type', isPass ? 'text' : 'password');
    eyeBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  // Forgot Password
  document.getElementById('forgotPassBtn')?.addEventListener('click', () => {
    const id = document.getElementById('authIdentityInput').value;
    showToast(`Password reset link sent to ${id || 'your registered contact'}!`, 'success');
  });

  // OAuth buttons mock
  document.getElementById('googleOAuthBtn')?.addEventListener('click', () => {
    showToast('Signed in with Google successfully!', 'success');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });
  document.getElementById('facebookOAuthBtn')?.addEventListener('click', () => {
    showToast('Signed in with Facebook successfully!', 'success');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  // Form Submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const isSignup = !roleBox.classList.contains('hidden');
    const nameVal = document.getElementById('authNameInput')?.value || 'Aryan Sharma';
    const idVal = document.getElementById('authIdentityInput')?.value || 'user@example.com';
    const roleVal = document.querySelector('input[name="authRole"]:checked')?.value || 'tenant';

    window.staymateState.currentUser = {
      id: 'usr-' + Date.now(),
      name: isSignup ? nameVal : 'Aryan Sharma',
      role: roleVal,
      email: idVal.includes('@') ? idVal : 'aryan@example.com',
      phone: !idVal.includes('@') ? idVal : '+91 98250 88910',
      college: 'MSU Vadodara',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      preferences: { budget: 8500, sharing: 'Double', diet: 'Vegetarian', city: 'Vadodara' }
    };
    localStorage.setItem('staymate_user', JSON.stringify(window.staymateState.currentUser));

    updateHeaderUser();
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    showToast(`Welcome ${window.staymateState.currentUser.name}! You are logged in as ${roleVal}.`, 'success');
  });
}

function updateHeaderUser() {
  const user = window.staymateState.currentUser;
  const nameEl = document.getElementById('headerUserName');
  const avatarEl = document.getElementById('headerUserAvatar');
  if (user && nameEl && avatarEl) {
    nameEl.innerText = `Hi, ${user.name.split(' ')[0]}`;
    avatarEl.src = user.avatar;
  }
}

/**
 * 5. AI CHATBOT INTERFACE
 */
function setupAiChatEvents() {
  const bubble = document.getElementById('aiChatBubble');
  const windowEl = document.getElementById('aiChatWindow');
  const closeBtn = document.getElementById('closeAiChatBtn');
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiChatInput');
  const feed = document.getElementById('aiChatFeed');

  bubble?.addEventListener('click', () => {
    windowEl.classList.toggle('hidden');
    if (!windowEl.classList.contains('hidden')) {
      input.focus();
    }
  });

  closeBtn?.addEventListener('click', () => {
    windowEl.classList.add('hidden');
  });

  // Quick Prompt chips
  document.querySelectorAll('.ai-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.innerText.trim();
      input.value = prompt;
      form.dispatchEvent(new Event('submit'));
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    // Append user message
    appendChatMessage('user', query);
    input.value = '';

    // Show bot thinking skeleton
    const thinkingId = 'thinking-' + Date.now();
    const thinkingEl = document.createElement('div');
    thinkingEl.id = thinkingId;
    thinkingEl.className = 'flex items-start gap-2.5';
    thinkingEl.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
        <i class="fa-solid fa-wand-magic-sparkles text-[11px] animate-spin"></i>
      </div>
      <div class="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl text-gray-500 text-[11px]">
        StayMate AI is analyzing stays in Vadodara...
      </div>
    `;
    feed.appendChild(thinkingEl);
    feed.scrollTop = feed.scrollHeight;

    // Get response from AI Brain
    const response = await window.StayMateAI.askChatbot(query);
    document.getElementById(thinkingId)?.remove();

    appendChatMessage('bot', response.text, response.action);
  });

  function appendChatMessage(sender, text, action = null) {
    const msg = document.createElement('div');
    msg.className = sender === 'user' ? 'flex justify-end' : 'flex items-start gap-2.5';

    if (sender === 'user') {
      msg.innerHTML = `
        <div class="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] font-medium">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      let actionBtnHtml = '';
      if (action) {
        actionBtnHtml = `
          <button class="ai-chat-action-btn mt-2.5 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition-all"
            data-action-type="${action.actionType}"
            data-target="${action.listingId || action.view || ''}">
            <i class="fa-solid fa-bolt text-[10px]"></i>
            <span>${action.label}</span>
          </button>
        `;
      }

      // Convert simple markdown bold/bullets
      const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*?)\n/g, '<h4 class="font-bold text-xs text-indigo-600 mt-1 mb-0.5">$1</h4>')
        .replace(/• (.*?)\n/g, '<div class="flex items-start gap-1 my-0.5"><span class="text-indigo-500">•</span><span>$1</span></div>')
        .replace(/\n\n/g, '<div class="h-2"></div>')
        .replace(/\n/g, '<br>');

      msg.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
          <i class="fa-solid fa-wand-magic-sparkles text-[11px]"></i>
        </div>
        <div class="bg-indigo-50 dark:bg-indigo-950/40 text-gray-800 dark:text-gray-200 p-3 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">
          <div>${formatted}</div>
          ${actionBtnHtml}
        </div>
      `;
    }

    feed.appendChild(msg);
    feed.scrollTop = feed.scrollHeight;

    // Attach handler for embedded action button
    msg.querySelectorAll('.ai-chat-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-action-type');
        const target = btn.getAttribute('data-target');
        if (type === 'view_listing') {
          window.staymateState.setView('details', { listingId: target });
        } else if (type === 'apply_filter') {
          if (target && target.includes('food')) {
            window.staymateState.updateFilters({ facilities: ['food'] });
          } else {
            window.staymateState.updateFilters({ facilities: ['ac', 'study_room'] });
          }
          window.staymateState.setView('search');
        } else if (type === 'navigate') {
          window.staymateState.setView(target);
        }
        windowEl.classList.add('hidden');
      });
    });
  }
}

/**
 * 6. MODALS LOGIC (VISIT, BOOKING, SHARE, REPORT, LIGHTBOX)
 */
function setupModalEvents() {
  // Visit Modal
  const visitModal = document.getElementById('scheduleVisitModal');
  const closeVisitBtn = document.getElementById('closeVisitModalBtn');
  const visitForm = document.getElementById('scheduleVisitForm');

  window.openScheduleVisitModal = (listingId) => {
    const listing = window.staymateState.getAllListings().find(l => l.id === listingId);
    if (!listing) return;
    document.getElementById('visitPgName').innerText = `${listing.name} (${listing.area}, ${listing.city})`;
    visitModal.classList.remove('hidden');
    visitModal.classList.add('flex');
  };

  closeVisitBtn?.addEventListener('click', () => {
    visitModal.classList.add('hidden');
    visitModal.classList.remove('flex');
  });

  visitForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('visitDateInput').value;
    const time = document.getElementById('visitTimeSlot').value;
    visitModal.classList.add('hidden');
    visitModal.classList.remove('flex');
    showToast(`Visit scheduled for ${date} (${time})! Owner notified.`, 'success');
  });

  // Booking Modal
  const bookingModal = document.getElementById('bookingModal');
  const closeBookingBtn = document.getElementById('closeBookingModalBtn');
  const bookingForm = document.getElementById('confirmBookingForm');
  const checkInInput = document.getElementById('bookingCheckIn');
  const checkOutInput = document.getElementById('bookingCheckOut');
  const dateError = document.getElementById('bookingDateError');

  window.openBookingModal = (listingId) => {
    const listing = window.staymateState.getAllListings().find(l => l.id === listingId);
    if (!listing) return;

    window.staymateState.selectedListingId = listingId;

    // Inject PG summary
    const summaryContainer = document.getElementById('bookingPgSummary');
    summaryContainer.innerHTML = `
      <img src="${listing.photos[0]}" alt="${listing.name}" class="w-16 h-16 rounded-xl object-cover">
      <div class="flex-1 text-xs">
        <h4 class="font-extrabold text-gray-900 dark:text-white">${listing.name}</h4>
        <p class="text-gray-500">${listing.area}, ${listing.city} • <span class="text-indigo-600 font-bold">${listing.distanceText}</span></p>
        <div class="flex items-center gap-1 text-amber-500 font-bold mt-1">
          <i class="fa-solid fa-star text-[10px]"></i>
          <span>${listing.rating}</span>
          <span class="text-gray-400 font-normal">(${listing.reviewCount} reviews)</span>
        </div>
      </div>
    `;

    // Inject sharing options
    const sharingRadios = document.getElementById('bookingSharingRadios');
    sharingRadios.innerHTML = (listing.roomsSharing || [
      { type: 'Double', rent: listing.rent }
    ]).map((r, i) => `
      <label class="border-2 ${i === 0 ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40' : 'border-gray-200 dark:border-gray-700'} p-2 rounded-xl flex flex-col items-center text-center cursor-pointer">
        <input type="radio" name="bookingSharing" value="${r.rent}" data-type="${r.type}" ${i === 0 ? 'checked' : ''} class="text-indigo-600 mb-1">
        <span class="font-bold text-gray-800 dark:text-gray-200">${r.type}</span>
        <span class="text-indigo-600 font-extrabold text-[11px]">₹${r.rent.toLocaleString('en-IN')}/m</span>
      </label>
    `).join('');

    // Pre-populate default dates (Check-in tomorrow, Check-out 6 months later)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sixMonths = new Date(tomorrow);
    sixMonths.setMonth(sixMonths.getMonth() + 6);

    checkInInput.value = tomorrow.toISOString().split('T')[0];
    checkOutInput.value = sixMonths.toISOString().split('T')[0];
    dateError.classList.add('hidden');

    // Update pricing
    updateBookingPrices(listing.rent, listing.deposit || listing.rent);

    // Update owner card
    if (listing.owner) {
      document.getElementById('bookingOwnerName').innerText = listing.owner.name;
      document.getElementById('bookingCallOwnerBtn').href = `tel:${listing.owner.phone}`;
      document.getElementById('bookingWaOwnerBtn').href = `https://wa.me/${listing.owner.whatsapp || '919825014820'}`;
    }

    bookingModal.classList.remove('hidden');
    bookingModal.classList.add('flex');
  };

  function updateBookingPrices(rent, deposit) {
    document.getElementById('bookingRentPrice').innerText = `₹${rent.toLocaleString('en-IN')}`;
    document.getElementById('bookingDepositPrice').innerText = `₹${deposit.toLocaleString('en-IN')}`;
    document.getElementById('bookingTotalPrice').innerText = `₹${(rent + deposit).toLocaleString('en-IN')}`;
  }

  // Handle sharing radio changes in booking
  document.addEventListener('change', (e) => {
    if (e.target.name === 'bookingSharing') {
      const selectedRent = parseInt(e.target.value) || 8000;
      updateBookingPrices(selectedRent, selectedRent);
    }
  });

  closeBookingBtn?.addEventListener('click', () => {
    bookingModal.classList.add('hidden');
    bookingModal.classList.remove('flex');
  });

  // Booking Form Submission & Validation (check-out > check-in)
  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const inDate = new Date(checkInInput.value);
    const outDate = new Date(checkOutInput.value);

    if (outDate <= inDate) {
      dateError.classList.remove('hidden');
      return;
    }
    dateError.classList.add('hidden');

    const listing = window.staymateState.getAllListings().find(l => l.id === window.staymateState.selectedListingId);
    const selectedSharingRadio = document.querySelector('input[name="bookingSharing"]:checked');
    const sharingType = selectedSharingRadio ? selectedSharingRadio.getAttribute('data-type') : 'Double Sharing';
    const rent = selectedSharingRadio ? parseInt(selectedSharingRadio.value) : (listing.rent || 8000);

    const newBooking = window.staymateState.addBooking({
      listingId: listing.id,
      listingName: listing.name,
      area: `${listing.area}, ${listing.city}`,
      photo: listing.photos[0],
      checkIn: checkInInput.value,
      checkOut: checkOutInput.value,
      sharingType,
      rentPerMonth: rent,
      depositPaid: rent,
      totalInitial: rent * 2,
      ownerName: listing.owner ? listing.owner.name : 'PG Owner',
      ownerPhone: listing.owner ? listing.owner.phone : '+91 98250 14820'
    });

    // Close booking modal and open confirmation modal
    bookingModal.classList.add('hidden');
    bookingModal.classList.remove('flex');

    openConfirmedModal(newBooking);
  });

  // Confirmed Modal logic
  const confirmedModal = document.getElementById('bookingConfirmedModal');
  function openConfirmedModal(booking) {
    document.getElementById('confirmedBookingId').innerText = `#${booking.id}`;
    document.getElementById('confirmedPgName').innerText = booking.listingName;
    document.getElementById('confirmedDates').innerText = `${booking.checkIn} to ${booking.checkOut}`;
    document.getElementById('confirmedTotalPayable').innerText = `₹${booking.totalInitial.toLocaleString('en-IN')}`;

    confirmedModal.classList.remove('hidden');
    confirmedModal.classList.add('flex');
  }

  // Star Rating feedback prompt in Confirmed Modal
  document.querySelectorAll('#bookingRatingStars i').forEach(star => {
    star.addEventListener('click', (e) => {
      const val = parseInt(e.target.getAttribute('data-val'));
      document.querySelectorAll('#bookingRatingStars i').forEach((s, idx) => {
        if (idx < val) {
          s.className = 'fa-solid fa-star text-amber-400';
        } else {
          s.className = 'fa-regular fa-star text-gray-300';
        }
      });
      showToast('Thank you for rating your booking experience!', 'success');
    });
  });

  document.getElementById('viewMyStaysBtn')?.addEventListener('click', () => {
    confirmedModal.classList.add('hidden');
    confirmedModal.classList.remove('flex');
    window.staymateState.setView('my-stays');
  });

  document.getElementById('backToHomeBtn')?.addEventListener('click', () => {
    confirmedModal.classList.add('hidden');
    confirmedModal.classList.remove('flex');
    window.staymateState.setView('home');
  });

  // Share Modal
  const shareModal = document.getElementById('shareListingModal');
  const closeShareBtn = document.getElementById('closeShareModalBtn');
  window.openShareModal = (listing) => {
    const url = window.location.href;
    const text = `Check out ${listing.name} in ${listing.area}, ${listing.city} on StayMate AI! Rent: ₹${listing.rent}/mo with zero brokerage.`;
    document.getElementById('shareWhatsAppLink').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
    document.getElementById('shareTwitterLink').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    document.getElementById('copyShareLinkBtn').onclick = () => {
      navigator.clipboard?.writeText(url).then(() => {
        showToast('Listing link copied to clipboard!', 'success');
      });
    };

    shareModal.classList.remove('hidden');
    shareModal.classList.add('flex');
  };
  closeShareBtn?.addEventListener('click', () => {
    shareModal.classList.add('hidden');
    shareModal.classList.remove('flex');
  });

  // Report Modal
  const reportModal = document.getElementById('reportListingModal');
  const closeReportBtn = document.getElementById('closeReportModalBtn');
  const reportForm = document.getElementById('reportForm');
  window.openReportModal = (listing) => {
    reportModal.classList.remove('hidden');
    reportModal.classList.add('flex');
  };
  closeReportBtn?.addEventListener('click', () => {
    reportModal.classList.add('hidden');
    reportModal.classList.remove('flex');
  });
  reportForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    reportModal.classList.add('hidden');
    reportModal.classList.remove('flex');
    showToast('Report submitted. Our moderation team will investigate within 12 hours.', 'info');
  });

  // Post Roommate Modal
  const rmModal = document.getElementById('postRoommateModal');
  const closeRmBtn = document.getElementById('closeRoommateModalBtn');
  const rmForm = document.getElementById('postRoommateForm');

  window.openPostRoommateModal = () => {
    rmModal.classList.remove('hidden');
    rmModal.classList.add('flex');
  };
  closeRmBtn?.addEventListener('click', () => {
    rmModal.classList.add('hidden');
    rmModal.classList.remove('flex');
  });
  rmForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = window.staymateState.currentUser;
    const newPost = window.staymateState.addRoommatePost({
      name: user ? user.name : 'Student Aspirant',
      age: 22,
      gender: 'Co-ed',
      occupation: document.getElementById('rmOccupation').value || 'Student',
      type: document.getElementById('rmPostType').value,
      location: document.getElementById('rmLocation').value,
      budget: document.getElementById('rmBudget').value,
      moveInDate: document.getElementById('rmMoveIn').value || 'Immediate',
      habits: document.getElementById('rmHabits').value.split(',').map(s => s.trim()).filter(Boolean),
      about: document.getElementById('rmAbout').value || 'Looking for friendly flatmates.',
      contact: user ? user.phone : '+91 98250 88910'
    });
    rmModal.classList.add('hidden');
    rmModal.classList.remove('flex');
    showToast('Roommate post published successfully!', 'success');
    if (window.staymateState.currentView === 'roommates') {
      renderCurrentView();
    }
  });

  // Photo Lightbox logic
  const lightbox = document.getElementById('photoLightboxModal');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');
  const prevLightboxBtn = document.getElementById('prevLightboxImg');
  const nextLightboxBtn = document.getElementById('nextLightboxImg');
  const lightboxImg = document.getElementById('lightboxCurrentImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  let currentPhotosList = [];
  let currentPhotoIdx = 0;

  window.openLightbox = (photos, startIdx = 0, caption = 'Property Photo') => {
    currentPhotosList = photos;
    currentPhotoIdx = startIdx;
    updateLightbox();
    lightbox.classList.add('active');
  };

  function updateLightbox() {
    if (!currentPhotosList || currentPhotosList.length === 0) return;
    lightboxImg.src = currentPhotosList[currentPhotoIdx];
    lightboxCaption.innerText = `Photo ${currentPhotoIdx + 1} of ${currentPhotosList.length}`;
  }

  closeLightboxBtn?.addEventListener('click', () => lightbox.classList.remove('active'));
  prevLightboxBtn?.addEventListener('click', () => {
    currentPhotoIdx = (currentPhotoIdx - 1 + currentPhotosList.length) % currentPhotosList.length;
    updateLightbox();
  });
  nextLightboxBtn?.addEventListener('click', () => {
    currentPhotoIdx = (currentPhotoIdx + 1) % currentPhotosList.length;
    updateLightbox();
  });
}

/**
 * 7. COMPARE TRAY CONTROLLER
 */
function setupCompareTrayEvents() {
  const tray = document.getElementById('compareFloatingTray');
  const clearBtn = document.getElementById('clearCompareBtn');

  clearBtn?.addEventListener('click', () => {
    window.staymateState.compareListings = [];
    localStorage.setItem('staymate_compare', JSON.stringify([]));
    window.staymateState.notify('compare_change', { list: [] });
    showToast('Comparison cleared', 'info');
  });

  updateCompareTrayUI();
}

function updateCompareTrayUI() {
  const tray = document.getElementById('compareFloatingTray');
  const countEl = document.getElementById('compareTrayCount');
  const badgeEl = document.getElementById('compareNavBadge');
  const avatarsEl = document.getElementById('compareTrayAvatars');
  if (!tray || !countEl) return;

  const list = window.staymateState.compareListings;
  const count = list.length;
  countEl.innerText = count;
  if (badgeEl) badgeEl.innerText = count;

  if (count > 0) {
    tray.classList.add('show');
    const all = window.staymateState.getAllListings();
    avatarsEl.innerHTML = list.map(id => {
      const item = all.find(l => l.id === id);
      if (!item) return '';
      return `<img src="${item.photos[0]}" alt="${item.name}" class="w-7 h-7 rounded-full border-2 border-white object-cover" title="${item.name}">`;
    }).join('');
  } else {
    tray.classList.remove('show');
  }
}

/**
 * 8. STATE CHANGE HANDLER
 */
function handleStateChange(event, payload) {
  if (event === 'view_change') {
    renderCurrentView();
    updateBottomNav();
  } else if (event === 'saved_change') {
    updateSavedBadges();
  } else if (event === 'compare_change') {
    updateCompareTrayUI();
  } else if (event === 'filters_change') {
    if (window.staymateState.currentView === 'search') {
      renderSearchScreen();
    }
  }
}

function updateSavedBadges() {
  const count = window.staymateState.savedListings.length;
  const badge = document.getElementById('savedCountBadge');
  const mobileBadge = document.getElementById('mobileSavedCount');
  if (badge) badge.innerText = count;
  if (mobileBadge) mobileBadge.innerText = count;
}

function updateBottomNav() {
  const current = window.staymateState.currentView;
  document.querySelectorAll('.mobile-bottom-nav .nav-item-btn').forEach(btn => {
    const target = btn.getAttribute('data-nav');
    if (target === current) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * 9. VIEW ROUTER & RENDERERS
 */
function renderCurrentView() {
  const container = document.getElementById('appContainer');
  if (!container) return;

  const view = window.staymateState.currentView;

  switch (view) {
    case 'home':
      renderHomeScreen();
      break;
    case 'search':
      renderSearchScreen();
      break;
    case 'details':
      renderDetailsScreen(window.staymateState.selectedListingId);
      break;
    case 'compare':
      renderCompareScreen();
      break;
    case 'roommates':
      renderRoommatesScreen();
      break;
    case 'states':
      renderStatesScreen();
      break;
    case 'hostels':
      renderHostelsScreen();
      break;
    case 'post-pg':
      renderPostPgScreen();
      break;
    case 'owner-dashboard':
      renderOwnerDashboardScreen();
      break;
    case 'admin-dashboard':
      renderAdminDashboardScreen();
      break;
    case 'my-stays':
      renderMyStaysScreen();
      break;
    case 'saved':
      renderSavedScreen();
      break;
    case 'profile':
      renderProfileScreen();
      break;
    case 'map':
      renderMapScreen();
      break;
    case 'about':
      renderAboutScreen();
      break;
    case 'contact':
      renderContactScreen();
      break;
    case 'faq':
      renderFaqScreen();
      break;
    case 'privacy':
    case 'terms':
      renderTermsPrivacyScreen(view);
      break;
    default:
      renderHomeScreen();
  }
}

/**
 * SCREEN 3: HOME DASHBOARD
 */
function renderHomeScreen() {
  const container = document.getElementById('appContainer');
  const user = window.staymateState.currentUser;
  const userName = user ? user.name.split(' ')[0] : 'Aryan';

  // AI Recommendations
  const aiMatches = window.StayMateAI.getRecommendations(user, 3);

  // Featured Vadodara stays
  const vadodaraStays = window.staymateState.getAllListings().filter(l => l.city.toLowerCase() === 'vadodara').slice(0, 6);

  container.innerHTML = `
    <!-- Top Greeting Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full">
            📍 Welcome to Vadodara & Beyond
          </span>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
            Hi, ${userName}! <span class="font-handwritten text-indigo-600 dark:text-indigo-400 font-bold text-3xl sm:text-4xl">Ready to find your next home?</span>
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Explore verified PGs, student dorms, and shared accommodations near MSU, Alkapuri, and IT hubs with zero brokerage.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button data-nav="search" class="btn-primary text-xs sm:text-sm px-4 py-2.5 shadow-md">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>Browse All Stays</span>
          </button>
          <button data-nav="post-pg" class="btn-outline text-xs sm:text-sm px-4 py-2.5">
            <i class="fa-solid fa-building"></i>
            <span>List Property</span>
          </button>
        </div>
      </div>
    </section>

    <!-- AI Natural Language Search Box -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div class="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-5 sm:p-7 shadow-xl text-white relative overflow-hidden">
        <!-- Background subtle glow -->
        <div class="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="max-w-3xl">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
            <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
            <span>StayMate AI Natural Language Finder</span>
          </div>
          <h2 class="text-lg sm:text-2xl font-extrabold mb-3 leading-snug">
            Describe what you need in plain English:
          </h2>

          <form id="homeAiSearchForm" class="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-1.5 shadow-2xl">
            <div class="flex-1 flex items-center pl-3 gap-2">
              <i class="fa-solid fa-sparkles text-indigo-500 text-sm"></i>
              <input type="text" id="homeAiSearchInput" placeholder="e.g. girls PG near MSU under 8000 with food"
                class="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none py-2 bg-transparent">
            </div>
            <div class="flex items-center gap-1.5 pr-1">
              <button type="button" id="voiceSearchMockBtn" title="Voice Search" class="w-9 h-9 rounded-xl text-gray-400 hover:text-indigo-600 flex items-center justify-center transition-colors">
                <i class="fa-solid fa-microphone"></i>
              </button>
              <button type="submit" class="btn-primary text-xs sm:text-sm px-5 py-2.5 rounded-xl font-bold shadow-md">
                <span>AI Search</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </div>
          </form>

          <!-- Prompt Suggestions -->
          <div class="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-indigo-100">
            <span class="font-bold opacity-80">Try prompts:</span>
            <button class="home-quick-prompt bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full border border-white/20 transition-colors">
              girls PG near MSU under 8000 with food
            </button>
            <button class="home-quick-prompt bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full border border-white/20 transition-colors">
              boys single room in alkapuri with AC
            </button>
            <button class="home-quick-prompt bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full border border-white/20 transition-colors">
              karelibaug pure veg jain food
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Banner Carousel: "Better Stays, Brighter Futures" -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="relative bg-white dark:bg-[#201E27] rounded-3xl p-6 sm:p-8 border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="max-w-xl">
          <span class="badge-verified mb-2">
            <i class="fa-solid fa-shield-check"></i> 100% Zero Brokerage
          </span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            "Better Stays, Brighter Futures"
          </h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            Finding a student PG or room shouldn't be stressful. Every listing on StayMate AI comes with verified wardens, realistic photos, transparent security deposit policies, and direct WhatsApp contact.
          </p>
          <div class="mt-5 flex items-center gap-3">
            <button data-nav="search" class="btn-primary text-xs px-4 py-2">
              <span>Find Stays in Vadodara</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
            <button data-nav="roommates" class="btn-outline text-xs px-4 py-2">
              <span>Find Flatmates</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=500&q=80" alt="Student Living" class="w-36 h-44 sm:w-44 sm:h-52 rounded-2xl object-cover shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
          <img src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80" alt="Modern Room" class="w-36 h-44 sm:w-44 sm:h-52 rounded-2xl object-cover shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
        </div>
      </div>
    </section>

    <!-- Categories & Quick Services Grid -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        
        <!-- Category 1: PGs -->
        <button data-category="PG" class="stay-card p-4 text-left flex items-center gap-3.5 group cursor-pointer">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <i class="fa-solid fa-bed"></i>
          </div>
          <div>
            <div class="font-extrabold text-sm text-gray-900 dark:text-white">PGs</div>
            <div class="text-[11px] text-gray-400">Paying Guest stays</div>
          </div>
        </button>

        <!-- Category 2: Hostels -->
        <button data-category="Hostels" class="stay-card p-4 text-left flex items-center gap-3.5 group cursor-pointer">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <i class="fa-solid fa-hotel"></i>
          </div>
          <div>
            <div class="font-extrabold text-sm text-gray-900 dark:text-white">Hostels</div>
            <div class="text-[11px] text-gray-400">Govt & Student halls</div>
          </div>
        </button>

        <!-- Category 3: Rooms -->
        <button data-category="Rooms" class="stay-card p-4 text-left flex items-center gap-3.5 group cursor-pointer">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <i class="fa-solid fa-door-open"></i>
          </div>
          <div>
            <div class="font-extrabold text-sm text-gray-900 dark:text-white">Rooms</div>
            <div class="text-[11px] text-gray-400">Single & Private 1BHK</div>
          </div>
        </button>

        <!-- Category 4: Shared Stays -->
        <button data-category="Shared" class="stay-card p-4 text-left flex items-center gap-3.5 group cursor-pointer">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <i class="fa-solid fa-users"></i>
          </div>
          <div>
            <div class="font-extrabold text-sm text-gray-900 dark:text-white">Shared</div>
            <div class="text-[11px] text-gray-400">Budget flatmates</div>
          </div>
        </button>

      </div>

      <!-- Quick Services Banner -->
      <div class="bg-white dark:bg-[#201E27] rounded-2xl p-4 border border-[#EFE4D6] dark:border-[#332F2A] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
        <div data-nav="map" class="flex items-center gap-2.5 cursor-pointer hover:text-indigo-600">
          <i class="fa-solid fa-map-location-dot text-indigo-600 text-base"></i>
          <span>Nearby PGs (Map View)</span>
        </div>
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-badge-check text-emerald-500 text-base"></i>
          <span>100% Verified Listings</span>
        </div>
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-headset text-indigo-600 text-base"></i>
          <span>24x7 Student Support</span>
        </div>
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-shield-halved text-emerald-500 text-base"></i>
          <span>Zero Brokerage Promise</span>
        </div>
      </div>
    </section>

    <!-- AI RECOMMENDATIONS: "Best Match for You" -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Best Match for You</h2>
            <span class="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">AI Powered</span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">Matched based on your target budget (₹8.5k), Vadodara preferences & campus distance</p>
        </div>
        <button data-nav="search" class="text-xs font-bold text-indigo-600 hover:underline">View All &rarr;</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${aiMatches.map(item => renderListingCardHtml(item, true)).join('')}
      </div>
    </section>

    <!-- TRENDING IN VADODARA SECTION -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Trending in Vadodara</h2>
          <p class="text-xs text-gray-500 mt-0.5">Most scheduled visits near MSU & Alkapuri this week</p>
        </div>
        <button data-nav="search" class="text-xs font-bold text-indigo-600 hover:underline">See All 12+ Stays &rarr;</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${vadodaraStays.map(item => renderListingCardHtml(item)).join('')}
      </div>
    </section>

    <!-- POPULAR LOCALITIES IN VADODARA -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 class="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
        Browse Stays by Locality in Vadodara
      </h2>
      <p class="text-xs text-gray-500 mb-4">Choose your preferred area for quickest commute to college or workplace</p>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        ${[
          { name: 'Fatehgunj', desc: 'MSU Tech & Science', count: 5 },
          { name: 'Sayajigunj', desc: 'Railway & Bus Depot', count: 3 },
          { name: 'Alkapuri', desc: 'Executive High-street', count: 2 },
          { name: 'Karelibaug', desc: 'Medical & Peace', count: 2 },
          { name: 'Waghodia Road', desc: 'Near Parul Campus', count: 2 },
          { name: 'Gotri', desc: 'GMERS Hospital hub', count: 1 }
        ].map(loc => `
          <button data-quick-area="${loc.name}" class="stay-card p-3.5 text-left group hover:border-indigo-500 cursor-pointer">
            <i class="fa-solid fa-location-dot text-indigo-600 mb-2 group-hover:scale-110 transition-transform"></i>
            <div class="font-extrabold text-xs text-gray-900 dark:text-white">${loc.name}</div>
            <div class="text-[10px] text-gray-500 font-semibold">${loc.desc}</div>
            <div class="text-[10px] text-indigo-600 font-bold mt-1">${loc.count} stays</div>
          </button>
        `).join('')}
      </div>
    </section>
  `;

  // Bind Home Search Form
  document.getElementById('homeAiSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('homeAiSearchInput').value.trim();
    if (!query) return;

    // Use StayMate AI Natural Language Search
    const aiParsed = window.StayMateAI.parseSearchQuery(query);
    if (aiParsed && aiParsed.detected) {
      window.staymateState.updateFilters(aiParsed.filters);
      window.staymateState.filters.aiNaturalQuery = query;
      showToast(`AI Filter Applied: ${aiParsed.summaryTags.join(' • ')}`, 'success');
    } else {
      window.staymateState.updateFilters({ searchQuery: query });
    }
    window.staymateState.setView('search');
  });

  // Prompt buttons click
  document.querySelectorAll('.home-quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('homeAiSearchInput').value = btn.innerText.trim();
      document.getElementById('homeAiSearchForm').dispatchEvent(new Event('submit'));
    });
  });

  // Voice Search mock
  document.getElementById('voiceSearchMockBtn')?.addEventListener('click', () => {
    showToast('Voice Search active: Listening for e.g. "Girls PG near MSU under 8000"...', 'info');
    setTimeout(() => {
      document.getElementById('homeAiSearchInput').value = 'girls PG near MSU under 8000 with food';
      document.getElementById('homeAiSearchForm').dispatchEvent(new Event('submit'));
    }, 1500);
  });
}

/**
 * REUSABLE PG CARD HTML BUILDER
 */
function renderListingCardHtml(listing, isAiRecommended = false) {
  const isSaved = window.staymateState.isSaved(listing.id);
  const isCompared = window.staymateState.isCompared(listing.id);

  let genderPillClass = 'gender-pill-coed';
  if (listing.gender === 'Girls') genderPillClass = 'gender-pill-girls';
  if (listing.gender === 'Boys') genderPillClass = 'gender-pill-boys';

  return `
    <div class="stay-card overflow-hidden flex flex-col group relative" data-listing-id="${listing.id}">
      
      <!-- Photo Carousel / Image Container -->
      <div class="relative h-48 sm:h-52 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img src="${listing.photos[0]}" alt="${listing.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        
        <!-- Top Badges Overlay -->
        <div class="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span class="${genderPillClass}">${listing.gender}</span>
          ${listing.verified ? `<span class="badge-verified"><i class="fa-solid fa-circle-check text-[10px]"></i> Verified</span>` : ''}
          ${isAiRecommended ? `<span class="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">${listing.matchPercent || 96}% Match</span>` : ''}
        </div>

        <!-- Heart Wishlist Toggle Button -->
        <button class="heart-btn heart-toggle-btn absolute top-3 right-3 ${isSaved ? 'active' : ''}" data-id="${listing.id}" title="Save to Wishlist" aria-label="Save">
          <i class="${isSaved ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-base"></i>
        </button>

        <!-- Distance Badge -->
        <div class="absolute bottom-2.5 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <i class="fa-solid fa-location-crosshairs text-amber-400 text-[10px]"></i>
          <span>${listing.distanceText || (listing.area + ', ' + listing.city)}</span>
        </div>
      </div>

      <!-- Card Details Content -->
      <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <!-- Title & Rating -->
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-extrabold text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer" onclick="window.staymateState.setView('details', { listingId: '${listing.id}' })">
              ${listing.name}
            </h3>
            <div class="star-rating text-xs font-bold shrink-0">
              <i class="fa-solid fa-star"></i>
              <span>${listing.rating}</span>
              <span class="text-gray-400 font-normal">(${listing.reviewCount})</span>
            </div>
          </div>

          <p class="text-xs text-gray-500 mt-0.5">
            ${listing.area}, ${listing.city}
          </p>

          <!-- Key Amenities Chips -->
          <div class="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300 font-semibold mt-2.5 flex-wrap">
            ${listing.amenities.includes('wifi') ? `<span class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"><i class="fa-solid fa-wifi text-[10px] text-indigo-500"></i> WiFi</span>` : ''}
            ${listing.amenities.includes('ac') ? `<span class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"><i class="fa-solid fa-snowflake text-[10px] text-cyan-500"></i> AC</span>` : ''}
            ${listing.amenities.includes('food') ? `<span class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"><i class="fa-solid fa-utensils text-[10px] text-amber-500"></i> Food</span>` : ''}
            ${listing.amenities.includes('study_room') ? `<span class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"><i class="fa-solid fa-book-open text-[10px] text-emerald-500"></i> Study</span>` : ''}
          </div>

          <!-- Match Reason Note (if AI Recommended) -->
          ${isAiRecommended && listing.matchReason ? `
            <div class="mt-2 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
              <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
              <span class="line-clamp-1">${listing.matchReason}</span>
            </div>
          ` : ''}
        </div>

        <!-- Price & Action Buttons Footer -->
        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <div>
            <span class="text-lg font-extrabold text-gray-900 dark:text-white">₹${listing.rent.toLocaleString('en-IN')}</span>
            <span class="text-[11px] text-gray-500 font-semibold">/month</span>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Compare Checkbox -->
            <label class="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-indigo-600 cursor-pointer pr-1">
              <input type="checkbox" class="compare-toggle-checkbox custom-checkbox" data-id="${listing.id}" ${isCompared ? 'checked' : ''}>
              <span class="hidden sm:inline">Compare</span>
            </label>

            <!-- Schedule Visit Button -->
            <button class="schedule-visit-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1.5 rounded-full font-bold transition-colors" data-id="${listing.id}">
              <i class="fa-regular fa-calendar-check text-[11px]"></i>
              <span>Visit</span>
            </button>

            <!-- Details Button -->
            <button class="btn-primary text-xs px-3 py-1.5 shadow-sm" onclick="window.staymateState.setView('details', { listingId: '${listing.id}' })">
              <span>View</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}

// Bind universal card button events
document.addEventListener('click', (e) => {
  // Wishlist heart click
  const heartBtn = e.target.closest('.heart-toggle-btn');
  if (heartBtn) {
    e.stopPropagation();
    const id = heartBtn.getAttribute('data-id');
    const isNowSaved = window.staymateState.toggleSaved(id);
    if (isNowSaved) {
      heartBtn.classList.add('active');
      heartBtn.innerHTML = '<i class="fa-solid text-rose-500 fa-heart text-base"></i>';
      showToast('Added to your Saved Stays! ❤️', 'success');
    } else {
      heartBtn.classList.remove('active');
      heartBtn.innerHTML = '<i class="fa-regular fa-heart text-base"></i>';
      showToast('Removed from Saved Stays', 'info');
    }
    return;
  }

  // Schedule visit click
  const visitBtn = e.target.closest('.schedule-visit-btn');
  if (visitBtn) {
    e.stopPropagation();
    const id = visitBtn.getAttribute('data-id');
    window.openScheduleVisitModal(id);
    return;
  }

  // Compare checkbox change
  const compareCheck = e.target.closest('.compare-toggle-checkbox');
  if (compareCheck) {
    e.stopPropagation();
    const id = compareCheck.getAttribute('data-id');
    const res = window.staymateState.toggleCompare(id);
    if (!res.success) {
      compareCheck.checked = false;
      showToast(res.message, 'warning');
    } else {
      showToast(res.added ? 'Added to Comparison tray!' : 'Removed from Comparison', 'info');
    }
    return;
  }
});

/**
 * SCREEN 4 & 5: SEARCH & FILTER + PG RESULTS
 */
function renderSearchScreen() {
  const container = document.getElementById('appContainer');
  const filters = window.staymateState.filters;
  const filteredListings = window.staymateState.getFilteredListings();

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      
      <!-- Breadcrumb / Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Search PGs & Hostels
          </h1>
          <p class="text-xs text-gray-500">
            Showing <span class="font-extrabold text-indigo-600">${filteredListings.length} verified stays</span> in ${filters.city}, ${filters.state}
          </p>
        </div>

        <!-- Sorting & Filter Drawer Toggle (Mobile) -->
        <div class="flex items-center gap-2">
          <button id="toggleFilterSidebarBtn" class="lg:hidden btn-outline text-xs px-3.5 py-2">
            <i class="fa-solid fa-sliders text-indigo-600"></i>
            <span>Filters</span>
          </button>

          <select id="sortListingsSelect" class="bg-white dark:bg-[#201E27] border border-gray-200 dark:border-gray-700 text-xs font-bold px-3 py-2 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none">
            <option value="rating" ${filters.sortBy === 'rating' ? 'selected' : ''}>Sort: Top Rated</option>
            <option value="price_asc" ${filters.sortBy === 'price_asc' ? 'selected' : ''}>Rent: Low to High</option>
            <option value="price_desc" ${filters.sortBy === 'price_desc' ? 'selected' : ''}>Rent: High to Low</option>
            <option value="distance" ${filters.sortBy === 'distance' ? 'selected' : ''}>Distance: Nearest</option>
          </select>
        </div>
      </div>

      <!-- AI Natural Language Applied Feedback Banner -->
      ${filters.aiNaturalQuery ? `
        <div class="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-3 rounded-2xl mb-4 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-200">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
            <span>AI Filters automatically applied for: <strong>"${escapeHtml(filters.aiNaturalQuery)}"</strong></span>
          </div>
          <button id="clearAiQueryBtn" class="text-indigo-600 hover:text-indigo-800 font-bold ml-2 underline">Clear</button>
        </div>
      ` : ''}

      <!-- Main Layout: Sidebar Filters + Results Grid -->
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        
        <!-- SIDEBAR FILTERS (Sticky on Desktop) -->
        <aside id="searchFilterSidebar" class="w-full lg:w-80 bg-white dark:bg-[#201E27] p-5 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm shrink-0 lg:sticky lg:top-24 hidden lg:block">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
            <span class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <i class="fa-solid fa-sliders text-indigo-600"></i>
              <span>Filters</span>
            </span>
            <button id="resetFiltersBtn" class="text-xs text-rose-500 font-bold hover:underline">Reset All</button>
          </div>

          <form id="sidebarFilterForm" class="space-y-4 text-xs">
            
            <!-- Location: State > City > Area -->
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">State</label>
              <select id="filterStateSelect" class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">
                <option value="Gujarat" ${filters.state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
                <option value="Maharashtra" ${filters.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                <option value="Karnataka" ${filters.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                <option value="Delhi NCR" ${filters.state === 'Delhi NCR' ? 'selected' : ''}>Delhi NCR</option>
                <option value="Rajasthan" ${filters.state === 'Rajasthan' ? 'selected' : ''}>Rajasthan</option>
                <option value="Tamil Nadu" ${filters.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
                <option value="All" ${filters.state === 'All' ? 'selected' : ''}>All States</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">City</label>
              <select id="filterCitySelect" class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">
                <option value="Vadodara" ${filters.city === 'Vadodara' ? 'selected' : ''}>Vadodara (Default)</option>
                <option value="Ahmedabad" ${filters.city === 'Ahmedabad' ? 'selected' : ''}>Ahmedabad</option>
                <option value="Mumbai" ${filters.city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
                <option value="Pune" ${filters.city === 'Pune' ? 'selected' : ''}>Pune</option>
                <option value="Bengaluru" ${filters.city === 'Bengaluru' ? 'selected' : ''}>Bengaluru</option>
                <option value="Delhi" ${filters.city === 'Delhi' ? 'selected' : ''}>Delhi</option>
                <option value="Kota" ${filters.city === 'Kota' ? 'selected' : ''}>Kota</option>
                <option value="Jaipur" ${filters.city === 'Jaipur' ? 'selected' : ''}>Jaipur</option>
                <option value="Chennai" ${filters.city === 'Chennai' ? 'selected' : ''}>Chennai</option>
                <option value="All" ${filters.city === 'All' ? 'selected' : ''}>All Cities</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Area / Locality</label>
              <select id="filterAreaSelect" class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">
                <option value="All">All Localities</option>
                <option value="Fatehgunj" ${filters.area === 'Fatehgunj' ? 'selected' : ''}>Fatehgunj (Near MSU)</option>
                <option value="Sayajigunj" ${filters.area === 'Sayajigunj' ? 'selected' : ''}>Sayajigunj (Near Station)</option>
                <option value="Alkapuri" ${filters.area === 'Alkapuri' ? 'selected' : ''}>Alkapuri</option>
                <option value="Karelibaug" ${filters.area === 'Karelibaug' ? 'selected' : ''}>Karelibaug</option>
                <option value="Manjalpur" ${filters.area === 'Manjalpur' ? 'selected' : ''}>Manjalpur</option>
                <option value="Waghodia Road" ${filters.area === 'Waghodia Road' ? 'selected' : ''}>Waghodia Road (Parul)</option>
                <option value="Gotri" ${filters.area === 'Gotri' ? 'selected' : ''}>Gotri</option>
              </select>
            </div>

            <!-- Budget Slider (₹3k to ₹20k) -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="font-bold text-gray-700 dark:text-gray-300">Max Budget</label>
                <span id="budgetSliderDisplay" class="font-extrabold text-indigo-600">₹${filters.maxBudget.toLocaleString('en-IN')} / mo</span>
              </div>
              <input type="range" id="budgetSlider" min="3000" max="25000" step="500" value="${filters.maxBudget}" class="w-full">
              <div class="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>₹3,000</span>
                <span>₹12,000</span>
                <span>₹25,000</span>
              </div>
            </div>

            <!-- Gender Chips -->
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
              <div class="grid grid-cols-4 gap-1.5">
                ${['All', 'Girls', 'Boys', 'Co-ed'].map(g => `
                  <label class="border ${filters.gender === g ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 dark:border-gray-700 text-gray-600'} py-1.5 rounded-xl text-center cursor-pointer text-[11px]">
                    <input type="radio" name="filterGender" value="${g}" ${filters.gender === g ? 'checked' : ''} class="hidden">
                    <span>${g}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Sharing Type Chips -->
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Sharing Options</label>
              <div class="grid grid-cols-3 gap-1.5">
                ${['Single', 'Double', 'Triple'].map(s => `
                  <label class="border ${filters.sharingTypes.includes(s) ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 dark:border-gray-700 text-gray-600'} py-1.5 rounded-xl text-center cursor-pointer text-[11px]">
                    <input type="checkbox" name="filterSharing" value="${s}" ${filters.sharingTypes.includes(s) ? 'checked' : ''} class="hidden">
                    <span>${s}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Facilities & Amenities Checkboxes -->
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Facilities</label>
              <div class="space-y-1.5">
                ${[
                  { id: 'wifi', label: 'WiFi (High Speed)' },
                  { id: 'ac', label: 'Air Conditioning (AC)' },
                  { id: 'food', label: 'Mess / Food Included' },
                  { id: 'laundry', label: 'Laundry Service' },
                  { id: 'study_room', label: 'Silent Study Room' },
                  { id: 'parking', label: 'Vehicle Parking' },
                  { id: 'gym', label: 'Fitness Gym' }
                ].map(fac => `
                  <label class="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
                    <input type="checkbox" name="filterFacility" value="${fac.id}" ${filters.facilities.includes(fac.id) ? 'checked' : ''} class="custom-checkbox">
                    <span>${fac.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Food Preference -->
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Dietary / Food</label>
              <select id="filterFoodSelect" class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">
                <option value="All" ${filters.foodChoice === 'All' ? 'selected' : ''}>Any / All Options</option>
                <option value="Pure Veg" ${filters.foodChoice === 'Pure Veg' ? 'selected' : ''}>100% Pure Veg & Jain</option>
                <option value="Veg + Non-Veg" ${filters.foodChoice === 'Veg + Non-Veg' ? 'selected' : ''}>Veg + Non-Veg</option>
              </select>
            </div>

            <!-- Verified Only Switch -->
            <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span class="font-bold text-gray-800 dark:text-gray-200">Verified Stays Only</span>
              <input type="checkbox" id="filterVerifiedOnly" ${filters.verifiedOnly ? 'checked' : ''} class="custom-checkbox">
            </div>

            <button type="submit" class="btn-primary w-full py-2.5 font-bold shadow-md">
              Show Results (${filteredListings.length})
            </button>
          </form>
        </aside>

        <!-- RESULTS GRID -->
        <div class="flex-1 w-full">
          ${filteredListings.length === 0 ? `
            <div class="bg-white dark:bg-[#201E27] rounded-3xl p-12 text-center border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
              <div class="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-2xl mb-3">
                <i class="fa-solid fa-house-chimney-crack"></i>
              </div>
              <h3 class="text-lg font-extrabold text-gray-900 dark:text-white">No Stays Found Matching Filters</h3>
              <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try widening your budget, selecting "All Localities", or relaxing facility checkboxes.
              </p>
              <button id="emptyStateResetBtn" class="btn-primary text-xs px-4 py-2 mt-4">
                Reset All Filters
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              ${filteredListings.map(item => renderListingCardHtml(item)).join('')}
            </div>
          `}
        </div>

      </div>

    </div>
  `;

  // Bind Sidebar Events
  const slider = document.getElementById('budgetSlider');
  const sliderDisplay = document.getElementById('budgetSliderDisplay');
  slider?.addEventListener('input', (e) => {
    sliderDisplay.innerText = `₹${parseInt(e.target.value).toLocaleString('en-IN')} / mo`;
  });

  const sidebarForm = document.getElementById('sidebarFilterForm');
  sidebarForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilterValues();
  });

  document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
    window.staymateState.resetFilters();
  });
  document.getElementById('emptyStateResetBtn')?.addEventListener('click', () => {
    window.staymateState.resetFilters();
  });
  document.getElementById('clearAiQueryBtn')?.addEventListener('click', () => {
    window.staymateState.resetFilters();
  });

  document.getElementById('sortListingsSelect')?.addEventListener('change', (e) => {
    window.staymateState.updateFilters({ sortBy: e.target.value });
  });

  // Toggle filter sidebar on mobile
  document.getElementById('toggleFilterSidebarBtn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('searchFilterSidebar');
    sidebar.classList.toggle('hidden');
  });

  function applyFilterValues() {
    const stateVal = document.getElementById('filterStateSelect').value;
    const cityVal = document.getElementById('filterCitySelect').value;
    const areaVal = document.getElementById('filterAreaSelect').value;
    const maxBudgetVal = parseInt(document.getElementById('budgetSlider').value);
    const genderVal = document.querySelector('input[name="filterGender"]:checked')?.value || 'All';
    const foodVal = document.getElementById('filterFoodSelect').value;
    const verifiedVal = document.getElementById('filterVerifiedOnly').checked;

    const sharingVals = Array.from(document.querySelectorAll('input[name="filterSharing"]:checked')).map(c => c.value);
    const facilityVals = Array.from(document.querySelectorAll('input[name="filterFacility"]:checked')).map(c => c.value);

    window.staymateState.updateFilters({
      state: stateVal,
      city: cityVal,
      area: areaVal,
      maxBudget: maxBudgetVal,
      gender: genderVal,
      foodChoice: foodVal,
      verifiedOnly: verifiedVal,
      sharingTypes: sharingVals,
      facilities: facilityVals
    });
  }
}

/**
 * SCREEN 6: PG DETAILS (PHOTO SLIDER WITH LIGHTBOX, RENT DETAILS, ROOMS, TENANTS, RULES, FOOD MENU, NEARBY, REVIEWS)
 */
function renderDetailsScreen(listingId) {
  const container = document.getElementById('appContainer');
  const listing = window.staymateState.getAllListings().find(l => l.id === listingId) || window.staymateState.getAllListings()[0];
  const isSaved = window.staymateState.isSaved(listing.id);
  const isCompared = window.staymateState.isCompared(listing.id);

  // Similar PGs nearby
  const similar = window.staymateState.getAllListings()
    .filter(l => l.id !== listing.id && (l.city === listing.city || l.area === listing.area))
    .slice(0, 3);

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      
      <!-- Back Navigation & Action Bar -->
      <div class="flex items-center justify-between mb-4">
        <button onclick="window.staymateState.setView('search')" class="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 flex items-center gap-1.5">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back to Search Results</span>
        </button>

        <div class="flex items-center gap-2">
          <button class="btn-outline text-xs px-3 py-1.5" onclick="window.openShareModal(${JSON.stringify(listing).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-share-nodes"></i>
            <span>Share</span>
          </button>
          <button class="heart-btn heart-toggle-btn ${isSaved ? 'active' : ''}" data-id="${listing.id}">
            <i class="${isSaved ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-base"></i>
          </button>
        </div>
      </div>

      <!-- PHOTO GALLERY SLIDER WITH LIGHTBOX & VIDEO TOUR -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 h-72 sm:h-96 rounded-3xl overflow-hidden shadow-sm">
        <!-- Main Large Photo (Span 2 cols) -->
        <div class="md:col-span-2 h-full relative group cursor-pointer" onclick="window.openLightbox(${JSON.stringify(listing.photos).replace(/"/g, '&quot;')}, 0, '${listing.name}')">
          <img src="${listing.photos[0]}" alt="${listing.name}" class="w-full h-full object-cover group-hover:scale-102 transition-transform">
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          <span class="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5">
            <i class="fa-solid fa-expand text-[10px]"></i> View Full Lightbox (5 Photos)
          </span>
        </div>

        <!-- Secondary Photos Grid -->
        <div class="hidden md:grid grid-rows-2 gap-3 h-full">
          <div class="relative group cursor-pointer overflow-hidden rounded-xl" onclick="window.openLightbox(${JSON.stringify(listing.photos).replace(/"/g, '&quot;')}, 1)">
            <img src="${listing.photos[1] || listing.photos[0]}" alt="Washroom" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
            <span class="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">Washroom</span>
          </div>
          <div class="relative group cursor-pointer overflow-hidden rounded-xl" onclick="window.openLightbox(${JSON.stringify(listing.photos).replace(/"/g, '&quot;')}, 2)">
            <img src="${listing.photos[2] || listing.photos[0]}" alt="Dining Area" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
            <span class="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">Kitchen & Dining</span>
          </div>
        </div>

        <div class="hidden md:grid grid-rows-2 gap-3 h-full">
          <div class="relative group cursor-pointer overflow-hidden rounded-xl" onclick="window.openLightbox(${JSON.stringify(listing.photos).replace(/"/g, '&quot;')}, 3)">
            <img src="${listing.photos[3] || listing.photos[0]}" alt="Study Lounge" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
            <span class="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">Study Lounge</span>
          </div>
          <!-- Video Tour Trigger Card -->
          <div class="relative group cursor-pointer overflow-hidden rounded-xl bg-indigo-900 flex flex-col items-center justify-center text-white text-center p-3" onclick="window.openLightbox(${JSON.stringify(listing.photos).replace(/"/g, '&quot;')}, 4)">
            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-play text-amber-400"></i>
            </div>
            <span class="font-bold text-xs">Virtual 360° Tour</span>
            <span class="text-[10px] text-indigo-200">Watch walkthrough</span>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT & STICKY BOOKING CARD -->
      <div class="flex flex-col lg:flex-row gap-8 items-start">
        
        <!-- LEFT COLUMN: PROPERTY DETAILS -->
        <div class="flex-1 w-full space-y-6">
          
          <!-- Header Info -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="${listing.gender === 'Girls' ? 'gender-pill-girls' : (listing.gender === 'Boys' ? 'gender-pill-boys' : 'gender-pill-coed')} font-bold text-xs px-2.5 py-0.5">
                ${listing.gender} PG
              </span>
              ${listing.verified ? `<span class="badge-verified"><i class="fa-solid fa-circle-check"></i> Verified Property</span>` : ''}
              <span class="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">${listing.category}</span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              ${listing.name}
            </h1>
            <p class="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-location-dot text-indigo-600"></i>
              <span>${listing.address}</span>
            </p>
            <p class="text-xs font-bold text-indigo-600 mt-1">
              📍 ${listing.distanceText}
            </p>

            <div class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-amber-500">
                <i class="fa-solid fa-star text-base"></i>
                <span class="text-sm">${listing.rating}</span>
                <span class="text-gray-400 font-normal">(${listing.reviewCount} verified reviews)</span>
              </div>
              <div class="text-gray-400">•</div>
              <div class="text-gray-600 dark:text-gray-300 font-semibold">
                Food: <span class="text-emerald-600 font-bold">${listing.foodType}</span>
              </div>
            </div>
          </div>

          <!-- AMENITIES WITH ICONS -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-indigo-600"></i>
              <span>Amenities & Facilities</span>
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-wifi text-indigo-500"></i> High-Speed WiFi</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-snowflake text-cyan-500"></i> Air Conditioning</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-utensils text-amber-500"></i> 4-Time Mess Food</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-shirt text-blue-500"></i> Laundry & Washing</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-book-open text-emerald-500"></i> Silent Study Hall</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-video text-rose-500"></i> 24x7 CCTV & Security</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-bolt text-yellow-500"></i> Power Backup Generator</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-bath text-teal-500"></i> Attached Geyser Bath</div>
              <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl"><i class="fa-solid fa-square-parking text-purple-500"></i> 2-Wheeler Parking</div>
            </div>
          </div>

          <!-- RENT & DEPOSIT BREAKDOWN -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <i class="fa-solid fa-indian-rupee-sign text-indigo-600"></i>
              <span>Rent & Financial Details</span>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex justify-between">
                <span class="text-gray-500">Security Deposit:</span>
                <span class="font-extrabold text-gray-900 dark:text-white">₹${listing.deposit || listing.rent} (Refundable)</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex justify-between">
                <span class="text-gray-500">Maintenance Charges:</span>
                <span class="font-extrabold text-emerald-600">${listing.maintenance ? '₹' + listing.maintenance : '₹0 (Included)'}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex justify-between">
                <span class="text-gray-500">Electricity / Water:</span>
                <span class="font-extrabold text-gray-900 dark:text-white">${listing.electricityCharge || 'Included in rent'}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex justify-between">
                <span class="text-gray-500">Notice Period:</span>
                <span class="font-extrabold text-indigo-600">${listing.noticePeriod || '30 Days'}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex justify-between sm:col-span-2">
                <span class="text-gray-500">Minimum Lock-in Period:</span>
                <span class="font-extrabold text-gray-900 dark:text-white">${listing.lockInPeriod || '1 Month'}</span>
              </div>
            </div>
          </div>

          <!-- ROOMS AND SHARING BREAKDOWN -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <i class="fa-solid fa-door-closed text-indigo-600"></i>
              <span>Rooms & Bed Availability</span>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              ${(listing.roomsSharing || [
                { type: 'Single', rent: 12000, totalBeds: 4, availableBeds: 1 },
                { type: 'Double', rent: 8000, totalBeds: 16, availableBeds: 3 },
                { type: 'Triple', rent: 6500, totalBeds: 12, availableBeds: 2 }
              ]).map(r => `
                <div class="border border-gray-200 dark:border-gray-700 p-3.5 rounded-2xl">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-extrabold text-gray-900 dark:text-white">${r.type} Room</span>
                    <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">${r.availableBeds} beds left</span>
                  </div>
                  <div class="text-base font-extrabold text-indigo-600">₹${r.rent.toLocaleString('en-IN')}<span class="text-[11px] text-gray-400 font-normal">/mo</span></div>
                  <div class="text-[11px] text-gray-400 mt-1">Total capacity: ${r.totalBeds} beds</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- CURRENT TENANTS (ANONYMISED) -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <i class="fa-solid fa-users-viewfinder text-indigo-600"></i>
              <span>Current Tenant Demographics (Anonymised)</span>
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div class="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl">
                <div class="text-lg font-extrabold text-indigo-600">${listing.currentTenants?.studentPercent || 75}%</div>
                <div class="text-[11px] text-gray-500 font-semibold">College Students</div>
              </div>
              <div class="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl">
                <div class="text-lg font-extrabold text-indigo-600">${listing.currentTenants?.workingPercent || 25}%</div>
                <div class="text-[11px] text-gray-500 font-semibold">Working Professionals</div>
              </div>
              <div class="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl">
                <div class="text-lg font-extrabold text-indigo-600">${listing.currentTenants?.totalOccupants || 28}</div>
                <div class="text-[11px] text-gray-500 font-semibold">Total Occupants</div>
              </div>
              <div class="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl">
                <div class="text-lg font-extrabold text-indigo-600">${listing.currentTenants?.genderMix || '100% Female'}</div>
                <div class="text-[11px] text-gray-500 font-semibold">Gender Mix</div>
              </div>
            </div>
          </div>

          <!-- HOUSE RULES -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <i class="fa-solid fa-clipboard-list text-indigo-600"></i>
              <span>House Rules</span>
            </h2>
            <div class="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div class="flex items-start gap-2">
                <i class="fa-solid fa-clock text-indigo-600 mt-0.5"></i>
                <span><strong>Gate Timings:</strong> ${listing.houseRules?.gateTiming || '10:00 PM'}</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="fa-solid fa-user-group text-indigo-600 mt-0.5"></i>
                <span><strong>Visitors Policy:</strong> ${listing.houseRules?.visitors || 'Visitors allowed in lounge'}</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="fa-solid fa-ban-smoking text-rose-500 mt-0.5"></i>
                <span><strong>Smoking & Alcohol:</strong> ${listing.houseRules?.smokingDrinking || 'Strictly prohibited'}</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="fa-solid fa-paw text-indigo-600 mt-0.5"></i>
                <span><strong>Pets Policy:</strong> ${listing.houseRules?.pets || 'Not allowed'}</span>
              </div>
            </div>
          </div>

          <!-- WEEKLY FOOD MENU -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-bowl-food text-indigo-600"></i>
                <span>Weekly Food Menu</span>
              </h2>
              <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">${listing.foodType}</span>
            </div>

            <!-- Day Tabs -->
            <div id="foodDayTabs" class="flex gap-1.5 overflow-x-auto pb-2 text-xs font-bold">
              ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => `
                <button class="food-tab-btn px-3 py-1.5 rounded-xl border ${idx === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}" data-day="${day}">
                  ${day.slice(0, 3)}
                </button>
              `).join('')}
            </div>

            <!-- Active Day Menu Display -->
            <div id="foodMenuContent" class="mt-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl text-xs space-y-2">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- NEARBY PLACES WITH DISTANCES -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <i class="fa-solid fa-compass text-indigo-600"></i>
              <span>Nearby Places & Commute Distances</span>
            </h2>
            <div class="space-y-2 text-xs">
              ${(listing.nearbyPlaces || [
                { name: 'MSU Faculty of Technology', distance: '0.6 km', time: '7 mins walk' },
                { name: 'Vadodara Railway Station', distance: '1.4 km', time: '6 mins auto' },
                { name: 'Sayaji Baug Garden', distance: '0.4 km', time: '5 mins walk' }
              ]).map(place => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div class="font-bold text-gray-800 dark:text-gray-200">${place.name}</div>
                  <div class="text-right">
                    <span class="font-extrabold text-indigo-600">${place.distance}</span>
                    <span class="text-gray-400 font-semibold ml-1">(${place.time})</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- REVIEW CATEGORY SCORES & USER REVIEWS -->
          <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i class="fa-solid fa-star text-amber-400"></i>
              <span>Reviews & Category Ratings (${listing.reviewCount})</span>
            </h2>

            <!-- Scores Progress Bars -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              <div>
                <div class="flex justify-between mb-1 font-bold">
                  <span>Cleanliness & Hygiene</span>
                  <span class="text-indigo-600">${listing.reviewScores?.cleanliness || 4.8} / 5</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: ${((listing.reviewScores?.cleanliness || 4.8) / 5) * 100}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1 font-bold">
                  <span>Food Quality & Taste</span>
                  <span class="text-indigo-600">${listing.reviewScores?.food || 4.6} / 5</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: ${((listing.reviewScores?.food || 4.6) / 5) * 100}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1 font-bold">
                  <span>Safety & Security</span>
                  <span class="text-emerald-600">${listing.reviewScores?.safety || 4.9} / 5</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-emerald-500 h-2 rounded-full" style="width: ${((listing.reviewScores?.safety || 4.9) / 5) * 100}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1 font-bold">
                  <span>Value for Money</span>
                  <span class="text-indigo-600">${listing.reviewScores?.valueForMoney || 4.7} / 5</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: ${((listing.reviewScores?.valueForMoney || 4.7) / 5) * 100}%"></div>
                </div>
              </div>
            </div>

            <!-- User Reviews List -->
            <div class="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              ${(listing.reviews || [
                { author: 'Pooja Trivedi', college: 'MSU Tech', rating: 5, date: 'Oct 2026', comment: 'Super safe and homestyle food!' }
              ]).map(rev => `
                <div class="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-xs">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-extrabold text-gray-900 dark:text-white">${rev.author} <span class="font-normal text-gray-400">(${rev.college})</span></span>
                    <span class="text-amber-500 font-bold">${rev.rating} ★</span>
                  </div>
                  <p class="text-gray-600 dark:text-gray-300 leading-relaxed">${rev.comment}</p>
                </div>
              `).join('')}
            </div>

            <!-- Write Review Simulation -->
            <form id="addReviewForm" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs">
              <span class="font-bold text-gray-800 dark:text-gray-200 block">Add Your Review:</span>
              <textarea id="reviewTextInput" rows="2" placeholder="Share your experience staying here..." required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"></textarea>
              <button type="submit" class="btn-primary text-xs px-4 py-2 font-bold">Submit Review</button>
            </form>
          </div>

        </div>

        <!-- RIGHT COLUMN: STICKY BOOKING CARD & OWNER CONTACT -->
        <aside class="w-full lg:w-96 bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-xl shrink-0 lg:sticky lg:top-24">
          <div class="pb-4 border-b border-gray-100 dark:border-gray-800">
            <span class="text-xs text-gray-400 font-bold">Monthly Starting Rent</span>
            <div class="flex items-baseline gap-1 mt-0.5">
              <span class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">₹${listing.rent.toLocaleString('en-IN')}</span>
              <span class="text-xs text-gray-500 font-semibold">/ month</span>
            </div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1">
              <i class="fa-solid fa-check"></i> Zero Brokerage Guarantee
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="mt-4 space-y-2.5">
            <button class="btn-primary w-full py-3 font-bold text-sm shadow-md" onclick="window.openBookingModal('${listing.id}')">
              <i class="fa-solid fa-bolt"></i>
              <span>Contact / Book Stay</span>
            </button>

            <button class="btn-success w-full py-2.5 font-bold text-xs" onclick="window.openScheduleVisitModal('${listing.id}')">
              <i class="fa-regular fa-calendar-check"></i>
              <span>Schedule Free Physical / Video Visit</span>
            </button>
          </div>

          <!-- Owner Profile Card -->
          ${listing.owner ? `
            <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                  <i class="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <div class="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">${listing.owner.name}</div>
                  <div class="text-[11px] text-gray-400">${listing.owner.experience || 'Verified PG Owner'}</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                <a href="tel:${listing.owner.phone}" class="btn-success py-2 text-center text-xs">
                  <i class="fa-solid fa-phone"></i>
                  <span>Call Owner</span>
                </a>
                <a href="https://wa.me/${listing.owner.whatsapp || '919825014820'}" target="_blank" class="bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-full text-center flex items-center justify-center gap-1.5 shadow-sm">
                  <i class="fa-brands fa-whatsapp text-sm"></i>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ` : ''}

          <!-- Report Listing link -->
          <div class="mt-4 text-center">
            <button onclick="window.openReportModal(${JSON.stringify(listing).replace(/"/g, '&quot;')})" class="text-[11px] text-gray-400 hover:text-rose-500 font-semibold underline">
              Report incorrect details or issue with this listing
            </button>
          </div>
        </aside>

      </div>

      <!-- SIMILAR PGS NEARBY SECTION -->
      ${similar.length > 0 ? `
        <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 class="text-xl font-extrabold text-gray-900 dark:text-white mb-4">
            Similar PGs in ${listing.area}, ${listing.city}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${similar.map(item => renderListingCardHtml(item)).join('')}
          </div>
        </div>
      ` : ''}

    </div>
  `;

  // Bind Weekly Food Menu tabs
  const updateFoodMenu = (day) => {
    const content = document.getElementById('foodMenuContent');
    if (!content) return;
    const dayData = (listing.weeklyMenu && listing.weeklyMenu[day]) || {
      breakfast: 'Poha / Upma, Tea',
      lunch: 'Dal, Rice, Roti, Seasonal Sabzi',
      snacks: 'Tea & Snacks',
      dinner: 'Special Paneer / Gujarati Khichdi Kadhi'
    };
    content.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <span class="text-indigo-600 font-bold block">Breakfast:</span>
          <span class="text-gray-700 dark:text-gray-300">${dayData.breakfast || 'Nutritious Breakfast'}</span>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <span class="text-indigo-600 font-bold block">Lunch:</span>
          <span class="text-gray-700 dark:text-gray-300">${dayData.lunch || 'Full Thali'}</span>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <span class="text-indigo-600 font-bold block">Evening Tea:</span>
          <span class="text-gray-700 dark:text-gray-300">${dayData.snacks || 'Chai & Snacks'}</span>
        </div>
        <div class="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <span class="text-indigo-600 font-bold block">Dinner:</span>
          <span class="text-gray-700 dark:text-gray-300">${dayData.dinner || 'Homestyle Dinner'}</span>
        </div>
      </div>
    `;
  };

  updateFoodMenu('Monday');

  document.querySelectorAll('.food-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.food-tab-btn').forEach(b => {
        b.className = 'food-tab-btn px-3 py-1.5 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
      });
      btn.className = 'food-tab-btn px-3 py-1.5 rounded-xl border bg-indigo-600 text-white border-indigo-600';
      updateFoodMenu(btn.getAttribute('data-day'));
    });
  });

  // Bind Add Review Form
  document.getElementById('addReviewForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const comment = document.getElementById('reviewTextInput').value;
    const user = window.staymateState.currentUser;
    listing.reviews = listing.reviews || [];
    listing.reviews.unshift({
      author: user ? user.name : 'Verified Tenant',
      college: 'MSU Student',
      rating: 5,
      date: 'Just now',
      comment
    });
    listing.reviewCount = (listing.reviewCount || 0) + 1;
    showToast('Your review has been submitted and verified!', 'success');
    renderDetailsScreen(listing.id);
  });
}

/**
 * SCREEN 7: COMPARE PGS (UP TO 3 SIDE-BY-SIDE)
 */
function renderCompareScreen() {
  const container = document.getElementById('appContainer');
  const compareIds = window.staymateState.compareListings;
  const all = window.staymateState.getAllListings();
  const listings = compareIds.map(id => all.find(l => l.id === id)).filter(Boolean);

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Compare PGs Side-by-Side
          </h1>
          <p class="text-xs text-gray-500">Compare up to 3 properties on rent, amenities, rules & deposit</p>
        </div>
        <button onclick="window.staymateState.setView('search')" class="btn-outline text-xs px-3.5 py-1.5">
          <i class="fa-solid fa-plus"></i> Add More PGs
        </button>
      </div>

      ${listings.length === 0 ? `
        <div class="bg-white dark:bg-[#201E27] rounded-3xl p-12 text-center border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm">
          <div class="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-2xl mb-3">
            <i class="fa-solid fa-code-compare"></i>
          </div>
          <h3 class="text-lg font-extrabold text-gray-900 dark:text-white">No PGs Added to Compare</h3>
          <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Browse our listings and check the "Compare" checkbox on any card to compare them here!
          </p>
          <button onclick="window.staymateState.setView('search')" class="btn-primary text-xs px-4 py-2 mt-4">
            Explore PGs
          </button>
        </div>
      ` : `
        <div class="bg-white dark:bg-[#201E27] rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-800">
                <th class="p-4 w-44 font-bold text-gray-400 uppercase text-[11px]">Feature</th>
                ${listings.map(l => `
                  <th class="p-4 w-64 align-top">
                    <div class="relative group">
                      <img src="${l.photos[0]}" alt="${l.name}" class="w-full h-32 rounded-2xl object-cover mb-2 shadow">
                      <button class="remove-compare-btn absolute top-2 right-2 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-rose-600" data-id="${l.id}">
                        &times;
                      </button>
                    </div>
                    <div class="font-extrabold text-sm text-gray-900 dark:text-white">${l.name}</div>
                    <div class="text-[11px] text-gray-500">${l.area}, ${l.city}</div>
                    <div class="text-base font-extrabold text-indigo-600 mt-1">₹${l.rent.toLocaleString('en-IN')}<span class="text-xs text-gray-400 font-normal">/mo</span></div>
                    <div class="flex items-center gap-1.5 mt-2">
                      <button onclick="window.staymateState.setView('details', { listingId: '${l.id}' })" class="btn-primary text-[11px] py-1 px-3">Details</button>
                      <button onclick="window.openBookingModal('${l.id}')" class="btn-success text-[11px] py-1 px-3">Book</button>
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td class="p-4 font-bold text-gray-500">Rating</td>
                ${listings.map(l => `<td class="p-4 font-bold text-amber-500">${l.rating} ★ (${l.reviewCount} reviews)</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Gender Mix</td>
                ${listings.map(l => `<td class="p-4 font-bold">${l.gender}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Security Deposit</td>
                ${listings.map(l => `<td class="p-4 font-bold">₹${l.deposit || l.rent} (Refundable)</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Distance to Hub</td>
                ${listings.map(l => `<td class="p-4 font-bold text-indigo-600">${l.distanceText}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">High-Speed WiFi</td>
                ${listings.map(l => `<td class="p-4 font-extrabold ${l.amenities.includes('wifi') ? 'text-emerald-600' : 'text-gray-300'}">${l.amenities.includes('wifi') ? '✓ Yes (Fiber)' : '— No'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Mess / Food</td>
                ${listings.map(l => `<td class="p-4 font-extrabold ${l.amenities.includes('food') ? 'text-emerald-600' : 'text-gray-300'}">${l.amenities.includes('food') ? '✓ ' + l.foodType : '— No Food'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Air Conditioning (AC)</td>
                ${listings.map(l => `<td class="p-4 font-extrabold ${l.amenities.includes('ac') ? 'text-emerald-600' : 'text-gray-300'}">${l.amenities.includes('ac') ? '✓ AC Available' : '— Non-AC'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Silent Study Room</td>
                ${listings.map(l => `<td class="p-4 font-extrabold ${l.amenities.includes('study_room') ? 'text-emerald-600' : 'text-gray-300'}">${l.amenities.includes('study_room') ? '✓ Yes (24x7)' : '— No'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Laundry Service</td>
                ${listings.map(l => `<td class="p-4 font-extrabold ${l.amenities.includes('laundry') ? 'text-emerald-600' : 'text-gray-300'}">${l.amenities.includes('laundry') ? '✓ Twice weekly' : '— No'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-4 font-bold text-gray-500">Gate Timings</td>
                ${listings.map(l => `<td class="p-4 font-semibold">${l.houseRules?.gateTiming || '10:00 PM'}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  // Bind remove compare buttons
  document.querySelectorAll('.remove-compare-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      window.staymateState.toggleCompare(id);
      renderCompareScreen();
    });
  });
}

/**
 * SCREEN 9: INTERACTIVE MAP VIEW (LEAFLET WITH PG PINS)
 */
function renderMapScreen() {
  const container = document.getElementById('appContainer');
  const listings = window.staymateState.getAllListings();

  container.innerHTML = `
    <div class="h-[calc(100vh-140px)] w-full relative flex flex-col">
      <!-- Top Search & Locality Filter bar on Map -->
      <div class="absolute top-4 left-4 right-4 z-[500] max-w-xl mx-auto flex items-center gap-2 bg-white/95 dark:bg-[#201E27]/95 p-2 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-md">
        <i class="fa-solid fa-magnifying-glass text-indigo-600 pl-2"></i>
        <input type="text" id="mapSearchInput" placeholder="Search locality e.g. Fatehgunj, Alkapuri..." class="flex-1 text-xs bg-transparent focus:outline-none text-gray-800 dark:text-white">
        <button id="mapVadodaraCenterBtn" class="btn-primary text-xs px-3 py-1.5 rounded-xl font-bold">Vadodara</button>
      </div>

      <!-- Map Container -->
      <div id="leafletMapContainer" class="flex-1 w-full z-[1]"></div>

      <!-- Bottom PG Preview Card (Pops up when pin is tapped) -->
      <div id="mapPreviewCard" class="absolute bottom-6 left-4 right-4 z-[500] max-w-md mx-auto hidden bg-white dark:bg-[#201E27] p-3.5 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-[fadeIn_0.2s_ease]">
        <!-- Dynamically injected upon pin click -->
      </div>
    </div>
  `;

  // Initialize Leaflet Map (Centered on Vadodara [22.3072, 73.1812])
  setTimeout(() => {
    const map = L.map('leafletMapContainer').setView([22.3168, 73.1895], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Custom Icon Builder
    const createMarkerIcon = (price, isGirls) => L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="background-color: ${isGirls ? '#BE185D' : '#5B5BD6'}; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">
          ₹${(price/1000).toFixed(1)}k
        </div>
      `,
      iconSize: [50, 30],
      iconAnchor: [25, 15]
    });

    const preview = document.getElementById('mapPreviewCard');

    listings.forEach(item => {
      if (item.coordinates && item.coordinates.length === 2) {
        const marker = L.marker(item.coordinates, {
          icon: createMarkerIcon(item.rent, item.gender === 'Girls')
        }).addTo(map);

        marker.on('click', () => {
          preview.classList.remove('hidden');
          preview.innerHTML = `
            <div class="flex gap-3">
              <img src="${item.photos[0]}" alt="${item.name}" class="w-20 h-20 rounded-2xl object-cover shrink-0">
              <div class="flex-1 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-sm text-gray-900 dark:text-white line-clamp-1">${item.name}</span>
                  <button id="closeMapPreviewBtn" class="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <div class="text-gray-500 font-semibold mt-0.5">${item.area}, ${item.city}</div>
                <div class="text-indigo-600 font-bold text-[11px]">${item.distanceText}</div>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-sm font-extrabold text-gray-900 dark:text-white">₹${item.rent.toLocaleString('en-IN')}/mo</span>
                  <div class="flex items-center gap-1.5">
                    <button class="btn-primary text-[10px] px-2.5 py-1" onclick="window.staymateState.setView('details', { listingId: '${item.id}' })">Details</button>
                    <button class="btn-success text-[10px] px-2.5 py-1" onclick="window.openBookingModal('${item.id}')">Book</button>
                  </div>
                </div>
              </div>
            </div>
          `;

          document.getElementById('closeMapPreviewBtn')?.addEventListener('click', () => {
            preview.classList.add('hidden');
          });
        });
      }
    });

    document.getElementById('mapVadodaraCenterBtn')?.addEventListener('click', () => {
      map.setView([22.3168, 73.1895], 13);
    });
  }, 100);
}

/**
 * EXTRA SCREENS: ROOMMATES, STATES, HOSTELS, POST PG, OWNER DASHBOARD, ADMIN DASHBOARD, MY STAYS, PROFILE, ABOUT, FAQ
 */

// 1. Find a Roommate / Sharing
function renderRoommatesScreen() {
  const container = document.getElementById('appContainer');
  const roommates = window.staymateState.roommates;

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Find a Roommate & Flat Sharing
          </h1>
          <p class="text-xs text-gray-500">Connect with students & working professionals in Vadodara to split rent</p>
        </div>
        <button onclick="window.openPostRoommateModal()" class="btn-primary text-xs px-4 py-2.5 font-bold shadow-md">
          <i class="fa-solid fa-plus-circle"></i>
          <span>Post Requirement</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${roommates.map(rm => `
          <div class="stay-card p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-start gap-3.5 mb-3">
                <img src="${rm.avatar}" alt="${rm.name}" class="w-12 h-12 rounded-2xl object-cover shadow-sm">
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="font-extrabold text-sm text-gray-900 dark:text-white">${rm.name}, ${rm.age}</h3>
                    <span class="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">${rm.budget}</span>
                  </div>
                  <div class="text-xs text-gray-500 font-semibold">${rm.occupation}</div>
                  <div class="text-[11px] text-gray-400">📍 ${rm.location} • Move-in: ${rm.moveInDate}</div>
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                ${rm.about}
              </div>

              <!-- Habits tags -->
              <div class="flex items-center gap-1.5 flex-wrap">
                ${(rm.habits || []).map(h => `
                  <span class="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                    #${h}
                  </span>
                `).join('')}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span class="text-xs text-emerald-600 font-bold"><i class="fa-solid fa-circle-check"></i> Phone Verified</span>
              <a href="https://wa.me/${rm.contact?.replace(/\D/g, '') || '919825190123'}" target="_blank" class="btn-success text-xs px-3.5 py-1.5 font-bold shadow-sm">
                <i class="fa-brands fa-whatsapp"></i>
                <span>Connect on WhatsApp</span>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 2. State-Wise Browsing
function renderStatesScreen() {
  const container = document.getElementById('appContainer');
  const states = window.staymateData.statesAndUTs;

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Explore Stays Across Indian States & UTs
        </h1>
        <p class="text-xs text-gray-500">Find student housing in all 28 States and 8 Union Territories</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        ${states.map(st => `
          <div class="stay-card overflow-hidden group cursor-pointer" onclick="window.staymateState.updateFilters({ state: '${st.name}', city: 'All' }); window.staymateState.setView('search');">
            <div class="h-32 relative overflow-hidden bg-gray-100">
              <img src="${st.image}" alt="${st.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
              <span class="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">${st.type}</span>
              <span class="absolute bottom-2.5 right-2.5 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">${st.listingsCount}+ Stays</span>
            </div>
            <div class="p-4">
              <h3 class="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">${st.name}</h3>
              <p class="text-xs text-gray-500">Capital: ${st.capital}</p>
              <div class="text-[11px] text-indigo-600 font-semibold mt-2 flex items-center gap-1">
                <span>Hubs: ${st.hubs.join(', ')}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 3. State Hostels Directory
function renderHostelsScreen() {
  const container = document.getElementById('appContainer');
  const hostels = window.staymateData.hostelsDirectory;

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Government & University Hostels Directory
        </h1>
        <p class="text-xs text-gray-500">Subsidized and government-aided accommodation for students and working women in Gujarat & India</p>
      </div>

      <div class="space-y-5">
        ${hostels.map(h => `
          <div class="stay-card p-5 sm:p-6 flex flex-col md:flex-row gap-5">
            <img src="${h.photo}" alt="${h.name}" class="w-full md:w-60 h-44 rounded-2xl object-cover shrink-0">
            <div class="flex-1 flex flex-col justify-between text-xs">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">${h.type}</span>
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">${h.category}</span>
                </div>
                <h3 class="text-lg font-extrabold text-gray-900 dark:text-white">${h.name}</h3>
                <p class="text-gray-500 font-semibold mt-0.5">📍 ${h.address}</p>
                <div class="mt-2 text-indigo-600 font-extrabold text-sm">${h.fees}</div>
                <p class="text-gray-600 dark:text-gray-300 mt-1"><strong>Eligibility:</strong> ${h.eligibility}</p>
                <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                  ${(h.facilities || []).map(f => `<span class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[11px] font-semibold">${f}</span>`).join('')}
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span class="text-gray-500 font-semibold">Contact: ${h.contact}</span>
                <button class="btn-primary text-xs px-3.5 py-1.5" onclick="showToast('Hostel application guidelines sent to your email!', 'success')">
                  Application Guide
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 4. Post Your PG (Owner Multi-Step Form)
function renderPostPgScreen() {
  const container = document.getElementById('appContainer');

  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <div class="text-center mb-6">
        <span class="badge-verified mb-2">Owner Portal</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">List Your Property on StayMate AI</h1>
        <p class="text-xs text-gray-500 mt-1">Reach 50,000+ students and professionals in Vadodara with 0% brokerage</p>
      </div>

      <div class="bg-white dark:bg-[#201E27] p-6 sm:p-8 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-md">
        
        <!-- Multi-Step Indicator -->
        <div class="flex items-center justify-between mb-6 text-xs font-bold border-b border-gray-100 dark:border-gray-800 pb-3">
          <span class="text-indigo-600">Step 1: Details</span>
          <span class="text-indigo-600">Step 2: Rent</span>
          <span class="text-indigo-600">Step 3: Amenities</span>
          <span class="text-indigo-600">Step 4: Publish</span>
        </div>

        <form id="ownerPostPgForm" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">PG / Property Name</label>
            <input type="text" id="ownerPgName" required placeholder="e.g. Krishna Luxury Girls PG" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input type="text" id="ownerPgCity" value="Vadodara" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Area / Locality</label>
              <input type="text" id="ownerPgArea" placeholder="e.g. Fatehgunj" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Full Street Address</label>
            <input type="text" id="ownerPgAddress" placeholder="e.g. 18, Pratapgunj, Near MSU Gate 3" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Gender Allowed</label>
              <select id="ownerPgGender" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">
                <option>Girls</option>
                <option>Boys</option>
                <option>Co-ed</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Monthly Starting Rent (₹)</label>
              <input type="number" id="ownerPgRent" placeholder="7500" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Security Deposit (₹)</label>
              <input type="number" id="ownerPgDeposit" placeholder="7500" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Gate Closing Time</label>
              <input type="text" id="ownerPgGateTiming" value="10:30 PM" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Photo Upload (Simulated)</label>
            <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-2xl text-center cursor-pointer hover:border-indigo-500">
              <i class="fa-solid fa-cloud-arrow-up text-2xl text-indigo-500 mb-1"></i>
              <div class="text-xs font-bold text-gray-700 dark:text-gray-300">Click to upload room & building photos</div>
              <div class="text-[10px] text-gray-400">PNG, JPG up to 10MB</div>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full py-3 font-bold text-sm shadow-md mt-4">
            <i class="fa-solid fa-paper-plane"></i>
            <span>Submit Property for Verification</span>
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('ownerPostPgForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('ownerPgName').value;
    const city = document.getElementById('ownerPgCity').value;
    const area = document.getElementById('ownerPgArea').value;
    const address = document.getElementById('ownerPgAddress').value;
    const gender = document.getElementById('ownerPgGender').value;
    const rent = parseInt(document.getElementById('ownerPgRent').value) || 7500;
    const deposit = parseInt(document.getElementById('ownerPgDeposit').value) || rent;
    const gate = document.getElementById('ownerPgGateTiming').value;

    window.staymateState.addOwnerListing({
      name,
      city,
      area,
      address,
      gender,
      rent,
      deposit,
      distanceText: `0.8 km from MSU / Center`,
      photos: [
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80"
      ],
      amenities: ["wifi", "ac", "food", "study_room", "parking"],
      foodType: "Pure Veg",
      houseRules: { gateTiming: gate, smokingDrinking: "Prohibited", pets: "No" },
      owner: { name: window.staymateState.currentUser?.name || "Owner", phone: "+91 98250 12345" }
    });

    showToast('Listing submitted! Our Vadodara agent will verify it within 24 hours.', 'success');
    window.staymateState.setView('owner-dashboard');
  });
}

// 5. Owner Dashboard
function renderOwnerDashboardScreen() {
  const container = document.getElementById('appContainer');
  const ownerListings = window.staymateState.ownerListings;

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Owner Management Portal</h1>
          <p class="text-xs text-gray-500">Track inquiries, bookings, and listed properties</p>
        </div>
        <button onclick="window.staymateState.setView('post-pg')" class="btn-primary text-xs px-3.5 py-2 font-bold">
          <i class="fa-solid fa-plus"></i> Add New PG
        </button>
      </div>

      <!-- Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-[#201E27] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div class="text-gray-400 text-xs font-bold">Active Listings</div>
          <div class="text-2xl font-extrabold text-indigo-600 mt-1">${ownerListings.length + 1}</div>
        </div>
        <div class="bg-white dark:bg-[#201E27] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div class="text-gray-400 text-xs font-bold">Occupancy Rate</div>
          <div class="text-2xl font-extrabold text-emerald-600 mt-1">92%</div>
        </div>
        <div class="bg-white dark:bg-[#201E27] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div class="text-gray-400 text-xs font-bold">Total Enquiries</div>
          <div class="text-2xl font-extrabold text-indigo-600 mt-1">48</div>
        </div>
        <div class="bg-white dark:bg-[#201E27] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div class="text-gray-400 text-xs font-bold">Monthly Revenue</div>
          <div class="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">₹1,84,000</div>
        </div>
      </div>

      <!-- Properties Table -->
      <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 class="font-extrabold text-base text-gray-900 dark:text-white mb-3">Your Listed Properties</h3>
        <div class="space-y-3 text-xs">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between">
            <div>
              <div class="font-extrabold text-gray-900 dark:text-white">Sunrise Luxury Girls PG</div>
              <div class="text-gray-500">Fatehgunj, Vadodara • 28/34 Beds Occupied</div>
            </div>
            <span class="badge-verified">Verified & Live</span>
          </div>
          ${ownerListings.map(ol => `
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-extrabold text-gray-900 dark:text-white">${ol.name}</div>
                <div class="text-gray-500">${ol.area}, ${ol.city} • ₹${ol.rent}/mo</div>
              </div>
              <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending Physical Audit</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 6. Admin Dashboard
function renderAdminDashboardScreen() {
  const container = document.getElementById('appContainer');

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">StayMate AI Administration</h1>
        <p class="text-xs text-gray-500">Approve listings, audit field reports, and manage platform safety</p>
      </div>

      <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 text-xs">
        <div class="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
          <span class="font-extrabold text-sm text-gray-900 dark:text-white">Listing Verification Queue (2 Pending)</span>
          <span class="text-indigo-600 font-bold">Audit Mode: ON</span>
        </div>

        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <div class="font-bold text-gray-900 dark:text-white">Sayaji Scholars PG (Fatehgunj)</div>
            <div class="text-gray-400">Owner Aadhaar & Electricity bill verified</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-success text-xs px-3 py-1" onclick="showToast('Listing Approved & Verified badge granted!', 'success')">Approve</button>
            <button class="bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs px-3 py-1 rounded-full font-bold" onclick="showToast('Listing Rejected with feedback sent to owner', 'error')">Reject</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 7. My Stays / Bookings
function renderMyStaysScreen() {
  const container = document.getElementById('appContainer');
  const bookings = window.staymateState.bookings;

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-12">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">My Stays & Bookings</h1>
      <p class="text-xs text-gray-500 mb-6">Manage confirmed stays, dates, and download payment receipts</p>

      ${bookings.length === 0 ? `
        <div class="bg-white dark:bg-[#201E27] p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
          <p class="text-xs text-gray-500">You have no active bookings yet.</p>
          <button onclick="window.staymateState.setView('search')" class="btn-primary text-xs px-4 py-2 mt-3">Find a Stay</button>
        </div>
      ` : `
        <div class="space-y-4">
          ${bookings.map(b => `
            <div class="stay-card p-5 flex flex-col sm:flex-row gap-4 justify-between">
              <div class="flex gap-3.5">
                <img src="${b.photo}" alt="${b.listingName}" class="w-20 h-20 rounded-2xl object-cover shrink-0">
                <div class="text-xs">
                  <span class="badge-verified mb-1">${b.status}</span>
                  <h3 class="font-extrabold text-base text-gray-900 dark:text-white">${b.listingName}</h3>
                  <p class="text-gray-500 font-semibold">${b.area}</p>
                  <p class="text-[11px] text-gray-400 mt-1">Check-in: ${b.checkIn} • Check-out: ${b.checkOut}</p>
                  <p class="text-[11px] text-indigo-600 font-bold">${b.sharingType} • ₹${b.rentPerMonth}/mo</p>
                </div>
              </div>
              <div class="flex flex-row sm:flex-col justify-end gap-2 text-xs font-bold shrink-0">
                <button class="btn-primary px-3 py-1.5" onclick="showToast('Official StayMate invoice downloaded!', 'success')">
                  <i class="fa-solid fa-file-invoice"></i> Receipt
                </button>
                <a href="tel:${b.ownerPhone}" class="btn-success px-3 py-1.5 text-center">
                  <i class="fa-solid fa-phone"></i> Call Owner
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// 8. Saved Wishlist
function renderSavedScreen() {
  const container = document.getElementById('appContainer');
  const savedIds = window.staymateState.savedListings;
  const all = window.staymateState.getAllListings();
  const savedListings = savedIds.map(id => all.find(l => l.id === id)).filter(Boolean);

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">Saved PGs & Wishlist</h1>
      <p class="text-xs text-gray-500 mb-6">Your bookmarked student accommodations in Vadodara</p>

      ${savedListings.length === 0 ? `
        <div class="bg-white dark:bg-[#201E27] p-12 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
          <i class="fa-regular fa-heart text-3xl text-rose-400 mb-2"></i>
          <p class="text-xs text-gray-500">Your wishlist is empty. Tap the heart icon on any PG card to bookmark it!</p>
          <button onclick="window.staymateState.setView('search')" class="btn-primary text-xs px-4 py-2 mt-4">Browse PGs</button>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${savedListings.map(item => renderListingCardHtml(item)).join('')}
        </div>
      `}
    </div>
  `;
}

// 9. Profile & Settings
function renderProfileScreen() {
  const container = document.getElementById('appContainer');
  const user = window.staymateState.currentUser;

  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <div class="bg-white dark:bg-[#201E27] p-6 sm:p-8 rounded-3xl border border-[#EFE4D6] dark:border-[#332F2A] shadow-sm text-xs">
        <div class="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
          <img src="${user.avatar}" alt="${user.name}" class="w-16 h-16 rounded-full object-cover border-2 border-indigo-600">
          <div>
            <h2 class="text-lg font-extrabold text-gray-900 dark:text-white">${user.name}</h2>
            <p class="text-gray-500 font-semibold">${user.college || 'MSU Vadodara'}</p>
            <span class="inline-block mt-1 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              ${user.role} Account
            </span>
          </div>
        </div>

        <form id="profileForm" class="space-y-4 mt-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value="${user.email}" id="profileEmail" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input type="tel" value="${user.phone}" id="profilePhone" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Preferred City</label>
              <input type="text" value="Vadodara" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold">
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Monthly Budget (₹)</label>
              <input type="number" value="${user.preferences?.budget || 8500}" id="profileBudget" class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold">
            </div>
          </div>

          <div class="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <button type="submit" class="btn-primary py-2 px-5 font-bold">Save Changes</button>
            <button type="button" onclick="window.openAuthModal('login')" class="text-rose-500 font-bold hover:underline">Switch Account</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    user.email = document.getElementById('profileEmail').value;
    user.phone = document.getElementById('profilePhone').value;
    user.preferences.budget = parseInt(document.getElementById('profileBudget').value) || 8500;
    localStorage.setItem('staymate_user', JSON.stringify(user));
    showToast('Profile preferences updated!', 'success');
  });
}

// 10. FAQ Screen
function renderFaqScreen() {
  const container = document.getElementById('appContainer');
  const faqs = window.staymateData.faqs;

  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">Frequently Asked Questions</h1>
      <p class="text-xs text-gray-500 mb-6">Everything you need to know about booking PGs, security deposits, and house rules on StayMate AI.</p>

      <div class="space-y-3">
        ${faqs.map(f => `
          <details class="stay-card p-4 text-xs group cursor-pointer">
            <summary class="font-extrabold text-sm text-gray-900 dark:text-white flex justify-between items-center select-none">
              <span>${f.q}</span>
              <i class="fa-solid fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
            </summary>
            <p class="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-2 font-medium">
              ${f.a}
            </p>
          </details>
        `).join('')}
      </div>
    </div>
  `;
}

// 11. About Screen
function renderAboutScreen() {
  const container = document.getElementById('appContainer');
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 text-xs">
      <span class="badge-verified mb-2">About StayMate AI</span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Empowering India's Students & Young Professionals</h1>
      <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 leading-relaxed text-gray-700 dark:text-gray-300 space-y-3">
        <p>StayMate AI was founded in Vadodara with a clear mission: eliminate fraudulent brokers, hidden maintenance costs, and unsafe student housing across India.</p>
        <p>By blending deep local verification in educational hubs like MSU Vadodara, Parul University, DU North Campus, and Pune's FC Road with intelligent natural-language search, we empower youth to find their ideal second home in seconds.</p>
        <h4 class="font-bold text-gray-900 dark:text-white pt-2">Our 3 Core Pillars:</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>100% Zero Brokerage:</strong> You deal directly with verified owners.</li>
          <li><strong>Physical Safety Audits:</strong> CCTV, biometric logs, and female warden checks.</li>
          <li><strong>Transparent Food Menus & Rules:</strong> No surprise fees or surprise meal menus.</li>
        </ul>
      </div>
    </div>
  `;
}

// 12. Contact Screen
function renderContactScreen() {
  const container = document.getElementById('appContainer');
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 text-xs">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Contact StayMate AI Support</h1>
      <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div>
          <span class="font-bold text-gray-900 dark:text-white block">Vadodara Headquarters:</span>
          <p class="text-gray-500">StayMate AI Technologies, 402 Alkapuri Arcade, RC Dutt Road, Vadodara, Gujarat 390007</p>
        </div>
        <div>
          <span class="font-bold text-gray-900 dark:text-white block">24x7 Helpdesk:</span>
          <p class="text-gray-500">support@staymate.ai • +91 98250 88910</p>
        </div>
        <form onsubmit="event.preventDefault(); showToast('Message received! Our support agent will call back shortly.', 'success');" class="space-y-3 pt-3 border-t">
          <input type="text" placeholder="Your Name" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl">
          <input type="email" placeholder="Your Email" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl">
          <textarea rows="3" placeholder="How can we help?" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"></textarea>
          <button type="submit" class="btn-primary px-5 py-2 font-bold">Send Message</button>
        </form>
      </div>
    </div>
  `;
}

// 13. Terms & Privacy Screen
function renderTermsPrivacyScreen(type) {
  const container = document.getElementById('appContainer');
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
      <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 capitalize">${type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</h1>
      <div class="bg-white dark:bg-[#201E27] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-3">
        <p>StayMate AI is committed to maintaining user trust, transparency, and personal security across all student and owner interactions.</p>
        <p>All listings and user profiles undergo Aadhaar and emergency contact validation to preserve campus community safety.</p>
        <p>For any inquiries regarding data protection, please contact privacy@staymate.ai.</p>
      </div>
    </div>
  `;
}

// Simple HTML escaper helper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
