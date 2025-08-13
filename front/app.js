/**
 * Main application logic for Birthday Reminder App
 */

// Variable to store connection check interval
let connectionCheckInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded");
  
  // Initialize authentication first
  window.authManager = new AuthManager();

  // Add click listener for the hero CTA button
  const heroCtaBtn = document.getElementById('hero-cta-btn');
  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', () => {
      window.authManager.showAuthModal();
    });
  }

  // Open auth modal from landing feature buttons
  document.querySelectorAll('[data-open-auth]').forEach(btn => {
    btn.addEventListener('click', () => window.authManager && window.authManager.showAuthModal());
  });

  // Animate feature sections on scroll
  const featureSections = document.querySelectorAll('.feature-section');
  if (featureSections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    featureSections.forEach(sec => io.observe(sec));
  }

  // If not logged in, show the hero section behind the auth modal
  const sessionToken = localStorage.getItem('session_token');
  if (!sessionToken) {
    showView('hero');
  }
  
  // AuthManager will handle authentication check in its init() method
  // and dispatch authSuccess event if user is already authenticated
});

/**
 * Applies the selected theme to the body.
 * @param {string} theme - The theme to apply ('light', 'dark', 'system').
 */
function applyTheme(theme) {
  document.body.classList.remove('dark-theme', 'system-theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (theme === 'system') {
    document.body.classList.add('system-theme');
  }
  // For 'light' theme, no class is needed as it's the default (handled by :root CSS).
  console.log(`Theme applied: ${theme}`);
}

/**
 * Sets up the theme switcher functionality.
 */
function setupThemeSwitcher() {
  const themeSelect = document.getElementById('theme-select');
  if (!themeSelect) {
    console.error('Theme select element (#theme-select) not found');
    return;
  }

  const THEME_STORAGE_KEY = 'app-theme';

  // 1. Load saved theme or default to 'system'
  let currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  themeSelect.value = currentTheme;
  applyTheme(currentTheme);

  // 2. Listen for changes on the theme select dropdown
  themeSelect.addEventListener('change', (e) => {
    const newTheme = e.target.value;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  });

  // 3. Listen for OS-level theme changes
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  prefersDarkScheme.addEventListener('change', () => {
    // Only re-apply if the current setting in localStorage is 'system'
    const currentSelectedThemeInStorage = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    if (currentSelectedThemeInStorage === 'system') {
      // No need to change themeSelect.value here, applyTheme will handle the body class
      // which CSS will use in conjunction with the media query.
      applyTheme('system'); 
      console.log('OS theme changed, re-applied system theme.');
    }
  });
  console.log("Theme switcher setup complete.");
}

// Function removed - consolidated with mobile enhancements version below

// Make functions available globally for auth manager
window.resetApp = function() {
  // Clear connection check interval
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  
  // Clear last view context and ensure all views are not force-hidden
  localStorage.removeItem('lastActiveView');
  localStorage.removeItem('lastActiveGroupId');
  document.querySelectorAll('.view').forEach(view => view.classList.remove('hidden', 'active'));
  
  // Show hero for logged-out users
  showView('hero');
  
  // Clear any modals
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => modal.classList.add('hidden'));
  
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.add('hidden');
  }
};

// Add event listeners for auth events
document.addEventListener('authSuccess', () => {
  console.log('Authentication successful, initializing app');
  initializeApp();
});

document.addEventListener('authLogout', () => {
  console.log('User logged out, resetting app');
  window.resetApp();
});

/**
 * Check connection to the API
 */
function checkConnectionStatus() {
  const connectionStatus = document.getElementById('connection-status');
  if (!connectionStatus) return;
  
  // Get session token from localStorage
  const sessionToken = localStorage.getItem('session_token');
  if (!sessionToken) {
    connectionStatus.innerHTML = `
      <span class="status-indicator offline"></span>
      <span class="status-text">Non authentifié</span>
    `;
    return;
  }
  
  fetch('https://rappelanniv.aaweb.fr/api/settings.php', {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    }
  })
    .then(response => {
      if (response.ok) {
        connectionStatus.innerHTML = `
          <span class="status-indicator online"></span>
          <span class="status-text">Connecté à la base de données</span>
        `;
      } else {
        throw new Error('API non disponible');
      }
    })
    .catch(error => {
      connectionStatus.innerHTML = `
        <span class="status-indicator offline"></span>
        <span class="status-text">Mode hors ligne (données locales)</span>
      `;
    });
}

/**
 * Set up navigation between views
 */
function setupNavigation() {
  console.log("Setting up navigation");
    const navButtons = {
    'dashboard-btn': 'dashboard',
    'groups-btn': 'groups',
    'profile-btn-nav': 'profile',
    'settings-btn': 'settings'
  };
  
  // Set up click handlers for navigation buttons
  for (const [buttonId, viewId] of Object.entries(navButtons)) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        console.log(`Navigating to ${viewId}`);
        showView(viewId);
        // Menu closing will be handled by the burger menu's own nav link listeners
      });
    } else {
      console.error(`Button ${buttonId} not found`);
    }
  }
  
  // Logo click handler - navigate to dashboard
  const logoLink = document.getElementById('logo-link');
  if (logoLink) {
    logoLink.addEventListener('click', () => {
      console.log('Logo clicked - navigating to dashboard');
      showView('dashboard');
    });
  }
  
  // Back button for group details
  const backToGroupsBtn = document.getElementById('back-to-groups');
  if (backToGroupsBtn) {
    backToGroupsBtn.addEventListener('click', () => {
      showView('groups');
    });
  }
  
  // Notification bell
  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    notificationBell.addEventListener('click', () => {
      showNotificationCenter();
    });
  }

  // User menu dropdown
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');

  if (userMenuBtn && userDropdown) {
    const newUserMenuBtn = userMenuBtn.cloneNode(true);
    userMenuBtn.parentNode.replaceChild(newUserMenuBtn, userMenuBtn);

    newUserMenuBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', function closeDropdownOnClick(event) {
      if (!newUserMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
        if (!userDropdown.classList.contains('hidden')) {
          userDropdown.classList.add('hidden');
        }
      }
    }); // Removed { once: true } to ensure it always works if dropdown is reopened.
  } else {
    console.error('User menu button or dropdown not found');
  }

  // Burger menu toggle - Consolidated and definitive logic
  const burgerMenuBtnElement = document.getElementById('burger-menu-btn');
  const mainNav = document.querySelector('.main-nav');

  if (burgerMenuBtnElement && mainNav) {
    const newBurgerBtn = burgerMenuBtnElement.cloneNode(true);
    burgerMenuBtnElement.parentNode.replaceChild(newBurgerBtn, burgerMenuBtnElement);

    const isMobileMode = () => window.innerWidth <= 768;

    const updateAccessibilityAttributes = () => {
      const isActive = mainNav.classList.contains('active');
      mainNav.setAttribute('aria-hidden', String(!isActive));
      if (isMobileMode()) {
        mainNav.toggleAttribute('inert', !isActive);
      } else {
        mainNav.removeAttribute('inert');
      }
    };
    
    const closeMenu = () => {
      mainNav.classList.remove('active');
      newBurgerBtn.innerHTML = '<i class="fas fa-bars"></i>';
      newBurgerBtn.setAttribute('aria-label', 'Ouvrir le menu');
      newBurgerBtn.setAttribute('aria-expanded', 'false');
      updateAccessibilityAttributes();
    };

    const openMenu = () => {
      mainNav.classList.add('active');
      newBurgerBtn.innerHTML = '<i class="fas fa-times"></i>';
      newBurgerBtn.setAttribute('aria-label', 'Fermer le menu');
      newBurgerBtn.setAttribute('aria-expanded', 'true');
      updateAccessibilityAttributes();
    };

    newBurgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = mainNav.classList.contains('active');
      if (isActive) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    newBurgerBtn.setAttribute('aria-label', 'Ouvrir le menu');
    newBurgerBtn.setAttribute('aria-expanded', 'false');
    updateAccessibilityAttributes(); // Initial state

    const observer = new MutationObserver(updateAccessibilityAttributes);
    observer.observe(mainNav, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', () => {
      updateAccessibilityAttributes(); // Always update accessibility on resize
      if (!isMobileMode() && mainNav.classList.contains('active')) {
        closeMenu(); // Close menu if resizing to desktop and it's open
      }
    });

    const navLinksInMenu = mainNav.querySelectorAll('.nav-btn');
    navLinksInMenu.forEach(link => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('active')) {
          closeMenu();
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (mainNav.classList.contains('active') &&
          !mainNav.contains(event.target) &&
          !newBurgerBtn.contains(event.target)) {
        closeMenu();
      }
    });
  } else {
    console.error('Burger menu button (#burger-menu-btn) or main nav (.main-nav) not found in setupNavigation.');
  }
}

