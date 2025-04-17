/**
 * Main application logic for Birthday Reminder App
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded");
  
  // Initialize the notification manager
  notificationManager.init();
  
  // Initialize the calendar
  const calendar = new Calendar(dataManager);
  calendar.init();
  
  // Set up navigation
  setupNavigation();
  
  // Set up modals
  setupModals();
  
  // Load initial data
  loadDashboard();
  loadGroups();
  loadSettings();
  
  // Check connection status
  checkConnectionStatus();
  
  console.log("App initialized");
});

/**
 * Check connection to the API
 */
function checkConnectionStatus() {
  const connectionStatus = document.getElementById('connection-status');
  if (!connectionStatus) return;
  
  fetch('api/settings.php')
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
  
  // Vérifier périodiquement la connexion
  setInterval(checkConnectionStatus, 60000); // Toutes les minutes
}

/**
 * Set up navigation between views
 */
function setupNavigation() {
  console.log("Setting up navigation");
  
  const navButtons = {
    'dashboard-btn': 'dashboard',
    'groups-btn': 'groups',
    'settings-btn': 'settings'
  };
  
  // Set up click handlers for navigation buttons
  for (const [buttonId, viewId] of Object.entries(navButtons)) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        console.log(`Navigating to ${viewId}`);
        showView(viewId);
      });
    } else {
      console.error(`Button ${buttonId} not found`);
    }
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
}

/**
 * Show a specific view and hide others
 * @param {string} viewId - ID of the view to show
 */
function showView(viewId) {
  console.log(`Showing view: ${viewId}`);
  
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.classList.remove('active');
  });
  
  const targetView = document.getElementById(`${viewId}-view`);
  if (targetView) {
    targetView.classList.add('active');
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
  } else if (viewId === 'settings') {
    loadSettings();
  }
}

