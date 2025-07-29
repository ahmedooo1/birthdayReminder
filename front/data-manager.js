/**
* Data Manager for Birthday Reminder App
* Handles all data operations including saving, loading, and manipulating data
*/
class DataManager {    constructor() {
        this.apiUrl = 'https://rappelanniv.aaweb.fr/api/';
        this.data = {
            groups: [],
            birthdays: [],
            notifications: [],
            settings: {
                notificationDays: 3,
                enableNotifications: true, // For the first toggle "Activer les notifications" (in-app/email)
                systemNotificationsEnabled: true // For the second toggle "Activer les notifications système"
            }
        };
        this.loadData();
    }
    
    /**
    * S'assurer que les structures de données sont des tableaux
    */
    ensureDataIntegrity() {
        if (!Array.isArray(this.data.groups)) {
            console.warn("Resetting groups to empty array:", this.data.groups);
            this.data.groups = [];
        }
        if (!Array.isArray(this.data.birthdays)) {
            console.warn("Resetting birthdays to empty array:", this.data.birthdays);
            this.data.birthdays = [];
        }
        if (!Array.isArray(this.data.notifications)) {
            console.warn("Resetting notifications to empty array:", this.data.notifications);
            this.data.notifications = [];
        }
        if (!this.data.settings || typeof this.data.settings !== 'object') {
            this.data.settings = {
                notificationDays: 3,
                enableNotifications: true
            };
        }
    }
      /**
     * Normaliser les données d'anniversaire pour le frontend
     * @param {Object|Array} birthdayData - Données d'anniversaire de l'API
     * @returns {Object|Array} Données normalisées
     */
    normalizeBirthdayData(birthdayData) {
        if (Array.isArray(birthdayData)) {
            return birthdayData.map(birthday => this.normalizeBirthdayData(birthday));
        }
        
        if (birthdayData && typeof birthdayData === 'object') {
            // Créer une copie pour éviter de modifier l'original
            const normalized = { ...birthdayData };
            
            // Mapper group_id vers groupId pour le frontend
            if (normalized.group_id !== undefined) {
                normalized.groupId = normalized.group_id;
            }
            
            return normalized;
        }
        
        return birthdayData;
    }

    /**
    * Generate a unique ID
    * @returns {string} Unique ID
    */
    generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
      /**
    * Effectuer une requête API
    * @param {string} endpoint - Point de terminaison de l'API
    * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
    * @param {Object} data - Données à envoyer (pour POST, PUT)
    * @returns {Promise<Object>} Réponse de l'API
    */    async apiRequest(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('session_token');
        
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
    
        const options = {
          method,
          headers,
        };
    
        if (body) {
          options.body = JSON.stringify(body);
        }
    
        let responseData = null; // Declare responseData here to access in catch
    
        try {
          const response = await fetch(this.apiUrl + endpoint, options);
          responseData = await response.json(); // Assign here
    
          if (!response.ok) {
            console.error('API Error:', responseData);
            const errorMessage = responseData.message || JSON.stringify(responseData);
            throw new Error(errorMessage);
          }
          return responseData;
        } catch (error) {
          console.error(`Erreur API (${endpoint}):`, error);
          throw error;
        }
      }
    