/**
 * Show a specific view and hide others
 * @param {string} viewId - ID of the view to show
 */
function showView(viewId) {
  console.log(`Showing view: ${viewId}`);
  localStorage.setItem('lastActiveView', viewId); // Store the current view

  // If the new view is NOT group-details, clear the stored group ID
  if (viewId !== 'group-details') {
    localStorage.removeItem('lastActiveGroupId');
  }

  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.classList.remove('active');
  });
  
  const targetView = document.getElementById(`${viewId}-view`);
  if (!targetView && viewId === 'hero') {
    const heroSection = document.getElementById('hero-section');
    if(heroSection) {
      heroSection.classList.add('active');
      heroSection.style.display = 'block';
    }
    return;
  }
  
  if (targetView) {
    targetView.classList.add('active');
    if(viewId === 'hero') {
      targetView.style.display = 'block';
    }
  } else {
    console.error(`View ${viewId}-view not found`);
    return;
  }
  
  // Update active state of navigation buttons
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  const activeButton = document.getElementById(`${viewId}-btn`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
    // Refresh data for the view
  if (viewId === 'dashboard') {
    loadDashboard();
  } else if (viewId === 'groups') {
    loadGroups();
  } else if (viewId === 'profile') {
    if (window.profileManager) {
      window.profileManager.showProfile();
    }
  } else if (viewId === 'settings') {
    loadSettings();
  }
}

/**
 * Set up modal functionality
 */

// Amélioration de l'expérience mobile
function setupMobileEnhancements() {
  // Détection de touch
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
  }
  
  // Amélioration des modales sur mobile
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      // Empêcher le scroll du body quand une modale est ouverte
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            if (modal.style.display === 'block') {
              document.body.style.overflow = 'hidden';
            } else {
              document.body.style.overflow = '';
            }
          }
        });
      });
      
      observer.observe(modal, { attributes: true });
    }
  });
  
  // Optimisation du calendrier sur mobile
  const calendar = document.querySelector('.calendar');
  if (calendar && isTouchDevice) {
    calendar.addEventListener('touchstart', (e) => {
      // Améliorer la réactivité tactile
      const target = e.target.closest('.calendar-day');
      if (target) {
        target.style.transform = 'scale(0.95)';
      }
    });
    
    calendar.addEventListener('touchend', (e) => {
      const target = e.target.closest('.calendar-day');
      if (target) {
        setTimeout(() => {
          target.style.transform = '';
        }, 150);
      }
    });
  }
  
  // Gestion du viewport sur iOS
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
}

// Optimisation des performances pour mobile
function optimizeForMobile() {
  // Lazy loading pour les images d'avatar si présentes
  const avatarImages = document.querySelectorAll('img[src*="avatar"], .avatar img');
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    
    avatarImages.forEach(img => imageObserver.observe(img));
  }
  
  // Debounce pour les événements de redimensionnement
  let resizeTimeout;
  const originalResize = window.onresize;
  window.onresize = function(e) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (originalResize) originalResize.call(this, e);
    }, 100);
  };
}

