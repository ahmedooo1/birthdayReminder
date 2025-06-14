/**
 * Service de vérification automatique des anniversaires
 * Intégré dans l'interface pour vérifier régulièrement
 */
class AutoBirthdayService {
    constructor() {
        this.checkInterval = 60000; // Vérifier toutes les minutes
        this.lastCheck = localStorage.getItem('last_birthday_check') || 0;
        this.init();
    }

    init() {
        // Vérifier immédiatement
        this.checkBirthdays();
        
        // Programmer des vérifications régulières
        setInterval(() => {
            this.checkBirthdays();
        }, this.checkInterval);
    }

    async checkBirthdays() {
        const now = Date.now();
        const lastCheck = parseInt(this.lastCheck);
        
        // Vérifier seulement si la dernière vérification remonte à plus d'1 heure
        if (now - lastCheck < 3600000) { // 1 heure = 3600000ms
            return;
        }

        try {
            const sessionToken = localStorage.getItem('session_token');
            if (!sessionToken) return;

            const response = await fetch('/api/auto_birthday_reminders.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    api_key: 'your-secret-key-here' // À configurer
                })
            });

            const result = await response.json();
            
            if (result.status === 'completed' && result.total_emails_sent > 0) {
                console.log(`✅ ${result.total_emails_sent} rappels d'anniversaire envoyés automatiquement`);
                
                // Optionnel : Afficher une notification dans l'interface
                if (window.toastManager) {
                    window.toastManager.show(
                        `${result.total_emails_sent} rappels d'anniversaire envoyés`,
                        'success'
                    );
                }
            }

            // Mettre à jour le timestamp de la dernière vérification
            localStorage.setItem('last_birthday_check', now.toString());

        } catch (error) {
            console.error('Erreur lors de la vérification automatique des anniversaires:', error);
        }
    }

    // Méthode pour déclencher manuellement
    async triggerManually() {
        this.lastCheck = 0; // Forcer la vérification
        await this.checkBirthdays();
    }
}

// Initialiser le service automatiquement
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('session_token')) {
        window.autoBirthdayService = new AutoBirthdayService();
    }
});

// Exposer globalement pour les tests
window.AutoBirthdayService = AutoBirthdayService;
