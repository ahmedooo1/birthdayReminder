/**
* Data Manager for Birthday Reminder App
* Handles all data operations including saving, loading, and manipulating data
*/
class DataManager {
    constructor() {
    this.data = {
    groups: [],
    birthdays: [],
    notifications: [],
    settings: {
    notificationDays: 3,
    enableNotifications: true
    }
    };
    this.apiUrl = 'api'; // URL de base de l'API
    this.loadData();
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
    */
    async apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.apiUrl}/${endpoint}`;
    const options = {
    method,
    headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'votre_cle_api_secrete' // Clé API simple pour l'authentification
    }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
    }
    
    try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
    }
    
    return await response.json();
    } catch (error) {
    console.error(`Erreur API (${endpoint}):`, error);
    
    // En cas d'erreur de connexion, utiliser les données locales
    if (error.message.includes('Failed to fetch')) {
    console.log('Utilisation des données locales en mode hors ligne');
    return null;
    }
    
    throw error;
    }
    }
    
    /**
    * Charger toutes les données depuis l'API
    */
    async loadData() {
    try {
    // Essayer de charger depuis l'API
    const [groups, birthdays, notifications, settings] = await Promise.all([
    this.apiRequest('groups.php'),
    this.apiRequest('birthdays.php'),
    this.apiRequest('notifications.php'),
    this.apiRequest('settings.php')
    ]);
    
    if (groups) this.data.groups = groups;
    if (birthdays) this.data.birthdays = birthdays;
    if (notifications) this.data.notifications = notifications;
    
    if (settings) {
    this.data.settings = {
    notificationDays: settings.notification_days,
    enableNotifications: Boolean(settings.enable_notifications)
    };
    }
    
    console.log("Données chargées depuis l'API:", this.data);
    } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    
    // Charger depuis localStorage en cas d'échec de l'API
    const savedData = localStorage.getItem('birthdayReminderData');
    if (savedData) {
    try {
    this.data = JSON.parse(savedData);
    console.log("Données chargées depuis localStorage:", this.data);
    } catch (e) {
    console.error('Erreur lors de l\'analyse des données sauvegardées:', e);
    }
    }
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
    */
    exportData() {
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
    // Supprimer toutes les données existantes
    await this.apiRequest('groups.php', 'DELETE');
    await this.apiRequest('birthdays.php', 'DELETE');
    await this.apiRequest('notifications.php', 'DELETE');
    
    // Importer les nouvelles données
    for (const group of importedData.groups) {
    await this.apiRequest('groups.php', 'POST', group);
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
    const groups = await this.apiRequest('groups.php');
    if (groups) {
    this.data.groups = groups;
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
    
    /**
    * Add a new group
    * @param {Object} group - Group object without ID
    * @returns {Object} The created group with ID
    */
    async addGroup(group) {
    try {
    const newGroup = await this.apiRequest('groups.php', 'POST', group);
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
    const updatedGroup = await this.apiRequest(`groups.php?id=${id}`, 'PUT', updates);
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
    */
    async deleteGroup(id) {
    try {
    await this.apiRequest(`groups.php?id=${id}`, 'DELETE');
    
    // Mettre à jour les données locales
    const initialLength = this.data.groups.length;
    this.data.groups = this.data.groups.filter(group => group.id !== id);
    
    // Mettre à jour les anniversaires associés
    this.data.birthdays = this.data.birthdays.map(birthday => {
    if (birthday.groupId === id) {
    return { ...birthday, groupId: null };
    }
    return birthday;
    });
    
    this.saveLocalData();
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
    return this.data.groups.length < initialLength;
    }
    }
    
    /**
    * Get all birthdays
    * @returns {Array} Array of birthday objects
    */
    async getBirthdays() {
    try {
    const birthdays = await this.apiRequest('birthdays.php');
    if (birthdays) {
    this.data.birthdays = birthdays;
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
    */
    async getBirthdaysByGroup(groupId) {
    try {
    const birthdays = await this.apiRequest(`birthdays.php?group_id=${groupId}`);
    if (birthdays) {
    // Mettre à jour le cache local pour ce groupe
    this.data.birthdays = this.data.birthdays.filter(b => b.groupId !== groupId);
    this.data.birthdays.push(...birthdays);
    this.saveLocalData();
    }
    return birthdays || this.data.birthdays.filter(birthday => birthday.groupId === groupId);
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
    */
    async addBirthday(birthday) {
    try {
    const newBirthday = await this.apiRequest('birthdays.php', 'POST', birthday);
    if (newBirthday) {
    this.data.birthdays.push(newBirthday);
    this.saveLocalData();
    }
    return newBirthday;
    } catch (error) {
    console.error("Erreur lors de l'ajout de l'anniversaire:", error);
    
    // Fallback: ajouter localement
    const newBirthday = {
    id: this.generateId(),
    ...birthday
    };
    this.data.birthdays.push(newBirthday);
    this.saveLocalData();
    return newBirthday;
    }
    }
    
    /**
    * Update an existing birthday
    * @param {string} id - Birthday ID
    * @param {Object} updates - Object with properties to update
    * @returns {Object|null} Updated birthday or null if not found
    */
    async updateBirthday(id, updates) {
    try {
    const updatedBirthday = await this.apiRequest(`birthdays.php?id=${id}`, 'PUT', updates);
    if (updatedBirthday) {
    const index = this.data.birthdays.findIndex(birthday => birthday.id === id);
    if (index !== -1) {
    this.data.birthdays[index] = updatedBirthday;
    this.saveLocalData();
    }
    return updatedBirthday;
    }
    return null;
    } catch (error) {
    console.error("Erreur lors de la mise à jour de l'anniversaire:", error);
    
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
    */
    async deleteBirthday(id) {
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
    const notifications = await this.apiRequest('notifications.php');
    if (notifications) {
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
    const settings = await this.apiRequest('settings.php');
    if (settings) {
    this.data.settings = {
    notificationDays: settings.notification_days,
    enableNotifications: Boolean(settings.enable_notifications)
    };
    }
    return this.data.settings;
    } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    return this.data.settings;
    }
    }
    
    /**
    * Update app settings
    * @param {Object} updates - Object with settings to update
    * @returns {Object} Updated settings
    */
    async updateSettings(updates) {
    try {
    await this.apiRequest('settings.php', 'PUT', updates);
    
    // Mettre à jour les données locales
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveLocalData();
    return this.data.settings;
    } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    
    // Fallback: mettre à jour localement
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveLocalData();
    return this.data.settings;
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
    return this.data.birthdays.filter(birthday => {
    const birthdayDate = new Date(birthday.date);
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
    }
    
    // Create a global instance of the DataManager
    const dataManager = new DataManager();