// Gestion des erreurs de connectivité sur mobile
function setupOfflineHandling() {
  window.addEventListener('online', () => {
    const offlineMessage = document.querySelector('.offline-message');
    if (offlineMessage) {
      offlineMessage.remove();
    }
    
    // Reprendre les opérations en attente si nécessaire
    console.log('Connexion rétablie');
  });
  
  window.addEventListener('offline', () => {
    const existingMessage = document.querySelector('.offline-message');
    if (!existingMessage) {
      const offlineDiv = document.createElement('div');
      offlineDiv.className = 'offline-message';
      offlineDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--error-color);
        color: white;
        text-align: center;
        padding: 0.5rem;
        z-index: 10000;
        font-size: 0.9rem;
      `;
      offlineDiv.textContent = 'Connexion Internet indisponible';
      document.body.appendChild(offlineDiv);
    }
  });
}

// Initialize the app with all enhancements
async function initializeApp() {
  setupThemeSwitcher();
  setupMobileEnhancements(); // Burger logic removed from here
  optimizeForMobile();
  setupOfflineHandling();
  // enhanceBurgerMenu(); // Call removed

  console.log("Initializing authenticated app");

  // Initialize global instances - ensure DataManager is first if others depend on its instance
  if (!window.toastManager) window.toastManager = new ToastManager();
  // Ensure DataManager class is available (e.g., from data-manager.js)
  if (typeof DataManager !== 'undefined' && !window.dataManager) {
    window.dataManager = new DataManager(); // Create DataManager instance
    console.log("DataManager instance created in initializeApp");
  } else if (!window.dataManager) {
    console.error("DataManager class not found, cannot initialize data-dependent parts of the app.");
    if(window.toastManager) window.toastManager.error("Erreur critique", "Composant de données manquant.");
    return; // Stop initialization if DataManager cannot be created
  }

  // These need window.dataManager to be an instance
  if (typeof ProfileManager !== 'undefined' && !window.profileManager) {
    window.profileManager = new ProfileManager(window.dataManager, window.toastManager);
  }
  
  // Calendar instance needs dataManager, but its init() might need loaded data
  let calendar;
  if (typeof Calendar !== 'undefined') {
    calendar = new Calendar(window.dataManager);
  } else {
    console.warn("Calendar class not found.");
  }

  // Set up navigation and modals (structural UI, may not need data yet)
  setupNavigation();
  setupModals();

  try {
    console.log("initializeApp: Calling dataManager.loadData()");
    await window.dataManager.loadData(); // Load all essential data (user, groups, birthdays, settings)
    console.log("initializeApp: dataManager.loadData() successful. User:", window.dataManager.getCurrentUser() ? window.dataManager.getCurrentUser().username : 'N/A');

    // Now that data is loaded, initialize components/views that depend on it
    if (window.notificationManager && typeof window.notificationManager.init === 'function') {
      notificationManager.init(); 
    }
    if (calendar && typeof calendar.init === 'function') {
      calendar.init(); // Initialize calendar after data is available
    }
    // Ensure UI reflects group availability (for Add birthday button)
    if (typeof updateAddBirthdayButtonsState === 'function') {
      updateAddBirthdayButtonsState();
    }

    // Load initial view: restore last active view or default to dashboard
    const lastViewId = localStorage.getItem('lastActiveView');
    const lastGroupId = localStorage.getItem('lastActiveGroupId');
    const validMainViews = ['dashboard', 'groups', 'profile', 'settings'];

    // Si l'utilisateur n'est pas connecté, afficher la section hero
    if (!dataManager.getCurrentUser()) {
      showView('hero');
      return;
    }

    if (lastViewId === 'group-details' && lastGroupId && document.getElementById('group-details-view')) {
      console.log(`Restoring last active group view: ${lastViewId} with groupId: ${lastGroupId}`);
      // openGroupDetails will call showView('group-details') internally
      await openGroupDetails(lastGroupId); 
    } else if (lastViewId && validMainViews.includes(lastViewId) && document.getElementById(`${lastViewId}-view`)) {
      console.log(`Restoring last active main view: ${lastViewId}`);
      showView(lastViewId);
    } else {
      if (lastViewId) {
        console.log(`Last view '${lastViewId}' (or groupId '${lastGroupId}') is invalid or element not found, defaulting to dashboard.`);
      } else {
        console.log('No last active view found, defaulting to dashboard.');
      }
      showView('dashboard');
    }
    // If other data needs to be pre-loaded for inactive views, uncomment these:
    // loadGroups(); 
    // loadSettings();

  } catch (error) {
    console.error("Failed to load initial app data in initializeApp:", error);
    if (window.toastManager) {
        window.toastManager.error("Erreur critique", "Impossible de charger les données de l'application. Veuillez actualiser.");
    }
    // App might be in a broken state here. Further error handling might be needed.
  }

  // Check connection status (can run regardless of data load success, but might show errors if API is down)
  checkConnectionStatus();

  // Start periodic connection checks (only if not already started)
  if (!connectionCheckInterval) {
    connectionCheckInterval = setInterval(checkConnectionStatus, 60000); // Every minute
  }

  console.log("App initialized (async part completed or error handled)");
}

// Helper: return true if there is at least one group
function hasAtLeastOneGroup() {
  const groups = (window.dataManager && window.dataManager.data && Array.isArray(window.dataManager.data.groups))
    ? window.dataManager.data.groups
    : [];
  return groups.length > 0;
}

// Helper: show a prompt guiding user to Groups view
function promptCreateGroupFirst() {
  if (window.toastManager && typeof window.toastManager.confirm === 'function') {
    window.toastManager.confirm({
      title: "Créez un groupe d'abord",
      text: "Vous devez créer ou rejoindre un groupe avant d'ajouter un anniversaire.",
      icon: 'info',
      confirmButtonText: 'Aller aux groupes',
      cancelButtonText: 'Annuler'
    }).then((confirmed) => {
      if (confirmed) showView('groups');
    });
  } else {
    if (confirm("Vous devez créer ou rejoindre un groupe avant d'ajouter un anniversaire. Aller aux groupes ?")) {
      showView('groups');
    }
  }
}

// Helper: toggle Add birthday actions based on groups availability
function updateAddBirthdayButtonsState() {
  const hasGroups = hasAtLeastOneGroup();
  const addBirthdayBtn = document.getElementById('add-birthday-btn');
  if (addBirthdayBtn) {
    addBirthdayBtn.style.display = hasGroups ? '' : 'none';
  }
  const addGroupBirthdayBtn = document.getElementById('add-group-birthday-btn');
  if (addGroupBirthdayBtn) {
    addGroupBirthdayBtn.disabled = !hasGroups;
    addGroupBirthdayBtn.title = hasGroups ? '' : "Créez ou rejoignez un groupe d'abord";
  }
}

function setupModals() {
  console.log("Setting up modals");
  
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) {
    console.error("Modal overlay not found");
    return;
  }
  
  // Birthday modal
  const birthdayModal = document.getElementById('birthday-modal');
  const closeBirthdayModal = document.getElementById('close-birthday-modal');
  const cancelBirthdayBtn = document.getElementById('cancel-birthday-btn');
  const addBirthdayBtn = document.getElementById('add-birthday-btn');
  const birthdayForm = document.getElementById('birthday-form');
  
  if (addBirthdayBtn) {
    addBirthdayBtn.addEventListener('click', () => {
      if (!hasAtLeastOneGroup()) {
        promptCreateGroupFirst();
        return;
      }
      openBirthdayModal();
    });
  }
  
  const addGroupBirthdayBtn = document.getElementById('add-group-birthday-btn');
  if (addGroupBirthdayBtn) {
    addGroupBirthdayBtn.addEventListener('click', () => {
      if (!hasAtLeastOneGroup()) {
        promptCreateGroupFirst();
        return;
      }
      const groupDetailsView = document.getElementById('group-details-view');
      if (groupDetailsView && groupDetailsView.dataset.groupId) {
        openBirthdayModal(null, groupDetailsView.dataset.groupId);
      }
    });
  }
  
  if (closeBirthdayModal && birthdayModal) {
    closeBirthdayModal.addEventListener('click', () => {
      birthdayModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
  
  if (cancelBirthdayBtn && birthdayModal) {
    cancelBirthdayBtn.addEventListener('click', () => {
      birthdayModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
  
  if (birthdayForm) {
    birthdayForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBirthday();
    });
  }
  
  // Group modal
  const groupModal = document.getElementById('group-modal');
  const closeGroupModal = document.getElementById('close-group-modal');
  const cancelGroupBtn = document.getElementById('cancel-group-btn');
  const addGroupBtn = document.getElementById('add-group-btn');
  const groupForm = document.getElementById('group-form');
  
  if (addGroupBtn) {
    addGroupBtn.addEventListener('click', () => {
      openGroupModal();
    });
  }
  
  if (closeGroupModal && groupModal) {
    closeGroupModal.addEventListener('click', () => {
      groupModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
  
  if (cancelGroupBtn && groupModal) {
    cancelGroupBtn.addEventListener('click', () => {
      groupModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
  
  if (groupForm) {
    groupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveGroup();
    });
  }
  
  // Notification modal
  const notificationModal = document.getElementById('notification-modal');
  const closeNotificationModal = document.getElementById('close-notification-modal');
  const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
  
  if (closeNotificationModal && notificationModal) {
    closeNotificationModal.addEventListener('click', () => {
      notificationModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
    if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', async () => {
      try {
        const confirmed = await window.toastManager.confirm({
          title: 'Effacer toutes les notifications',
          text: 'Êtes-vous sûr de vouloir supprimer toutes les notifications ? Cette action est irréversible.',
          icon: 'warning'
        });
        
        if (confirmed) {
          await dataManager.clearNotifications();
          notificationManager.updateNotificationBadge();
          loadNotifications();
          window.toastManager.success('Notifications effacées', 'Toutes les notifications ont été supprimées');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression des notifications:', error);
        window.toastManager.error('Erreur', 'Impossible de supprimer les notifications');
      }
    });
  }
  
  // Confirmation modal
  const confirmModal = document.getElementById('confirm-modal');
  const closeConfirmModal = document.getElementById('close-confirm-modal');
  const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
  
  if (closeConfirmModal && confirmModal) {
    closeConfirmModal.addEventListener('click', () => {
      confirmModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
  
  if (cancelConfirmBtn && confirmModal) {
    cancelConfirmBtn.addEventListener('click', () => {
      confirmModal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    });
  }
  
  // Edit group button
  const editGroupBtn = document.getElementById('edit-group-btn');
  if (editGroupBtn) {
    editGroupBtn.addEventListener('click', () => {
      const groupDetailsView = document.getElementById('group-details-view');
      if (groupDetailsView && groupDetailsView.dataset.groupId) {
        const group = dataManager.getGroupById(groupDetailsView.dataset.groupId);
        if (group) {
          openGroupModal(group);
        }
      }
    });
  }
  
  // Delete group button
  const deleteGroupBtn = document.getElementById('delete-group-btn');
  if (deleteGroupBtn) {
    deleteGroupBtn.addEventListener('click', () => {
      const groupDetailsView = document.getElementById('group-details-view');
      if (groupDetailsView && groupDetailsView.dataset.groupId) {
        openConfirmModal(
          'Supprimer le groupe',
          'Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.',
          () => {
            dataManager.deleteGroup(groupDetailsView.dataset.groupId);
            showView('groups');
          }
        );
      }
    });
  }
    // Settings
  const notificationDaysSelect = document.getElementById('notification-days');
  if (notificationDaysSelect) {
    notificationDaysSelect.addEventListener('change', async (e) => {
      const selectedValue = parseInt(e.target.value);
      const originalValue = dataManager.data.settings.notificationDays; // Store original value before attempting update
      console.log(`[Settings] Notification days dropdown changed. User selected: ${selectedValue}`);

      try {
        const payload = { notification_days: selectedValue };
        console.log('[Settings] Attempting to update settings with payload:', payload);

        await dataManager.updateSettings(payload);
        window.toastManager.success('Paramètres mis à jour', 'Délai de notification modifié avec succès.');
        console.log('[Settings] Notification days settings updated successfully.');
        // Update the local settings cache upon successful update
        if (dataManager.data.settings) {
            dataManager.data.settings.notificationDays = selectedValue;
        }

      } catch (error) {
        console.error('[Settings] Error updating notification days settings:', error);
        if (window.toastManager && typeof window.toastManager.error === 'function') {
            window.toastManager.error('Erreur de mise à jour', 'Impossible de mettre à jour le délai de notification. Le backend a retourné une erreur.');
        } else {
            alert('Erreur: Impossible de mettre à jour le délai de notification.');
        }
        // Revert select to its original value on error
        e.target.value = originalValue;
        console.log(`[Settings] Reverted notification days dropdown to ${originalValue} due to error.`);
      }
    });
  }
  
  const enableNotificationsCheckbox = document.getElementById('enable-notifications');
  if (enableNotificationsCheckbox) {
    enableNotificationsCheckbox.addEventListener('change', async (e) => {
      console.log('[Settings] System notifications checkbox changed. User action set checked to:', e.target.checked);
      const intendedValue = e.target.checked; // The value the user wants to set

      try {
        const payload = { system_notifications_enabled: intendedValue };
        console.log('[Settings] Attempting to update settings with payload:', payload);

        await dataManager.updateSettings(payload);
        
        const status = intendedValue ? 'activées' : 'désactivées';
        window.toastManager.success('Paramètres mis à jour', `Notifications système ${status} avec succès.`);
        console.log('[Settings] System notifications settings updated successfully.');

      } catch (error) {
        console.error('[Settings] Error updating system notification settings:', error);
        // Attempt to show a more specific error
        if (window.toastManager && typeof window.toastManager.error === 'function') {
            window.toastManager.error('Erreur de mise à jour', 'Impossible de mettre à jour les paramètres des notifications système. Le backend a retourné une erreur.');
        } else {
            // Fallback if toastManager is unavailable or its error function fails
            alert('Erreur: Impossible de mettre à jour les paramètres des notifications système.');
        }
        
        // Revert checkbox to its state *before* this attempt.
        // If user tried to check it (intendedValue = true), and it failed, uncheck it (set to false).
        // If user tried to uncheck it (intendedValue = false), and it failed, check it back (set to true).
        e.target.checked = !intendedValue; 
        console.log('[Settings] Reverted checkbox state for system notifications due to error. Now:', e.target.checked);
      }
    });
  }
  
  // Request notification permission button
  const requestNotificationPermissionBtn = document.getElementById('request-notification-permission');
  if (requestNotificationPermissionBtn) {
    requestNotificationPermissionBtn.addEventListener('click', () => {
      notificationManager.requestNotificationPermission().then(permission => {
        if (permission === 'granted') {
          requestNotificationPermissionBtn.textContent = 'Notifications autorisées';
          requestNotificationPermissionBtn.disabled = true;
        } else if (permission === 'denied') {
          requestNotificationPermissionBtn.textContent = 'Notifications bloquées';
        }
      });
    });
    
    // Update button state based on current permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        requestNotificationPermissionBtn.textContent = 'Notifications autorisées';
        requestNotificationPermissionBtn.disabled = true;
      } else if (Notification.permission === 'denied') {
        requestNotificationPermissionBtn.textContent = 'Notifications bloquées';
      }
    } else {
      requestNotificationPermissionBtn.textContent = 'Non supporté';
      requestNotificationPermissionBtn.disabled = true;
    }
  }
  
  const exportDataBtn = document.getElementById('export-data-btn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      dataManager.exportData();
    });
  }
  
  const importDataBtn = document.getElementById('import-data-btn');
  const importFileInput = document.getElementById('import-file');
  
  if (importDataBtn && importFileInput) {
    importDataBtn.addEventListener('click', () => {
      importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {        dataManager.importData(file)
          .then(() => {
            window.toastManager.success('Import réussi', 'Données importées avec succès !');
            loadDashboard();
            loadGroups();
            loadSettings();
            notificationManager.updateNotificationBadge();
          })
          .catch(error => {
            window.toastManager.error('Erreur d\'import', `Erreur lors de l'importation : ${error.message}`);
          });
      }
    });
  }
  
  // Test email reminders button
  const testEmailRemindersBtn = document.getElementById('test-email-reminders-btn');
  if (testEmailRemindersBtn) {
    testEmailRemindersBtn.addEventListener('click', async () => {
      const originalText = testEmailRemindersBtn.innerHTML;
      
      try {
        // Show loading state
        testEmailRemindersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Test en cours...';
        testEmailRemindersBtn.disabled = true;
        
        // Call the test reminders API
        const sessionToken = localStorage.getItem('session_token');
        if (!sessionToken) {
          throw new Error('Session expirée');
        }
        
        const response = await fetch('https://rappelanniv.aaweb.fr/api/test_reminders.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_token: sessionToken })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du test des rappels');
        }
        
        // Show success message with results
        const message = `Script exécuté avec succès !<br><strong>${data.emails_sent}</strong> email(s) envoyé(s)`;
        window.toastManager.success('Test terminé', message, { timer: 5000, allowHtml: true });
        
        console.log('Test reminders output:', data.output);
        
      } catch (error) {
        console.error('Error testing email reminders:', error);
        window.toastManager.error('Erreur', `Impossible de tester les rappels: ${error.message}`);
      } finally {
        // Restore button state
        testEmailRemindersBtn.innerHTML = originalText;
        testEmailRemindersBtn.disabled = false;
      }
    });
  }
  
  // Join group functionality
  const joinGroupBtn = document.getElementById('join-group-btn');
  const joinGroupSubmit = document.getElementById('join-group-submit');
  const accessCodeInput = document.getElementById('access-code-input');
  
  if (joinGroupBtn && accessCodeInput) {
    joinGroupBtn.addEventListener('click', () => {
      const joinSection = document.querySelector('.join-group-section');
      if (joinSection) {
        joinSection.scrollIntoView({ behavior: 'smooth' });
        accessCodeInput.focus();
      }
    });
  }
  
  if (joinGroupSubmit && accessCodeInput) {
    joinGroupSubmit.addEventListener('click', async () => {      const accessCode = accessCodeInput.value.trim();
      if (!accessCode) {
        toast.error('Veuillez entrer un code d\'accès');
        return;
      }
      
      try {
        joinGroupSubmit.disabled = true;
        joinGroupSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rejoindre...';
          const joinedGroup = await dataManager.joinGroup(accessCode);
        if (joinedGroup) {
          accessCodeInput.value = '';
          toast.success(`Vous avez rejoint le groupe "${joinedGroup.name}" avec succès !`);
          loadGroups();
        }      } catch (error) {
        console.error('Erreur lors de la jointure du groupe:', error);
        toast.error('Erreur: ' + error.message);
      } finally {
        joinGroupSubmit.disabled = false;
        joinGroupSubmit.innerHTML = 'Rejoindre';
      }
    });
    
    accessCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinGroupSubmit.click();
      }
    });
  }
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
  console.log("Loading dashboard");
  // Reflect groups availability in UI
  updateAddBirthdayButtonsState();
  
  // Refresh birthday data from API first
  await window.dataManager.getBirthdays();
  
  // Load upcoming birthdays
  const upcomingBirthdays = window.dataManager.getUpcomingBirthdays();
  const upcomingBirthdaysList = document.getElementById('upcoming-birthdays-list');
  
  if (!upcomingBirthdaysList) {
    console.error("Upcoming birthdays list element not found");
    return;
  }
  
  if (upcomingBirthdays.length === 0) {
    upcomingBirthdaysList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-day"></i>
        <p>Aucun anniversaire à venir</p>
      </div>
    `;
    return;
  }
  
  upcomingBirthdaysList.innerHTML = '';
  
  for (const birthday of upcomingBirthdays) {
    const birthdayDate = new Date(birthday.date);
    const age = window.dataManager.calculateAge(birthday.date) + (birthday.daysUntil > 0 ? 1 : 0);
    
    // Get the group if available
    let groupName = '';
    let groupColor = '';
    if (birthday.groupId) {
      const group = window.dataManager.getGroupById(birthday.groupId);
      if (group) {
        groupName = group.name;
        groupColor = group.color;
      }
    }
    
    const birthdayCard = document.createElement('div');
    birthdayCard.className = 'birthday-card';
    if (groupColor) {
      birthdayCard.style.borderLeftColor = groupColor;
    }
    
    let daysText;
    if (birthday.daysUntil === 0) {
      daysText = 'Aujourd\'hui';
    } else if (birthday.daysUntil === 1) {
      daysText = 'Demain';
    } else {
      daysText = `Dans ${birthday.daysUntil} jours`;
    }
    
    birthdayCard.innerHTML = `
      <div class="birthday-card-header">
        <span class="birthday-card-name">${birthday.name}</span>
        <span class="birthday-card-date">${daysText}</span>
      </div>
      <div>
        <span>Aura ${age} ans</span>
        ${groupName ? `<span class="birthday-card-group">${groupName}</span>` : ''}
      </div>
      ${birthday.notes ? `<p class="birthday-card-notes">${birthday.notes}</p>` : ''}
      <div class="birthday-card-actions">
        <button class="btn icon-btn edit-birthday" data-id="${birthday.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn icon-btn delete-birthday" data-id="${birthday.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    upcomingBirthdaysList.appendChild(birthdayCard);
  }
  
  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-birthday').forEach(button => {
    button.addEventListener('click', (e) => {
      const birthdayId = e.currentTarget.dataset.id;
      const birthday = window.dataManager.getBirthdayById(birthdayId);
      if (birthday) {
        openBirthdayModal(birthday);
      }
    });
  });
  
  document.querySelectorAll('.delete-birthday').forEach(button => {
    button.addEventListener('click', (e) => {
      const birthdayId = e.currentTarget.dataset.id;
      const birthday = window.dataManager.getBirthdayById(birthdayId);
      if (birthday) {
        openConfirmModal(
          'Supprimer l\'anniversaire',
          `Êtes-vous sûr de vouloir supprimer l'anniversaire de ${birthday.name} ?`,
          () => {
            window.dataManager.deleteBirthday(birthdayId);
            loadDashboard();
          }
        );
      }
    });
  });
}

