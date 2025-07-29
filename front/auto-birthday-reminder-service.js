/**
 * Service de rappels automatiques d'anniversaire
 * Vérifie et envoie les rappels automatiquement
 */
class AutoBirthdayReminderService {
    constructor() {
        this.apiUrl = 'api/auto_birthday_reminders.php';
        this.apiKey = 'bd_12345_auto_reminder_secret_key_change_this';
        this.lastCheckKey = 'birthday_last_auto_check';
        this.checkIntervalHours = 12; // Vérifier toutes les 12 heures
    }

    /**
     * Initialiser le service automatique
     */
    init() {
        // Vérifier au démarrage de l'application
        this.checkIfShouldRun();
        
        // Programmer des vérifications périodiques
        setInterval(() => {
            this.checkIfShouldRun();
        }, this.checkIntervalHours * 60 * 60 * 1000); // Convertir en millisecondes
    }

    /**
     * Vérifier s'il faut exécuter les rappels
     */
    checkIfShouldRun() {
        const now = new Date();
        const lastCheck = localStorage.getItem(this.lastCheckKey);
        
        if (!lastCheck) {
            // Première exécution
            this.runReminders();
            return;
        }

        const lastCheckDate = new Date(lastCheck);
        const hoursSinceLastCheck = (now - lastCheckDate) / (1000 * 60 * 60);

        if (hoursSinceLastCheck >= this.checkIntervalHours) {
            this.runReminders();
        }
    }

    /**
     * Exécuter les rappels d'anniversaire
     */
    async runReminders() {
        try {
            console.log('🎂 Vérification automatique des rappels d\'anniversaire...');
            
            const response = await fetch(`${this.apiUrl}?api_key=${this.apiKey}`);
            const result = await response.json();

            if (result.status === 'completed') {
                console.log(`✅ Rappels traités: ${result.total_emails_sent} emails envoyés`);
                
                // Mettre à jour la dernière vérification
                localStorage.setItem(this.lastCheckKey, new Date().toISOString());
                
                // Afficher une notification si des emails ont été envoyés
                if (result.total_emails_sent > 0) {
                    this.showNotification(`${result.total_emails_sent} rappel(s) d'anniversaire envoyé(s)`);
                }
            } else {
                console.warn('⚠️ Erreur lors des rappels automatiques:', result.error);
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'exécution des rappels automatiques:', error);
        }
    }

    /**
     * Afficher une notification
     */
    showNotification(message) {
        // Utiliser le système de toast existant si disponible
        if (window.toastManager && typeof window.toastManager.success === 'function') {
            window.toastManager.success('Rappels d\'anniversaire', message);
        } else {
            console.log('📧 ' + message);
        }
    }

    /**
     * Forcer l'exécution des rappels (pour test)
     */
    async forceRun() {
        console.log('🔄 Exécution forcée des rappels...');
        await this.runReminders();
    }

    /**
     * Réinitialiser le timer
     */
    resetTimer() {
        localStorage.removeItem(this.lastCheckKey);
        console.log('🔄 Timer des rappels réinitialisé');
    }
}

// Initialiser le service automatique
const autoBirthdayService = new AutoBirthdayReminderService();

// Démarrer le service quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'utilisateur soit connecté
    setTimeout(() => {
        if (localStorage.getItem('session_token')) {
            autoBirthdayService.init();
        }
    }, 2000);
});

// Exposer le service globalement pour les tests
window.autoBirthdayService = autoBirthdayService;
