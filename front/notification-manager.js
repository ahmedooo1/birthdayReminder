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
    async checkForNotifications() { // Make async
        const settings = await this.dataManager.getSettings(); // Await
        
        if (!settings || typeof settings.enableNotifications === 'undefined' || typeof settings.systemNotificationsEnabled === 'undefined') {
            console.warn('checkForNotifications: Settings not available or in unexpected format. Notifications check aborted.', settings);
            return; 
        }

        // Check for in-app notifications (bell icon)
        if (settings.enableNotifications) {
            const notificationDays = settings.notificationDays;
            const upcomingBirthdays = this.dataManager.getUpcomingBirthdays(notificationDays);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentNotifications = await this.dataManager.getNotifications();

            for (const birthday of upcomingBirthdays) {
                const existingNotification = Array.isArray(currentNotifications) ? currentNotifications.find(
                    n => n.birthdayId === birthday.id && new Date(n.createdAt).toDateString() === today.toDateString()
                ) : undefined;

                if (!existingNotification) {
                    let message;
                    if (birthday.daysUntil === 0) {
                        message = `C'est l'anniversaire de ${birthday.name} aujourd'hui !`;
                    } else if (birthday.daysUntil === 1) {
                        message = `L'anniversaire de ${birthday.name} est demain !`;
                    } else {
                        message = `L'anniversaire de ${birthday.name} est dans ${birthday.daysUntil} jours.`;
                    }
                    await this.dataManager.addNotification({
                        title: `Rappel d'anniversaire`,
                        message,
                        birthdayId: birthday.id,
                        date: birthday.nextBirthday ? birthday.nextBirthday.toISOString() : new Date().toISOString()
                    });
                    
                    // Only show system notification if system notifications are also enabled
                    if (settings.systemNotificationsEnabled) {
                        this.showSystemNotification("Rappel d'anniversaire", message);
                    }
                }
            }
            await this.updateNotificationBadge();
        } else {
            console.log('In-app notifications are disabled by user settings.');
            // Optionally clear existing in-app notifications or badge if general notifications are turned off
            // For now, just log and don't create new ones.
        }
    }

    /**
    * Show a system notification
    * @param {string} title - Notification title
    * @param {string} message - Notification message
    */
    showSystemNotification(title, message) {
        // This method now only proceeds if browser supports Notifications API.
        // The actual check for user *preference* (systemNotificationsEnabled setting) should be done by the caller.
        if (!('Notification' in window)) {
            console.log('System notifications not supported by this browser.');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'https://cdn-icons-png.flaticon.com/512/1404/1404945.png' // Consider making this icon local
            });
        } else if (Notification.permission !== 'denied') {
            // We don't request permission here anymore. Permission should be requested explicitly by user action.
            // console.log('Notification permission not granted, but not denied. User needs to grant permission first.');
        } else {
            // console.log('Notification permission denied by user.');
        }
    }
    
    /**
    * Update the notification badge count
    */
    async updateNotificationBadge() { // Make async
        const notificationsArray = await this.dataManager.getNotifications(); // Await
        // Ensure notificationsArray is an array before filtering
        const unreadCount = Array.isArray(notificationsArray) ? notificationsArray.filter(n => !n.read).length : 0;
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
    async markAllAsRead() { // Make async
        const notificationsArray = await this.dataManager.getNotifications(); // Await

        // Ensure notifications is an array before iterating
        if (Array.isArray(notificationsArray)) {
            for (const notification of notificationsArray) {
                if (!notification.read) {
                    await this.dataManager.markNotificationAsRead(notification.id); // dataManager.markNotificationAsRead is async
                }
            }
        } else {
            console.warn('markAllAsRead: notificationsArray is not an array or iterable after await', notificationsArray);
        }

        await this.updateNotificationBadge(); // Await as updateNotificationBadge is now async
    }
      /**
    * Request permission for browser notifications
    * @returns {Promise<string>} Permission status
    */
    requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Ce navigateur ne prend pas en charge les notifications système');
            if (window.toastManager) {
                window.toastManager.warning('Non supporté', 'Ce navigateur ne prend pas en charge les notifications système');
            }
            return Promise.resolve('not-supported');
        }
        
        if (Notification.permission === 'granted') {
            if (window.toastManager) {
                window.toastManager.info('Déjà autorisé', 'Les notifications sont déjà autorisées');
            }
            return Promise.resolve('granted');
        }
        
        if (Notification.permission === 'denied') {
            if (window.toastManager) {
                window.toastManager.error('Bloqué', 'Les notifications ont été bloquées. Veuillez les autoriser dans les paramètres du navigateur.');
            }
            return Promise.resolve('denied');
        }
        
        return Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                this.showSystemNotification(
                    'Notifications activées', 
                    'Vous recevrez désormais des notifications pour les anniversaires à venir.'
                );
                if (window.toastManager) {
                    window.toastManager.success('Autorisé', 'Les notifications système ont été activées !');
                }
            } else if (permission === 'denied') {
                if (window.toastManager) {
                    window.toastManager.error('Refusé', 'Les notifications ont été refusées');
                }
            } else {
                if (window.toastManager) {
                    window.toastManager.warning('Report', 'La demande d\'autorisation a été reportée');
                }
            }
            return permission;
        });
    }
    }
      // Create a global instance of the NotificationManager
    const notificationManager = new NotificationManager(window.dataManager);