/**
 * Load groups data
 */
async function loadGroups() {
  console.log("Loading groups");
  // Récupérer les groupes depuis l'API
  await window.dataManager.getGroups();
  // Deduplicate groups in-place in dataManager.data.groups
  const seenIds = new Set();
  window.dataManager.data.groups = window.dataManager.data.groups.filter(group => {
    if (seenIds.has(group.id)) return false;
    seenIds.add(group.id);
    return true;
  });  // Supprimer les doublons par ID (extra safety)
  const uniqueGroups = [];
  const seenIds2 = new Set();
  for (const group of window.dataManager.data.groups) {
    if (!seenIds2.has(group.id)) {
      uniqueGroups.push(group);
      seenIds2.add(group.id);
    }
  }
  const groups = uniqueGroups;
  // Reflect groups availability in UI
  updateAddBirthdayButtonsState();
  const groupsGrid = document.getElementById('groups-grid');
  if (!groupsGrid) {
    console.error("Groups grid element not found");
    return;
  }
  if (groups.length === 0) {
    groupsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>Aucun groupe trouvé</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Créez votre premier groupe ou rejoignez-en un avec un code d'accès</p>
      </div>
    `;
    return;
  }
  groupsGrid.innerHTML = ''; // Clear existing content
  for (const group of groups) {
    const birthdays = await dataManager.getBirthdaysByGroup(group.id);
    const upcomingBirthdays = dataManager.getUpcomingBirthdays().filter(b => b.groupId === group.id);
    let nextBirthdayText = 'Aucun anniversaire à venir';
    if (upcomingBirthdays.length > 0) {
      const nextBirthday = upcomingBirthdays[0];
      if (nextBirthday.daysUntil === 0) {
        nextBirthdayText = `${nextBirthday.name} aujourd'hui !`;
      } else if (nextBirthday.daysUntil === 1) {
        nextBirthdayText = `${nextBirthday.name} demain`;
      } else {
        nextBirthdayText = `${nextBirthday.name} dans ${nextBirthday.daysUntil} jours`;
      }
    }
    const groupCard = document.createElement('div');
    groupCard.className = 'group-item-card'; // Changed class name
    groupCard.style.setProperty('--group-color', group.color || 'var(--primary-color)'); // Use CSS variable for border
    groupCard.innerHTML = `
      <div class="group-item-card-header">
        <h3 class="group-item-card-name">${group.name}</h3>
        <span class="group-item-card-count">
          <i class="fas fa-users"></i> ${birthdays.length}
        </span>
      </div>
      ${group.description ? `<p class="group-item-card-description">${group.description}</p>` : '<p class="group-item-card-description"><em>Aucune description</em></p>'}
      <div class="group-item-card-footer">
        <span class="group-item-card-next">
          <i class="fas fa-birthday-cake"></i> ${nextBirthdayText}
        </span>
        <button class="btn icon-btn view-group-btn" title="Voir le groupe">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    `;
    groupCard.addEventListener('click', (event) => {
      // Prevent opening group details if a button inside the card was clicked
      if (event.target.closest('.view-group-btn')) {
        openGroupDetails(group.id);
      } else if (!event.target.closest('button')) { // Allow clicking anywhere else on the card
         openGroupDetails(group.id);
      }
    });
    groupsGrid.appendChild(groupCard);
  }
}

