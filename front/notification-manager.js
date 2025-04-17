/**
* Notification Manager for Birthday Reminder App
* Handles checking for upcoming birthdays and creating notifications
*/
class NotificationManager {
    constructor(dataManager) {
    this.dataManager = dataManager;
    this.initialized = false;
    }
    
    /**
    * Initialize the notification manager
    */
    init() {
    if (this.initialized) return;
    
    // Request notification permission on startup
    this.requestNotificationPermission();
    
    // Check for notifications on startup
    this.checkForNotifications();
    
    // Set up a daily check for notifications
    setInterval(() => this.checkForNotifications(), 86400000); // 24 hours
    
    // Also check every time the user opens the app
    document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
    this.checkForNotifications();
    }
    });
    
    this.initialized = true;
    console.log("Notification manager initialized");
    }
    
    /**
    * Check for upcoming birthdays and create notifications
    */
    checkForNotifications() {
    const settings = this.dataManager.getSettings();
    if (!settings.enableNotifications) return;
    
    const notificationDays = settings.notificationDays;
    const upcomingBirthdays = this.dataManager.getUpcomingBirthdays(notificationDays);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const birthday of upcomingBirthdays) {
    // Check if we already have a notification for this birthday
    const existingNotification = this.dataManager.getNotifications().find(
    n => n.birthdayId === birthday.id && new Date(n.createdAt).toDateString() === today.toDateString()
    );
    
    if (!existingNotification) {
    let message;
    
    if (birthday.daysUntil === 0) {
    message = `C'est l'anniversaire de ${birthday.name} aujourd'hui !`;
    } else if (birthday.daysUntil === 1) {
    message = `L'anniversaire de ${birthday.name} est demain !`;
    } else {
    message = `L'anniversaire de ${birthday.name} est dans ${birthday.daysUntil} jours.`;
    }
    
    // Create a notification in our app
    this.dataManager.addNotification({
    title: `Rappel d'anniversaire`,
    message,
    birthdayId: birthday.id,
    date: birthday.nextBirthday.toISOString()
    });
    
    // Send a system notification
    this.showSystemNotification("Rappel d'anniversaire", message);
    }
    }
    
    // Update the notification badge
    this.updateNotificationBadge();
    }
    
    /**
    * Show a system notification
    * @param {string} title - Notification title
    * @param {string} message - Notification message
    */
    showSystemNotification(title, message) {
    if ('Notification' in window) {
    if (Notification.permission === 'granted') {
    new Notification(title, {
    body: message,
    icon: 'https://cdn-icons-png.flaticon.com/512/1404/1404945.png'
    });
    } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
    new Notification(title, {
    body: message,
    icon: 'https://cdn-icons-png.flaticon.com/512/1404/1404945.png'
    });
    }
    });
    }
    }
    }
    
    /**
    * Update the notification badge count
    */
    updateNotificationBadge() {
    const unreadCount = this.dataManager.getNotifications().filter(n => !n.read).length;
    const badge = document.getElementById('notification-count');
    
    if (badge) {
    if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.classList.remove('hidden');
    } else {
    badge.classList.add('hidden');
    }
    }
    }
    
    /**
    * Mark all notifications as read
    */
    markAllAsRead() {
    const notifications = this.dataManager.getNotifications();
    
    for (const notification of notifications) {
    if (!notification.read) {
    this.dataManager.markNotificationAsRead(notification.id);
    }
    }
    
    this.updateNotificationBadge();
    }
    
    /**
    * Request permission for browser notifications
    * @returns {Promise<string>} Permission status
    */
    requestNotificationPermission() {
    if (!('Notification' in window)) {
    console.log('Ce navigateur ne prend pas en charge les notifications système');
    return Promise.resolve('not-supported');
    }
    
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    return Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
    this.showSystemNotification(
    'Notifications activées', 
    'Vous recevrez désormais des notifications pour les anniversaires à venir.'
    );
    }
    return permission;
    });
    }
    
    return Promise.resolve(Notification.permission);
    }
    }
    
    // Create a global instance of the NotificationManager
    const notificationManager = new NotificationManager(dataManager);