/**
 * Set up modal functionality
 */
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
      openBirthdayModal();
    });
  }
  
  const addGroupBirthdayBtn = document.getElementById('add-group-birthday-btn');
  if (addGroupBirthdayBtn) {
    addGroupBirthdayBtn.addEventListener('click', () => {
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
    clearNotificationsBtn.addEventListener('click', () => {
      dataManager.clearNotifications();
      notificationManager.updateNotificationBadge();
      loadNotifications();
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
    notificationDaysSelect.addEventListener('change', (e) => {
      dataManager.updateSettings({ notificationDays: parseInt(e.target.value) });
    });
  }
  
  const enableNotificationsCheckbox = document.getElementById('enable-notifications');
  if (enableNotificationsCheckbox) {
    enableNotificationsCheckbox.addEventListener('change', (e) => {
      dataManager.updateSettings({ enableNotifications: e.target.checked });
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
      if (file) {
        dataManager.importData(file)
          .then(() => {
            alert('Données importées avec succès !');
            loadDashboard();
            loadGroups();
            loadSettings();
            notificationManager.updateNotificationBadge();
          })
          .catch(error => {
            alert(`Erreur lors de l'importation : ${error.message}`);
          });
      }
    });
  }
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
  console.log("Loading dashboard");
  
  // Load upcoming birthdays
  const upcomingBirthdays = dataManager.getUpcomingBirthdays();
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
    const age = dataManager.calculateAge(birthday.date) + (birthday.daysUntil > 0 ? 1 : 0);
    
    // Get the group if available
    let groupName = '';
    let groupColor = '';
    if (birthday.groupId) {
      const group = dataManager.getGroupById(birthday.groupId);
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
      const birthday = dataManager.getBirthdayById(birthdayId);
      if (birthday) {
        openBirthdayModal(birthday);
      }
    });
  });
  
  document.querySelectorAll('.delete-birthday').forEach(button => {
    button.addEventListener('click', (e) => {
      const birthdayId = e.currentTarget.dataset.id;
      const birthday = dataManager.getBirthdayById(birthdayId);
      if (birthday) {
        openConfirmModal(
          'Supprimer l\'anniversaire',
          `Êtes-vous sûr de vouloir supprimer l'anniversaire de ${birthday.name} ?`,
          () => {
            dataManager.deleteBirthday(birthdayId);
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
  await dataManager.getGroups();
  const groups = dataManager.data.groups;
  const groupsList = document.getElementById('groups-list');
  
  if (!groupsList) {
    console.error("Groups list element not found");
    return;
  }
  
  if (groups.length === 0) {
    groupsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>Aucun groupe créé</p>
      </div>
    `;
    return;
  }
  
  groupsList.innerHTML = '';
  
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
    groupCard.className = 'group-card';
    groupCard.style.borderTopColor = group.color;
    
    groupCard.innerHTML = `
      <div class="group-card-header">
        <h3 class="group-card-name">${group.name}</h3>
        <span class="group-card-count">${birthdays.length} membres</span>
      </div>
      ${group.description ? `<p class="group-card-description">${group.description}</p>` : ''}
      <div class="group-card-footer">
        <span class="group-card-next">${nextBirthdayText}</span>
      </div>
    `;
    
    groupCard.addEventListener('click', () => {
      openGroupDetails(group.id);
    });
    
    groupsList.appendChild(groupCard);
  }
}

/**
 * Open group details view
 * @param {string} groupId - Group ID
 */
async function openGroupDetails(groupId) {
  console.log(`Opening group details for ${groupId}`);
  
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
  
  // Récupérer les paramètres depuis l'API
  await dataManager.getSettings();
  const settings = dataManager.data.settings;
  
  const notificationDaysSelect = document.getElementById('notification-days');
  if (notificationDaysSelect) {
    notificationDaysSelect.value = settings.notificationDays;
  }
  
  const enableNotificationsCheckbox = document.getElementById('enable-notifications');
  if (enableNotificationsCheckbox) {
    enableNotificationsCheckbox.checked = settings.enableNotifications;
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
    birthdayGroup.value = birthday.groupId || '';
    birthdayNotes.value = birthday.notes || '';
  } else {
    birthdayId.value = '';
    if (defaultGroupId) {
      birthdayGroup.value = defaultGroupId;
    }
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
  
  if (defaultGroupId) {
    birthdayGroup.value = defaultGroupId;
  } else if (birthday && birthday.groupId) {
    birthdayGroup.value = birthday.groupId;
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
  console.log("Saving birthday");
  
  const birthdayId = document.getElementById('birthday-id').value;
  const birthdayName = document.getElementById('birthday-name').value;
  const birthdayDate = document.getElementById('birthday-date').value;
  const birthdayGroup = document.getElementById('birthday-group').value;
  const birthdayNotes = document.getElementById('birthday-notes').value;
  
  const birthdayData = {
    name: birthdayName,
    date: birthdayDate,
    groupId: birthdayGroup || null,
    notes: birthdayNotes
  };
  
  console.log("Birthday data to save:", birthdayData);
  console.log("Birthday ID:", birthdayId);
  
  if (birthdayId) {
    // Update existing birthday
    console.log("Updating existing birthday with ID:", birthdayId);
    await dataManager.updateBirthday(birthdayId, birthdayData);
  } else {
    // Add new birthday
    console.log("Adding new birthday");
    await dataManager.addBirthday(birthdayData);
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
  
  if (groupId) {
    // Update existing group
    await dataManager.updateGroup(groupId, groupData);
    
    // If we're in group details view, refresh the group name
    const groupDetailsView = document.getElementById('group-details-view');
    if (groupDetailsView && groupDetailsView.classList.contains('active') && groupDetailsView.dataset.groupId === groupId) {
      const groupNameElement = document.getElementById('group-name');
      if (groupNameElement) {
        groupNameElement.textContent = groupName;
      }
      openGroupDetails(groupId);
    }
  } else {
    // Add new group
    const newGroup = await dataManager.addGroup(groupData);
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
}

/**
 * Show the notification center
 */
async function showNotificationCenter() {
  console.log("Showing notification center");
  
  await loadNotifications();
  
  // Mark all notifications as read
  notificationManager.markAllAsRead();
  
  // Show the modal
  const modalOverlay = document.getElementById('modal-overlay');
  const notificationModal = document.getElementById('notification-modal');
  
  if (modalOverlay && notificationModal) {
    modalOverlay.classList.remove('hidden');
    notificationModal.classList.remove('hidden');
  }
}

/**
 * Load notifications
 */
async function loadNotifications() {
  console.log("Loading notifications");
  
  // Récupérer les notifications depuis l'API
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
        <i class="fas fa-bell-slash"></i>
        <p>Aucune notification</p>
      </div>
    `;
    return;
  }
  
  notificationsList.innerHTML = '';
  
  // Sort notifications by date (newest first)
  notifications.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  for (const notification of notifications) {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
    
    const createdAt = new Date(notification.createdAt);
    const formattedDate = createdAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    notificationItem.innerHTML = `
      <div class="notification-title">${notification.title}</div>
      <div class="notification-message">${notification.message}</div>
      <div class="notification-time">${formattedDate}</div>
    `;
    
    notificationsList.appendChild(notificationItem);
  }
}

/**
 * Open a confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Function to call when confirmed
 */
function openConfirmModal(title, message, onConfirm) {
  console.log("Opening confirmation modal", title, message);
  
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmActionBtn = document.getElementById('confirm-action-btn');
  
  if (!confirmTitle || !confirmMessage || !confirmActionBtn) {
    console.error("Confirmation modal elements not found");
    return;
  }
  
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  
  // Remove any existing event listeners
  const newConfirmBtn = confirmActionBtn.cloneNode(true);
  confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);
  
  // Add the new event listener
  newConfirmBtn.addEventListener('click', () => {
    onConfirm();
    const modalOverlay = document.getElementById('modal-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    
    if (modalOverlay && confirmModal) {
      modalOverlay.classList.add('hidden');
      confirmModal.classList.add('hidden');
    }
  });
  
  // Show the modal
  const modalOverlay = document.getElementById('modal-overlay');
  const confirmModal = document.getElementById('confirm-modal');
  
  if (modalOverlay && confirmModal) {
    modalOverlay.classList.remove('hidden');
    confirmModal.classList.remove('hidden');
  }
}