/**
 * Open group details view
 * @param {string} groupId - Group ID
 */
async function openGroupDetails(groupId) {
  console.log(`Opening group details for ${groupId}`);
  localStorage.setItem('lastActiveGroupId', groupId); // Store current group ID
  
  const group = dataManager.getGroupById(groupId);
  if (!group) {
    console.error(`Group with ID ${groupId} not found`);
    return;
  }
  
  const groupDetailsView = document.getElementById('group-details-view');
  if (!groupDetailsView) {
    console.error("Group details view not found");
    return;
  }
  
  groupDetailsView.dataset.groupId = groupId;
    const groupNameElement = document.getElementById('group-name');
  if (groupNameElement) {
    groupNameElement.textContent = group.name;
  }
  
  // Show access code if available
  const groupActions = document.querySelector('#group-details-view .group-actions');
  if (group.access_code && groupActions) {
    // Remove any existing access code display
    let existingAccessCode = groupActions.querySelector('.access-code-display');
    if (existingAccessCode) {
      existingAccessCode.remove();
    }
    
    // Add access code display
    const accessCodeDisplay = document.createElement('div');
    accessCodeDisplay.className = 'access-code-display';
    accessCodeDisplay.innerHTML = `
      <span class="access-code-label">Code d'accès:</span>
      <span class="access-code-value">${group.access_code}</span>
      <button class="btn icon-btn copy-access-code" title="Copier le code">
        <i class="fas fa-copy"></i>
      </button>
    `;
    
    groupActions.insertBefore(accessCodeDisplay, groupActions.firstChild);
    
    // Add copy functionality
    const copyBtn = accessCodeDisplay.querySelector('.copy-access-code');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(group.access_code).then(() => {
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      });
    });
  } else if (groupActions) {
    // Ensure no old access code is shown if current group doesn't have one
    let existingAccessCode = groupActions.querySelector('.access-code-display');
    if (existingAccessCode) {
      existingAccessCode.remove();
    }
  }

  // Load members for this group
  const membersList = document.getElementById('group-members-list');
  if (!membersList) {
    console.error("Group members list not found");
  } else {
    const members = await dataManager.getUsersByGroup(groupId); 
    membersList.innerHTML = ''; // Clear existing members
    if (members.length === 0) {
      membersList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-friends"></i>
          <p>Aucun membre dans ce groupe pour le moment.</p>
        </div>
      `;
    } else {
      // 'group' is already fetched at the beginning of openGroupDetails function
      members.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        
        let displayName = member.username || 'Utilisateur'; // API provides username
        
        // Check if this member is the owner of the group
        if (group && member.id === group.owner_id) {
          displayName += ' (Propriétaire)';
        }
        
        memberItem.innerHTML = `
          <i class="fas fa-user"></i> 
          <span class="member-name">${displayName}</span>
        `;
        membersList.appendChild(memberItem);
      });
    }
  }
  
  // Load birthdays for this group
  const birthdays = await dataManager.getBirthdaysByGroup(groupId);
  const birthdaysList = document.getElementById('group-birthdays-list');
  
  if (!birthdaysList) {
    console.error("Group birthdays list not found");
    return;
  }
  
  if (birthdays.length === 0) {
    birthdaysList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-day"></i>
        <p>Aucun anniversaire dans ce groupe</p>
      </div>
    `;
  } else {
    birthdaysList.innerHTML = '';
    
    // Sort birthdays by month and day
    birthdays.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getMonth() !== dateB.getMonth()) {
        return dateA.getMonth() - dateB.getMonth();
      }
      
      return dateA.getDate() - dateB.getDate();
    });
    
    for (const birthday of birthdays) {
      const birthdayDate = new Date(birthday.date);
      const age = dataManager.calculateAge(birthday.date);
      
      const birthdayCard = document.createElement('div');
      birthdayCard.className = 'birthday-card';
      birthdayCard.style.borderLeftColor = group.color;
      
      // Format the date
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      const formattedDate = `${birthdayDate.getDate()} ${monthNames[birthdayDate.getMonth()]}`;
      
      birthdayCard.innerHTML = `
        <div class="birthday-card-header">
          <span class="birthday-card-name">${birthday.name}</span>
          <span class="birthday-card-date">${formattedDate}</span>
        </div>
        <div>
          <span>${age} ans</span>
        </div>
        ${birthday.notes ? `<p class="birthday-card-notes">${birthday.notes}</p>` : ''}
        <div class="birthday-card-actions">
          <button class="btn icon-btn edit-birthday" data-id="${birthday.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn icon-btn delete-birthday" data-id="${birthday.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      birthdaysList.appendChild(birthdayCard);
    }
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-birthday').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const birthdayId = e.currentTarget.dataset.id;
        const birthday = dataManager.getBirthdayById(birthdayId);
        if (birthday) {
          openBirthdayModal(birthday);
        }
      });
    });
    
    document.querySelectorAll('.delete-birthday').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const birthdayId = e.currentTarget.dataset.id;
        const birthday = dataManager.getBirthdayById(birthdayId);
        if (birthday) {
          openConfirmModal(
            'Supprimer l\'anniversaire',
            `Êtes-vous sûr de vouloir supprimer l'anniversaire de ${birthday.name} ?`,
            () => {
              dataManager.deleteBirthday(birthdayId);
              openGroupDetails(groupId);
            }
          );
        }
      });
    });
  }
  
  // Show the view
  showView('group-details');
}