    /**
    * Charger toutes les données depuis l'API
    */    async loadData() {
    try {        // Check if user is authenticated
        const sessionToken = localStorage.getItem('session_token');
        if (!sessionToken) {
            console.log('No session token found, skipping data loading');
            this.ensureDataIntegrity(); // Ensures settings object exists with defaults
            return;
        }    // Essayer de charger depuis l'API
    const [groupsResponse, birthdaysResponse, notificationsResponse, settingsResponse] = await Promise.allSettled([ // Use Promise.allSettled
      this.apiRequest('groupes.php'),
      this.apiRequest('birthdays.php'),
      this.apiRequest('notifications.php'),
      this.apiRequest('settings.php')
    ]);

    // Helper to process responses from Promise.allSettled
    const processResponse = (response, defaultValue = []) => {
        if (response.status === 'fulfilled' && response.value) {
            if (Array.isArray(response.value)) return response.value;
            if (typeof response.value === 'object' && response.value.data && Array.isArray(response.value.data)) return response.value.data;
            if (typeof response.value === 'object' && !Array.isArray(response.value)) return response.value; // For settings
        }
        return defaultValue;
    };    const groups = processResponse(groupsResponse);
    const birthdays = processResponse(birthdaysResponse);
    const notifications = processResponse(notificationsResponse);
    const settingsFromApi = processResponse(settingsResponse, null); // settings can be an object

    if (groups) {
        this.data.groups = groups;
        this.removeDuplicateGroups();
    }
    if (birthdays) {
        this.data.birthdays = birthdays;
        this.removeDuplicateBirthdays();
    }
    if (notifications) this.data.notifications = notifications;
    
    if (settingsFromApi) {
        this.data.settings = {
            notificationDays: settingsFromApi.notification_days !== undefined ? settingsFromApi.notification_days : this.data.settings.notificationDays,
            enableNotifications: settingsFromApi.email_notifications !== undefined ? Boolean(settingsFromApi.email_notifications) : this.data.settings.enableNotifications,
            systemNotificationsEnabled: settingsFromApi.system_notifications_enabled !== undefined ? Boolean(settingsFromApi.system_notifications_enabled) : this.data.settings.systemNotificationsEnabled
        };
    }
    
    this.ensureDataIntegrity();
    console.log("Données chargées depuis l'API:", this.data);
    } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    
    // Charger depuis localStorage en cas d'échec de l'API
    const savedData = localStorage.getItem('birthdayReminderData');
    if (savedData) {
    try {    const parsedData = JSON.parse(savedData);    // S'assurer que les données du localStorage sont valides
    if (parsedData.groups && Array.isArray(parsedData.groups)) {
        this.data.groups = parsedData.groups;
        // Supprimer les doublons de groupes après le chargement depuis localStorage
        this.removeDuplicateGroups();
    }
    if (parsedData.birthdays && Array.isArray(parsedData.birthdays)) {
        this.data.birthdays = parsedData.birthdays;
        // Supprimer les doublons après le chargement depuis localStorage
        this.removeDuplicateBirthdays();
    }
    if (parsedData.notifications && Array.isArray(parsedData.notifications)) this.data.notifications = parsedData.notifications;
    if (parsedData.settings) this.data.settings = parsedData.settings;
    console.log("Données chargées depuis localStorage:", this.data);
    } catch (e) {
    console.error('Erreur lors de l\'analyse des données sauvegardées:', e);
    }
    }
    this.ensureDataIntegrity();
    }
    }
    
    /**
    * Sauvegarder les données localement (fallback)
    */
    saveLocalData() {
    const dataStr = JSON.stringify(this.data);
    localStorage.setItem('birthdayReminderData', dataStr);
    console.log("Données sauvegardées localement:", this.data);
    }
    
    /**
    * Export data to a JSON file
    * This will trigger a download of the JSON file
    */    exportData() {
    const dataStr = JSON.stringify(this.data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create a link element to trigger the download
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', 'birthday-reminder-data.json');
    exportLink.style.display = 'none';
    document.body.appendChild(exportLink);
    
    // Simulate a click on the link to trigger the download
    exportLink.click();
    document.body.removeChild(exportLink);
    
    // Show success message using toast
    if (window.toastManager) {
      window.toastManager.success('Export réussi', 'Fichier téléchargé avec succès !');
    }
    
    console.log("Data exported successfully:", this.data);
    }
    
    /**
    * Import data from a JSON file
    * @param {File} file - The JSON file to import
    * @returns {Promise<boolean>} - Whether the import was successful
    */
    importData(file) {
    return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
    try {
    const importedData = JSON.parse(event.target.result);
    
    // Validate the imported data structure
    if (
    importedData &&
    Array.isArray(importedData.groups) &&
    Array.isArray(importedData.birthdays) &&
    Array.isArray(importedData.notifications) &&
    importedData.settings
    ) {
    // Importer les données dans l'API
    try {
    // Supprimer toutes les données existantes      await this.apiRequest('groupes.php', 'DELETE');
    await this.apiRequest('birthdays.php', 'DELETE');
    await this.apiRequest('notifications.php', 'DELETE');      // Importer les nouvelles données
      for (const group of importedData.groups) {
        await this.apiRequest('groupes.php', 'POST', group);
      }
    
    for (const birthday of importedData.birthdays) {
    await this.apiRequest('birthdays.php', 'POST', birthday);
    }
    
    for (const notification of importedData.notifications) {
    await this.apiRequest('notifications.php', 'POST', notification);
    }
    
    await this.apiRequest('settings.php', 'PUT', importedData.settings);
    
    // Recharger les données
    await this.loadData();
    resolve(true);
    } catch (error) {
    console.error("Erreur lors de l'importation vers l'API:", error);
    
    // Fallback: sauvegarder localement
    this.data = importedData;
    this.saveLocalData();
    resolve(true);
    }
    } else {
    reject(new Error('Format de données invalide'));
    }
    } catch (e) {
    reject(e);
    }
    };
    
    reader.onerror = () => {
    reject(new Error('Erreur de lecture du fichier'));
    };
    
    reader.readAsText(file);
    });
    }
      /**
    * Get all groups
    * @returns {Array} Array of group objects
    */
  async getGroups() {
    try {
      const response = await this.apiRequest('groupes.php');
      let groups = response;
      
      // Vérifier si la réponse contient une propriété 'data'
      if (response && typeof response === 'object' && response.data && Array.isArray(response.data)) {
        groups = response.data;
      }
        if (groups && Array.isArray(groups)) {
        this.data.groups = groups;
        // Supprimer les doublons après la récupération des données
        this.removeDuplicateGroups();
      }
      return this.data.groups;
    } catch (error) {
      console.error("Erreur lors de la récupération des groupes:", error);
      return this.data.groups;
    }
  }
    
    /**
    * Get a group by ID
    * @param {string} id - Group ID
    * @returns {Object|null} Group object or null if not found
    */
    getGroupById(id) {
    return this.data.groups.find(group => group.id === id) || null;
    }

    async getUsersByGroup(groupId) {
        try {
            // Construct the endpoint with the group_id query parameter
            const endpoint = `groupes.php?action=get_users&group_id=${groupId}`;
            const users = await this.apiRequest(endpoint, 'GET');
            
            // The API might return users directly or nested under a 'data' property
            if (users && users.data && Array.isArray(users.data)) {
                return users.data;
            } else if (Array.isArray(users)) {
                return users;
            }
            // If the response is not as expected, return an empty array or handle error
            console.warn('Unexpected response format for getUsersByGroup:', users);
            return [];
        } catch (error) {
            console.error(`Erreur lors de la récupération des utilisateurs pour le groupe ${groupId}:`, error);
            // Optionally, re-throw the error or return a default value like an empty array
            throw error; // Or return [];
        }
    }
    
    /**
    * Add a new group
    * @param {Object} group - Group object without ID
    * @returns {Object} The created group with ID
    */
  async addGroup(group) {
    try {
      const newGroup = await this.apiRequest('groupes.php', 'POST', group);
      if (newGroup) {
        this.data.groups.push(newGroup);
        this.saveLocalData(); // Sauvegarde locale de secours
      }
      return newGroup;
    } catch (error) {
      console.error("Erreur lors de l'ajout du groupe:", error);
    
    // Fallback: ajouter localement
    const newGroup = {
    id: this.generateId(),
    ...group
    };
    this.data.groups.push(newGroup);
    this.saveLocalData();
    return newGroup;
    }
    }
    
    /**
    * Update an existing group
    * @param {string} id - Group ID
    * @param {Object} updates - Object with properties to update
    * @returns {Object|null} Updated group or null if not found
    */
  async updateGroup(id, updates) {
    try {
      const updatedGroup = await this.apiRequest(`groupes.php?id=${id}`, 'PUT', updates);
      if (updatedGroup) {
        const index = this.data.groups.findIndex(group => group.id === id);
        if (index !== -1) {
          this.data.groups[index] = updatedGroup;
          this.saveLocalData();
        }
        return updatedGroup;
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du groupe:", error);
    
    // Fallback: mettre à jour localement
    const index = this.data.groups.findIndex(group => group.id === id);
    if (index === -1) return null;
    
    this.data.groups[index] = { ...this.data.groups[index], ...updates };
    this.saveLocalData();
    return this.data.groups[index];
    }
    }
      /**
    * Delete a group
    * @param {string} id - Group ID
    * @returns {boolean} Whether the deletion was successful
    */  async deleteGroup(id) {
    try {
      await this.apiRequest(`groupes.php?id=${id}`, 'DELETE');
    
    // Mettre à jour les données locales
    const initialLength = this.data.groups.length;
    this.data.groups = this.data.groups.filter(group => group.id !== id);
    
    // Supprimer les anniversaires associés (ils sont supprimés par CASCADE dans la DB)
    this.data.birthdays = this.data.birthdays.filter(birthday => birthday.groupId !== id);
    
    this.saveLocalData();
    
    // Forcer le rechargement des groupes depuis l'API pour s'assurer de la synchronisation
    await this.getGroups();
    
    return this.data.groups.length < initialLength;
    } catch (error) {
    console.error("Erreur lors de la suppression du groupe:", error);
    
    // Fallback: supprimer localement
    const initialLength = this.data.groups.length;
    this.data.groups = this.data.groups.filter(group => group.id !== id);
    
    this.data.birthdays = this.data.birthdays.map(birthday => {
    if (birthday.groupId === id) {
    return { ...birthday, groupId: null };
    }
    return birthday;
    });
    
    this.saveLocalData();
    
    // Même en cas d'erreur, essayer de recharger depuis l'API
    try {
      await this.getGroups();
    } catch (reloadError) {
      console.warn("Impossible de recharger les groupes depuis l'API:", reloadError);
    }
    
    return this.data.groups.length < initialLength;
    }
    }
    
    /**
     * Join a group using an access code
     * @param {string} accessCode - The access code for the group
     * @returns {Object|null} The joined group or null if failed
     */    async joinGroup(accessCode) {
        try {
            const joinedGroup = await this.apiRequest('groupes.php', 'POST', { 
                action: 'join', 
                access_code: accessCode.toUpperCase() 
            });
            
            if (joinedGroup) {
                // Check if group is already in local data
                const existingIndex = this.data.groups.findIndex(group => group.id === joinedGroup.id);
                if (existingIndex === -1) {
                    this.data.groups.push(joinedGroup);
                } else {
                    this.data.groups[existingIndex] = joinedGroup;
                }
                this.saveLocalData();
                return joinedGroup;
            }
            return null;
        } catch (error) {
            console.error("Erreur lors de la jointure du groupe:", error);
            throw error;
        }
    }    /**
    * Get all birthdays
    * @returns {Array} Array of birthday objects
    */    async getBirthdays() {
    try {
    const response = await this.apiRequest('birthdays.php');
    let birthdays = response;
    
    // Vérifier si la réponse contient une propriété 'data'
    if (response && typeof response === 'object' && response.data && Array.isArray(response.data)) {
        birthdays = response.data;
    }
      if (birthdays && Array.isArray(birthdays)) {
        this.data.birthdays = this.normalizeBirthdayData(birthdays);
        // Supprimer les doublons après la récupération des données
        this.removeDuplicateBirthdays();
    }
    return this.data.birthdays;
    } catch (error) {
    console.error("Erreur lors de la récupération des anniversaires:", error);
    return this.data.birthdays;
    }
    }
    
    /**
    * Get birthdays for a specific group
    * @param {string} groupId - Group ID
    * @returns {Array} Array of birthday objects
    */  async getBirthdaysByGroup(groupId) {
    // S'assurer que this.data.birthdays est un tableau
    if (!Array.isArray(this.data.birthdays)) {
        console.warn("this.data.birthdays is not an array, initializing as empty array:", this.data.birthdays);
        this.data.birthdays = [];
    }
      try {
      const response = await this.apiRequest(`birthdays.php?group_id=${groupId}`);
      let birthdays = response;
      
      // Vérifier si la réponse contient une propriété 'data'
      if (response && typeof response === 'object' && response.data && Array.isArray(response.data)) {
        birthdays = response.data;
      }
        if (birthdays && Array.isArray(birthdays)) {
        // Normaliser les données avant de les utiliser
        const normalizedBirthdays = this.normalizeBirthdayData(birthdays);
        
        // Mettre à jour le cache local pour ce groupe de manière sûre
        // Créer une copie du tableau pour éviter les mutations indésirables
        const updatedBirthdays = [...this.data.birthdays.filter(b => b.groupId !== groupId)];
        updatedBirthdays.push(...normalizedBirthdays);
        this.data.birthdays = updatedBirthdays;
        
        // Supprimer les doublons après la mise à jour
        this.removeDuplicateBirthdays();
        this.saveLocalData();
        return birthdays;
      } else if (response && typeof response === 'object' && !Array.isArray(response)) {
        // Si la réponse est un objet mais pas un tableau
        console.warn("Les données d'anniversaires ne sont pas dans le format attendu:", response);
        return this.data.birthdays.filter(birthday => birthday.groupId === groupId);
      }
      return this.data.birthdays.filter(birthday => birthday.groupId === groupId);
    } catch (error) {
      console.error("Erreur lors de la récupération des anniversaires du groupe:", error);
      return this.data.birthdays.filter(birthday => birthday.groupId === groupId);
    }
    }
    
    /**
    * Get a birthday by ID
    * @param {string} id - Birthday ID
    * @returns {Object|null} Birthday object or null if not found
    */
    getBirthdayById(id) {
    return this.data.birthdays.find(birthday => birthday.id === id) || null;
    }
    
    /**
    * Add a new birthday
    * @param {Object} birthday - Birthday object without ID
    * @returns {Object} The created birthday with ID
    */    async addBirthday(birthday) {
    try {
      // Map groupId to group_id for the API
      const apiBirthdayData = {
        ...birthday,
        group_id: birthday.groupId
      };
      delete apiBirthdayData.groupId; // Remove the original groupId

      const newBirthday = await this.apiRequest('birthdays.php', 'POST', apiBirthdayData);      // S\'assurer que les données sont au format attendu et les normaliser
      const formattedBirthday = (newBirthday && newBirthday.data) ? newBirthday.data : newBirthday;
      const normalizedBirthday = this.normalizeBirthdayData(formattedBirthday);
      
      this.data.birthdays.push(normalizedBirthday);
      // Supprimer les doublons après l'ajout
      this.removeDuplicateBirthdays();
      this.saveLocalData();
      return normalizedBirthday;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'anniversaire:", error);
      this.saveLocalData(); // Sauvegarder l'état actuel même en cas d'erreur
      throw error;
    }
    }
      /**
    * Update an existing birthday
    * @param {string} id - Birthday ID
    * @param {Object} updates - Object with properties to update
    * @returns {Object|null} Updated birthday or null if not found
    */
    async updateBirthday(id, updates) {
    console.log('🔄 [UPDATE BIRTHDAY] Starting update for ID:', id);
    console.log('🔄 [UPDATE BIRTHDAY] Original updates data:', updates);
    
    try {
      // Map groupId to group_id for the API if it exists
      const apiBirthdayData = { ...updates };
      if (apiBirthdayData.groupId !== undefined) {
        apiBirthdayData.group_id = apiBirthdayData.groupId;
        delete apiBirthdayData.groupId;
        console.log('🔄 [UPDATE BIRTHDAY] Mapped groupId to group_id');
      }

      console.log('🔄 [UPDATE BIRTHDAY] Final API data to send:', apiBirthdayData);
      console.log('🔄 [UPDATE BIRTHDAY] Making API request to: birthdays.php?id=' + id);

      const updatedBirthday = await this.apiRequest(`birthdays.php?id=${id}`, 'PUT', apiBirthdayData);
      console.log('🔄 [UPDATE BIRTHDAY] API response received:', updatedBirthday);      // S\'assurer que les données sont au format attendu et les normaliser
      const formattedBirthday = (updatedBirthday && updatedBirthday.data) ? updatedBirthday.data : updatedBirthday;
      console.log('🔄 [UPDATE BIRTHDAY] Formatted birthday data:', formattedBirthday);
      
      const normalizedBirthday = this.normalizeBirthdayData(formattedBirthday);
      console.log('🔄 [UPDATE BIRTHDAY] Normalized birthday data:', normalizedBirthday);
      
      const index = this.data.birthdays.findIndex(b => b.id === id);
      console.log('🔄 [UPDATE BIRTHDAY] Found birthday at index:', index);
      
      if (index !== -1) {
        this.data.birthdays[index] = normalizedBirthday;
        console.log('🔄 [UPDATE BIRTHDAY] Updated birthday in local data');
      } else {
        console.warn('🔄 [UPDATE BIRTHDAY] Birthday not found in local data!');
      }
      
      this.saveLocalData();
      console.log('🔄 [UPDATE BIRTHDAY] Update completed successfully');
      return normalizedBirthday;
    } catch (error) {
      console.error('🔄 [UPDATE BIRTHDAY] Error during update:', error);
    
    // Fallback: mettre à jour localement
    const index = this.data.birthdays.findIndex(birthday => birthday.id === id);
    if (index === -1) return null;
    
    this.data.birthdays[index] = { ...this.data.birthdays[index], ...updates };
    this.saveLocalData();
    return this.data.birthdays[index];
    }
    }
    
    /**
    * Delete a birthday
    * @param {string} id - Birthday ID
    * @returns {boolean} Whether the deletion was successful
    */    async deleteBirthday(id) {
    // S'assurer que this.data.birthdays est un tableau
    if (!Array.isArray(this.data.birthdays)) {
        console.warn("this.data.birthdays is not an array, initializing as empty array:", this.data.birthdays);
        this.data.birthdays = [];
    }
    if (!Array.isArray(this.data.notifications)) {
        console.warn("this.data.notifications is not an array, initializing as empty array:", this.data.notifications);
        this.data.notifications = [];
    }
    
    try {
    await this.apiRequest(`birthdays.php?id=${id}`, 'DELETE');
    
    // Mettre à jour les données locales
    const initialLength = this.data.birthdays.length;
    this.data.birthdays = this.data.birthdays.filter(birthday => birthday.id !== id);
    
    // Supprimer les notifications associées
    this.data.notifications = this.data.notifications.filter(
    notification => notification.birthdayId !== id
    );
    
    this.saveLocalData();
    return this.data.birthdays.length < initialLength;
    } catch (error) {
    console.error("Erreur lors de la suppression de l'anniversaire:", error);
    
    // Fallback: supprimer localement
    const initialLength = this.data.birthdays.length;
    this.data.birthdays = this.data.birthdays.filter(birthday => birthday.id !== id);
    
    this.data.notifications = this.data.notifications.filter(
    notification => notification.birthdayId !== id
    );
    
    this.saveLocalData();
    return this.data.birthdays.length < initialLength;
    }
    }
      /**
    * Get all notifications
    * @returns {Array} Array of notification objects
    */
    async getNotifications() {
    try {
    const response = await this.apiRequest('notifications.php');
    let notifications = response;
    
    // Vérifier si la réponse contient une propriété 'data'
    if (response && typeof response === 'object' && response.data && Array.isArray(response.data)) {
        notifications = response.data;
    }
    
    if (notifications && Array.isArray(notifications)) {
        this.data.notifications = notifications;
    }
    return this.data.notifications;
    } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return this.data.notifications;
    }
    }
    
    /**
    * Add a new notification
    * @param {Object} notification - Notification object
    * @returns {Object} The created notification with ID
    */
    async addNotification(notification) {
    try {
    const newNotification = await this.apiRequest('notifications.php', 'POST', notification);
    if (newNotification) {
    this.data.notifications.push(newNotification);
    this.saveLocalData();
    }
    return newNotification;
    } catch (error) {
    console.error("Erreur lors de l'ajout de la notification:", error);
    
    // Fallback: ajouter localement
    const newNotification = {
    id: this.generateId(),
    ...notification,
    read: false,
    createdAt: new Date().toISOString()
    };
    this.data.notifications.push(newNotification);
    this.saveLocalData();
    return newNotification;
    }
    }
    
    /**
    * Mark a notification as read
    * @param {string} id - Notification ID
    * @returns {Object|null} Updated notification or null if not found
    */
    async markNotificationAsRead(id) {
    try {
    await this.apiRequest(`notifications.php?id=${id}`, 'PUT');
    
    // Mettre à jour les données locales
    const index = this.data.notifications.findIndex(notification => notification.id === id);
    if (index !== -1) {
    this.data.notifications[index].read = true;
    this.saveLocalData();
    return this.data.notifications[index];
    }
    return null;
    } catch (error) {
    console.error("Erreur lors du marquage de la notification comme lue:", error);
    
    // Fallback: mettre à jour localement
    const index = this.data.notifications.findIndex(notification => notification.id === id);
    if (index === -1) return null;
    
    this.data.notifications[index].read = true;
    this.saveLocalData();
    return this.data.notifications[index];
    }
    }
    
    /**
    * Clear all notifications
    */
    async clearNotifications() {
    try {
    await this.apiRequest('notifications.php', 'DELETE');
    this.data.notifications = [];
    this.saveLocalData();
    } catch (error) {
    console.error("Erreur lors de la suppression des notifications:", error);
    
    // Fallback: supprimer localement
    this.data.notifications = [];
    this.saveLocalData();
    }
    }
    
    /**
    * Get app settings
    * @returns {Object} Settings object
    */
    async getSettings() {
    try {
        // Attempt to fetch fresh settings from API
        const settingsFromApi = await this.apiRequest('settings.php');
        if (settingsFromApi) {
            this.data.settings = {
                notificationDays: settingsFromApi.notification_days !== undefined ? settingsFromApi.notification_days : this.data.settings.notificationDays,
                // enableNotifications maps to the first toggle (historically email_notifications)
                enableNotifications: settingsFromApi.email_notifications !== undefined ? Boolean(settingsFromApi.email_notifications) : this.data.settings.enableNotifications,
                // systemNotificationsEnabled maps to the second toggle
                systemNotificationsEnabled: settingsFromApi.system_notifications_enabled !== undefined ? Boolean(settingsFromApi.system_notifications_enabled) : this.data.settings.systemNotificationsEnabled
            };
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des paramètres (getSettings):", error);
        // On error, ensure local settings still exist with defaults if not already populated
    }
    // Ensure settings object and its properties always exist with defaults
    this.data.settings = {
        notificationDays: (this.data.settings && typeof this.data.settings.notificationDays !== 'undefined') ? this.data.settings.notificationDays : 3,
        enableNotifications: (this.data.settings && typeof this.data.settings.enableNotifications !== 'undefined') ? this.data.settings.enableNotifications : true,
        systemNotificationsEnabled: (this.data.settings && typeof this.data.settings.systemNotificationsEnabled !== 'undefined') ? this.data.settings.systemNotificationsEnabled : true,
    };
    return this.data.settings;
}
    
    /**
    * Update app settings
    * @param {Object} updates - Object with settings to update
    * @returns {Object} Updated settings
    */
    async updateSettings(updates) {
    try {
      const apiSettingsData = {};
      if (updates.notificationDays !== undefined) {
        apiSettingsData.notification_days = parseInt(updates.notificationDays, 10);
      }
      // 'enableNotifications' from frontend (first toggle) maps to 'email_notifications' in backend
      if (updates.enableNotifications !== undefined) {
        apiSettingsData.email_notifications = Boolean(updates.enableNotifications);
      }
      // 'system_notifications_enabled' from frontend (second toggle) maps to 'system_notifications_enabled' in backend
      if (updates.system_notifications_enabled !== undefined) {
        apiSettingsData.system_notifications_enabled = Boolean(updates.system_notifications_enabled);
      }

      // Add other mappings if necessary for profile updates (first_name, last_name)
      // These might come from a different part of the app, but if they are part of general settings update:
      if (updates.first_name !== undefined) {
          apiSettingsData.first_name = updates.first_name;
      }
      if (updates.last_name !== undefined) {
          apiSettingsData.last_name = updates.last_name;
      }


      if (Object.keys(apiSettingsData).length === 0) {
        console.log("No relevant settings to update for the API from payload:", updates);
        return this.data.settings; 
      }

      console.log("Sending to API in updateSettings:", apiSettingsData);
      const updatedSettingsFromApi = await this.apiRequest('settings.php', 'PUT', apiSettingsData);
      
      if (updatedSettingsFromApi) {
        // Update local cache from the API response
        this.data.settings.notificationDays = updatedSettingsFromApi.notification_days !== undefined ? updatedSettingsFromApi.notification_days : this.data.settings.notificationDays;
        this.data.settings.enableNotifications = updatedSettingsFromApi.email_notifications !== undefined ? Boolean(updatedSettingsFromApi.email_notifications) : this.data.settings.enableNotifications;
        this.data.settings.systemNotificationsEnabled = updatedSettingsFromApi.system_notifications_enabled !== undefined ? Boolean(updatedSettingsFromApi.system_notifications_enabled) : this.data.settings.systemNotificationsEnabled;
      }
      this.saveLocalData();
      return this.data.settings;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres:", error);
      // Do not throw error here if toastManager in app.js handles it by reverting UI
      // Or, rethrow if app.js needs to catch it explicitly beyond console logging
      this.saveLocalData(); 
      throw error; // Rethrow to allow app.js to catch and revert UI
    }
}
      /**
    * Get current user profile
    * @returns {Object} User profile data
    */
    async getCurrentUser() {
      try {
        const token = localStorage.getItem('session_token');
        if (!token) {
          throw new Error('No session token found');
        }        // Utiliser la méthode apiRequest pour la cohérence
        const response = await this.apiRequest('auth.php?action=profile', 'GET', null);
  
        // Si on reçoit une réponse valide, mettre à jour le localStorage
        if (response && response.id) {
          localStorage.setItem('user_data', JSON.stringify(response));
          return response;
        }
        
        return response;
      } catch (error) {
        console.error('Error getting current user:', error);
        // Fallback: return user from localStorage
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
      }
    }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Object} Updated profile response
   */  async updateProfile(profileData) {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        throw new Error('No session token found');
      }

      console.log('[DataManager] updateProfile called with data:', profileData);
      console.log('[DataManager] Using session token:', token.substring(0, 10) + '...');

      const response = await this.apiRequest('auth.php?action=update_profile', 'POST', profileData);// Update local storage with new data from API response (not form data)
      if (response.success && response.updated_user_data) {
        localStorage.setItem('user_data', JSON.stringify(response.updated_user_data));
        console.log('[DataManager] Updated localStorage with fresh user data from API response');
      } else if (response.success) {
        // Fallback: if no updated_user_data in response, merge form data with existing
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const currentUser = JSON.parse(userData);
          const updatedUser = { ...currentUser, ...profileData };
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
          console.log('[DataManager] Fallback: Updated localStorage by merging form data with existing user data');
        }
      }

      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Change password response
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        throw new Error('No session token found');
      }

      const response = await this.apiRequest('auth.php?action=change_password', 'POST', {
        current_password: currentPassword,
        new_password: newPassword,
        session_token: token,
        csrf_token: 'dummy_token' // Temporary until CSRF is implemented
      });

      return response;
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: error.message };
    }
  }
    
    /**
    * Get upcoming birthdays
    * @param {number} days - Number of days to look ahead
    * @returns {Array} Array of upcoming birthdays with days until
    */
    getUpcomingBirthdays(days = 30) {
    const today = new Date();
    const result = [];
    
    for (const birthday of this.data.birthdays) {
    const birthdayDate = new Date(birthday.date);
    
    // Check if the date is valid
    if (isNaN(birthdayDate.getTime())) {
        console.warn(`Invalid birthday date for ${birthday.name}: ${birthday.date}`);
        continue; // Skip this birthday
    }
    
    const thisYearBirthday = new Date(
    today.getFullYear(),
    birthdayDate.getMonth(),
    birthdayDate.getDate()
    );
    
    // If the birthday has already passed this year, look at next year's birthday
    if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= days) {
    result.push({
    ...birthday,
    daysUntil: daysDiff,
    nextBirthday: thisYearBirthday
    });
    }
    }
    
    // Sort by days until birthday
    return result.sort((a, b) => a.daysUntil - b.daysUntil);
    }
      /**
    * Get birthdays for a specific month
    * @param {number} month - Month (0-11)
    * @param {number} year - Year
    * @returns {Array} Array of birthdays in the specified month
    */
    getBirthdaysByMonth(month, year) {
    if (!Array.isArray(this.data.birthdays)) {
        console.warn("this.data.birthdays is not an array:", this.data.birthdays);
        return [];
    }
    return this.data.birthdays.filter(birthday => {
    const birthdayDate = new Date(birthday.date);
    
    // Check if the date is valid
    if (isNaN(birthdayDate.getTime())) {
        console.warn(`Invalid birthday date for ${birthday.name}: ${birthday.date}`);
        return false; // Exclude this birthday
    }
    
    return birthdayDate.getMonth() === month;
    });
    }
    
    /**
    * Calculate age from birthday
    * @param {string} birthdate - Birthdate string
    * @returns {number} Age in years
    */
    calculateAge(birthdate) {
    const birthDate = new Date(birthdate);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
    }
    
    return age;
    }
    
    /**
     * Remove duplicate groups from the data
     * @returns {void}
     */
    removeDuplicateGroups() {
        if (!Array.isArray(this.data.groups)) {
            return;
        }
        
        const originalLength = this.data.groups.length;
        const uniqueGroups = [];
        const seenIds = new Set();
        
        for (const group of this.data.groups) {
            if (group && group.id && !seenIds.has(group.id)) {
                seenIds.add(group.id);
                uniqueGroups.push(group);
            }
        }
        
        this.data.groups = uniqueGroups;
        const removedCount = originalLength - uniqueGroups.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} duplicate groups`);
        }
    }

    /**
     * Remove duplicate birthdays by ID
     * @returns {void}
     */    removeDuplicateBirthdays() {
        if (!Array.isArray(this.data.birthdays)) {
            return;
        }
        
        const originalLength = this.data.birthdays.length;
        const uniqueBirthdays = [];
        const seenIds = new Set();
        
        for (const birthday of this.data.birthdays) {
            if (birthday && birthday.id && !seenIds.has(birthday.id)) {
                seenIds.add(birthday.id);
                uniqueBirthdays.push(birthday);
            }
        }
        
        this.data.birthdays = uniqueBirthdays;
        const removedCount = originalLength - uniqueBirthdays.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} duplicate birthdays`);
        }
    }

    /**
     * Nettoyer le localStorage (groupes et anniversaires)
     * Usage : dataManager.clearLocalDataAndReload()
     */
    async clearLocalDataAndReload() {
      localStorage.removeItem('birthdayReminderData');
      // Optionnel : vider aussi les groupes/anniversaires en mémoire
      this.data.groups = [];
      this.data.birthdays = [];
      this.data.notifications = [];
      this.saveLocalData();
      // Recharge les données depuis l'API
      await this.loadData();
      if (window.toastManager) {
        window.toastManager.success('LocalStorage nettoyé', 'Les données locales ont été supprimées.');
      }
    }
    
    /**
     * Méthode statique utilitaire pour l'utilisateur (console)
     * Usage : DataManager.clearLocalStorageOnly()
     */
    static clearLocalStorageOnly() {
      localStorage.removeItem('birthdayReminderData');
      if (window.toastManager) {
        window.toastManager.success('LocalStorage nettoyé', 'Les données locales ont été supprimées.');
      }
    }
    }
    
// Create a global instance of the DataManager
window.dataManager = new DataManager();