/**
 * Load settings
 */
async function loadSettings() {
  console.log("Loading settings");
  
  try {
    // Récupérer les paramètres depuis l'API
    await dataManager.getSettings();
    const settings = dataManager.data.settings;
    
    const notificationDaysSelect = document.getElementById('notification-days');
    if (notificationDaysSelect) {
      notificationDaysSelect.value = settings.notificationDays;
    }
      const enableNotificationsCheckbox = document.getElementById('enable-notifications');
    if (enableNotificationsCheckbox) {
      enableNotificationsCheckbox.checked = settings.systemNotificationsEnabled;
    }
    
    // Update notification permission button state
    const requestNotificationPermissionBtn = document.getElementById('request-notification-permission');
    if (requestNotificationPermissionBtn) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          requestNotificationPermissionBtn.textContent = 'Notifications autorisées';
          requestNotificationPermissionBtn.disabled = true;
          requestNotificationPermissionBtn.classList.add('btn-success');
        } else if (Notification.permission === 'denied') {
          requestNotificationPermissionBtn.textContent = 'Notifications bloquées';
          requestNotificationPermissionBtn.classList.add('btn-danger');
        } else {
          requestNotificationPermissionBtn.textContent = 'Autoriser les notifications';
          requestNotificationPermissionBtn.classList.remove('btn-success', 'btn-danger');
        }
      } else {
        requestNotificationPermissionBtn.textContent = 'Non supporté';
        requestNotificationPermissionBtn.disabled = true;
        requestNotificationPermissionBtn.classList.add('btn-secondary');
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error);
    window.toastManager.error('Erreur', 'Impossible de charger les paramètres');
  }
}

/**
 * Open the birthday modal
 * @param {Object} birthday - Birthday object (null for new birthday)
 * @param {string} defaultGroupId - Default group ID (optional)
 */
function openBirthdayModal(birthday = null, defaultGroupId = null) {
  console.log("Opening birthday modal", birthday, defaultGroupId);
  
  const modalTitle = document.getElementById('birthday-modal-title');
  const birthdayForm = document.getElementById('birthday-form');
  const birthdayId = document.getElementById('birthday-id');
  const birthdayName = document.getElementById('birthday-name');
  const birthdayDate = document.getElementById('birthday-date');
  const birthdayGroup = document.getElementById('birthday-group');
  const birthdayNotes = document.getElementById('birthday-notes');
  
  if (!modalTitle || !birthdayForm || !birthdayId || !birthdayName || !birthdayDate || !birthdayGroup || !birthdayNotes) {
    console.error("Birthday modal elements not found");
    return;
  }
  
  // Set the modal title
  modalTitle.textContent = birthday ? 'Modifier un anniversaire' : 'Ajouter un anniversaire';
  
  // Clear the form
  birthdayForm.reset();
    // Populate the form if editing
  if (birthday) {
    birthdayId.value = birthday.id;
    birthdayName.value = birthday.name;
    birthdayDate.value = birthday.date.split('T')[0]; // Remove time part
    // Handle both groupId (frontend) and group_id (API) formats
    const groupIdValue = birthday.groupId || birthday.group_id || '';
    console.log("💾 [BIRTHDAY MODAL] Birthday group from data:", groupIdValue);
    birthdayNotes.value = birthday.notes || '';
  } else {
    birthdayId.value = '';
  }
  
  // Populate the groups dropdown
  const groups = dataManager.data.groups;
  const groupOptions = groups.map(group => 
    `<option value="${group.id}">${group.name}</option>`
  ).join('');
  
  birthdayGroup.innerHTML = `
    <option value="">Aucun groupe</option>
    ${groupOptions}
  `;
  
  // Set the selected group value AFTER populating the dropdown
  if (defaultGroupId) {
    birthdayGroup.value = defaultGroupId;
    console.log("💾 [BIRTHDAY MODAL] Set group to defaultGroupId:", defaultGroupId);
  } else if (birthday) {
    const groupIdValue = birthday.groupId || birthday.group_id || '';
    birthdayGroup.value = groupIdValue;
    console.log("💾 [BIRTHDAY MODAL] Set group to birthday's group:", groupIdValue);
  }
  
  // Show the modal
  const modalOverlay = document.getElementById('modal-overlay');
  const birthdayModal = document.getElementById('birthday-modal');
  
  if (modalOverlay && birthdayModal) {
    modalOverlay.classList.remove('hidden');
    birthdayModal.classList.remove('hidden');
  }
}

/**
 * Save a birthday
 */
async function saveBirthday() {
  console.log("💾 [SAVE BIRTHDAY] Starting saveBirthday function");
  
  const birthdayId = document.getElementById('birthday-id').value;
  const birthdayName = document.getElementById('birthday-name').value;
  const birthdayDate = document.getElementById('birthday-date').value;
  const birthdayGroup = document.getElementById('birthday-group').value;
  
  console.log("💾 [SAVE BIRTHDAY] Form data extracted:");
  console.log("💾 [SAVE BIRTHDAY] - ID:", birthdayId);
  console.log("💾 [SAVE BIRTHDAY] - Name:", birthdayName);
  console.log("💾 [SAVE BIRTHDAY] - Date:", birthdayDate);
  console.log("💾 [SAVE BIRTHDAY] - Group:", birthdayGroup);
  
  // Validate required fields
  if (!birthdayName.trim()) {
    if (window.toastManager) {
      window.toastManager.error('Validation', 'Le nom est requis');
    }
    return;
  }
  
  if (!birthdayDate) {
    if (window.toastManager) {
      window.toastManager.error('Validation', 'La date d\'anniversaire est requise');
    }
    return;
  }
  
  // Validate date format and that it's a valid date
  const dateObj = new Date(birthdayDate);
  if (isNaN(dateObj.getTime())) {
    if (window.toastManager) {
      window.toastManager.error('Validation', 'Date d\'anniversaire invalide');
    }
    return;
  }
  
  // Check if date is not in the future (birth date should be in the past)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today
  if (dateObj > today) {
    if (window.toastManager) {
      window.toastManager.error('Validation', 'La date d\'anniversaire ne peut pas être dans le futur');
    }
    return;
  }
  
  const birthdayData = {
    name: birthdayName.trim(),
    date: birthdayDate,
    groupId: birthdayGroup,
    notes: document.getElementById('birthday-notes').value.trim()
  };
  
  console.log("💾 [SAVE BIRTHDAY] Final birthday data object:", birthdayData);
  
  try {
    if (birthdayId) {
      // Update existing birthday
      console.log("💾 [SAVE BIRTHDAY] Updating existing birthday with ID:", birthdayId);
      const result = await dataManager.updateBirthday(birthdayId, birthdayData);
      console.log("💾 [SAVE BIRTHDAY] Update result:", result);
    } else {
      // Add new birthday
      console.log("💾 [SAVE BIRTHDAY] Adding new birthday");
      const result = await dataManager.addBirthday(birthdayData);
      console.log("💾 [SAVE BIRTHDAY] Add result:", result);
    }
    
    console.log("💾 [SAVE BIRTHDAY] Birthday operation completed successfully");
    if (window.toastManager) {
      window.toastManager.success('Succès', birthdayId ? 'Anniversaire modifié avec succès' : 'Anniversaire ajouté avec succès');
    }
  } catch (error) {
    console.error("💾 [SAVE BIRTHDAY] Error during birthday operation:", error);
    if (window.toastManager) {
      window.toastManager.error('Erreur', 'Erreur lors de la sauvegarde');
    }
    // Don't hide modal on error so user can try again
    return;
  }
  
  // Hide the modal
  const modalOverlay = document.getElementById('modal-overlay');
  const birthdayModal = document.getElementById('birthday-modal');
  
  if (modalOverlay && birthdayModal) {
    modalOverlay.classList.add('hidden');
    birthdayModal.classList.add('hidden');
  }
  
  // Refresh the views
  loadDashboard();
  
  // If we're in group details view, refresh it
  const groupDetailsView = document.getElementById('group-details-view');
  if (groupDetailsView && groupDetailsView.classList.contains('active') && groupDetailsView.dataset.groupId) {
    openGroupDetails(groupDetailsView.dataset.groupId);
  }
  
  // Check for new notifications
  notificationManager.checkForNotifications();
}

/**
 * Open the group modal
 * @param {Object} group - Group object (null for new group)
 */
function openGroupModal(group = null) {
  console.log("Opening group modal", group);
  
  const modalTitle = document.getElementById('group-modal-title');
  const groupForm = document.getElementById('group-form');
  const groupId = document.getElementById('group-id');
  const groupName = document.getElementById('group-name-input');
  const groupDescription = document.getElementById('group-description');
  const groupColor = document.getElementById('group-color');
  
  if (!modalTitle || !groupForm || !groupId || !groupName || !groupDescription || !groupColor) {
    console.error("Group modal elements not found");
    return;
  }
  
  // Set the modal title
  modalTitle.textContent = group ? 'Modifier un groupe' : 'Ajouter un groupe';
  
  // Clear the form
  groupForm.reset();
  
  // Populate the form if editing
  if (group) {
    groupId.value = group.id;
    groupName.value = group.name;
    groupDescription.value = group.description || '';
    groupColor.value = group.color || '#4361ee';
  } else {
    groupId.value = '';
    groupColor.value = '#4361ee';
  }
  
  // Show the modal
  const modalOverlay = document.getElementById('modal-overlay');
  const groupModal = document.getElementById('group-modal');
  
  if (modalOverlay && groupModal) {
    modalOverlay.classList.remove('hidden');
    groupModal.classList.remove('hidden');
  }
}

/**
 * Save a group
 */
async function saveGroup() {
  console.log("Saving group");
  
  const groupId = document.getElementById('group-id').value;
  const groupName = document.getElementById('group-name-input').value;
  const groupDescription = document.getElementById('group-description').value;
  const groupColor = document.getElementById('group-color').value;
  
  const groupData = {
    name: groupName,
    description: groupDescription,
    color: groupColor
  };
  
  console.log("Group data to save:", groupData);
  console.log("Group ID:", groupId);
  
  try {
    if (groupId) {
      // Update existing group
      console.log("Updating existing group with ID:", groupId);
      await dataManager.updateGroup(groupId, groupData);
      window.toastManager.success('Groupe modifié', 'Le groupe a été modifié avec succès');
    } else {
      // Add new group
      console.log("Adding new group");
      await dataManager.addGroup(groupData);
      window.toastManager.success('Groupe créé', 'Le groupe a été créé avec succès');
    }
    
    // Hide the modal
    const modalOverlay = document.getElementById('modal-overlay');
    const groupModal = document.getElementById('group-modal');
    
    if (modalOverlay && groupModal) {
      modalOverlay.classList.add('hidden');
      groupModal.classList.add('hidden');
    }
    
    // Refresh the groups view
    loadGroups();
    
    // If we're in group details view and editing, refresh it
    const groupDetailsView = document.getElementById('group-details-view');
    if (groupDetailsView && groupDetailsView.classList.contains('active') && groupDetailsView.dataset.groupId && groupId) {
      openGroupDetails(groupId);
    }
    
  } catch (error) {
    console.error('Error saving group:', error);
    window.toastManager.error('Erreur', 'Impossible de sauvegarder le groupe');
  }
}

/**
 * Open confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback function for confirmation
 */
function openConfirmModal(title, message, onConfirm) {
  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmBtn = document.getElementById('confirm-action-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  
  if (!confirmModal || !confirmTitle || !confirmMessage || !confirmBtn || !modalOverlay) {
    console.error("Confirm modal elements not found");
    return;
  }
  
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  
  // Remove existing event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  // Add new event listener
  newConfirmBtn.addEventListener('click', () => {
    onConfirm();
    confirmModal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
  });
  
  // Show the modal
  modalOverlay.classList.remove('hidden');
  confirmModal.classList.remove('hidden');
}

/**
 * Show notification center
 */
function showNotificationCenter() {
  const notificationModal = document.getElementById('notification-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  
  if (!notificationModal || !modalOverlay) {
    console.error("Notification modal elements not found");
    return;
  }
  
  // Load notifications
  loadNotifications();
  
  // Show the modal
  modalOverlay.classList.remove('hidden');
  notificationModal.classList.remove('hidden');
}

/**
 * Load notifications
 */
async function loadNotifications() {
  try {
    await dataManager.getNotifications();
    const notifications = dataManager.data.notifications;
    const notificationsList = document.getElementById('notifications-list');
    
    if (!notificationsList) {
      console.error("Notifications list element not found");
      return;
    }
    
    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell"></i>
          <p>Aucune notification</p>
        </div>
      `;
      return;
    }
    
    notificationsList.innerHTML = '';
    
    for (const notification of notifications) {
      const notificationItem = document.createElement('div');
      notificationItem.className = 'notification-item';
      
      // Handle both 'read' and 'is_read' field names
      const isRead = notification.read !== undefined ? notification.read : (notification.is_read || false);
      if (!isRead) {
        notificationItem.classList.add('unread');
      }
      
      // Handle both createdAt (from API) and created_at (legacy) field names
      const dateField = notification.createdAt || notification.created_at || new Date().toISOString();
      const notificationDate = new Date(dateField);
      
      // Check if the date is valid
      let formattedDate;
      if (isNaN(notificationDate.getTime())) {
        console.warn(`Invalid notification date: ${dateField}`);
        formattedDate = 'Date invalide';
      } else {
        formattedDate = notificationDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      notificationItem.innerHTML = `
        <div class="notification-header">
          <span class="notification-title">${notification.title}</span>
          <span class="notification-date">${formattedDate}</span>
        </div>
        <p class="notification-message">${notification.message}</p>
        ${!isRead ? '<div class="notification-unread-indicator"></div>' : ''}
      `;
      
      // Mark as read when clicked
      notificationItem.addEventListener('click', async () => {
        if (!isRead) {
          await dataManager.markNotificationAsRead(notification.id);
          notificationItem.classList.remove('unread');
          notificationManager.updateNotificationBadge();
        }
      });
      
      notificationsList.appendChild(notificationItem);
    }
    
  } catch (error) {
    console.error('Error loading notifications:', error);
    const notificationsList = document.getElementById('notifications-list');
    if (notificationsList) {
      notificationsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erreur lors du chargement des notifications</p>
        </div>
      `;
    }
  }
}