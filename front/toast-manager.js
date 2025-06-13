/**
 * Toast Manager - Gestion des notifications toast stylées
 */
class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = [];
        this.defaultDuration = 4000;
        
        if (!this.container) {
            this.createContainer();
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    }    /**
     * Afficher un toast de succès
     * @param {string} title - Titre du toast
     * @param {string} message - Message du toast
     * @param {number|object} duration - Durée d'affichage (ms) ou objet d'options
     */
    success(title, message = '', duration = this.defaultDuration) {
        let actualDuration = this.defaultDuration;
        let options = {};
        
        if (typeof duration === 'object') {
            options = duration;
            actualDuration = options.timer || this.defaultDuration;
        } else {
            actualDuration = duration;
        }
        
        this.show('success', title, message, actualDuration, options);
    }

    /**
     * Afficher un toast d'erreur
     * @param {string} title - Titre du toast
     * @param {string} message - Message du toast
     * @param {number} duration - Durée d'affichage (ms)
     */
    error(title, message = '', duration = this.defaultDuration + 1000) {
        this.show('error', title, message, duration);
    }

    /**
     * Afficher un toast d'avertissement
     * @param {string} title - Titre du toast
     * @param {string} message - Message du toast
     * @param {number} duration - Durée d'affichage (ms)
     */
    warning(title, message = '', duration = this.defaultDuration) {
        this.show('warning', title, message, duration);
    }

    /**
     * Afficher un toast d'information
     * @param {string} title - Titre du toast
     * @param {string} message - Message du toast
     * @param {number} duration - Durée d'affichage (ms)
     */
    info(title, message = '', duration = this.defaultDuration) {
        this.show('info', title, message, duration);
    }    /**
     * Afficher un toast
     * @param {string} type - Type du toast (success, error, warning, info)
     * @param {string} title - Titre du toast
     * @param {string} message - Message du toast
     * @param {number} duration - Durée d'affichage (ms)
     * @param {object} options - Options supplémentaires
     */
    show(type, title, message = '', duration = this.defaultDuration, options = {}) {
        const toast = this.createToast(type, title, message, duration, options);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Animation d'entrée
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-suppression
        const autoRemoveTimeout = setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Sauvegarder le timeout pour pouvoir l'annuler
        toast.autoRemoveTimeout = autoRemoveTimeout;

        return toast;
    }    /**
     * Créer un élément toast
     */
    createToast(type, title, message, duration, options = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        // Support HTML content if allowHtml option is true
        const titleContent = options.allowHtml ? title : this.escapeHtml(title);
        const messageContent = options.allowHtml ? message : this.escapeHtml(message);

        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-title">${titleContent}</div>
                ${message ? `<div class="toast-message">${messageContent}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="Fermer">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress"></div>
        `;

        // Gestionnaire de fermeture
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast);
        });

        // Barre de progression
        const progressBar = toast.querySelector('.toast-progress');
        if (duration > 0) {
            progressBar.style.width = '100%';
            setTimeout(() => {
                progressBar.style.transition = `width ${duration}ms linear`;
                progressBar.style.width = '0%';
            }, 50);
        }

        // Pause au survol
        toast.addEventListener('mouseenter', () => {
            if (toast.autoRemoveTimeout) {
                clearTimeout(toast.autoRemoveTimeout);
                progressBar.style.animationPlayState = 'paused';
            }
        });

        toast.addEventListener('mouseleave', () => {
            const remainingTime = this.getRemainingTime(progressBar);
            if (remainingTime > 0) {
                toast.autoRemoveTimeout = setTimeout(() => {
                    this.remove(toast);
                }, remainingTime);
                progressBar.style.animationPlayState = 'running';
            }
        });

        return toast;
    }

    /**
     * Supprimer un toast
     */
    remove(toast) {
        if (toast.autoRemoveTimeout) {
            clearTimeout(toast.autoRemoveTimeout);
        }

        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Supprimer tous les toasts
     */
    removeAll() {
        this.toasts.forEach(toast => {
            this.remove(toast);
        });
    }    /**
     * Calculer le temps restant de la barre de progression
     */
    getRemainingTime(progressBar) {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        const totalDuration = parseFloat(progressBar.style.transition.match(/(\d+)ms/)?.[1]) || 0;
        return (currentWidth / 100) * totalDuration;
    }

    /**
     * Échapper le HTML pour éviter les injections XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Confirmation stylée avec SweetAlert2
     */
    async confirm(options) {
        const defaultOptions = {
            title: 'Êtes-vous sûr ?',
            text: 'Cette action ne peut pas être annulée.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#e63946',
            confirmButtonText: 'Oui, confirmer',
            cancelButtonText: 'Annuler',
            reverseButtons: true
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const result = await Swal.fire(mergedOptions);
            return result.isConfirmed;
        } catch (error) {
            console.error('Erreur lors de l\'affichage de la confirmation:', error);
            return false;
        }
    }

    /**
     * Input stylé avec SweetAlert2
     */
    async input(options) {
        const defaultOptions = {
            title: 'Saisir une valeur',
            input: 'text',
            inputPlaceholder: 'Entrez votre réponse...',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#e63946',
            confirmButtonText: 'Confirmer',
            cancelButtonText: 'Annuler'
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const result = await Swal.fire(mergedOptions);
            return result.isConfirmed ? result.value : null;
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'input:', error);
            return null;
        }
    }

    /**
     * Toast de chargement
     */
    loading(title = 'Chargement...', message = 'Veuillez patienter') {
        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.innerHTML = `
            <i class="toast-icon fas fa-spinner fa-spin"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        this.container.appendChild(toast);
        this.toasts.push(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        return {
            remove: () => this.remove(toast),
            update: (newTitle, newMessage) => {
                toast.querySelector('.toast-title').textContent = newTitle;
                toast.querySelector('.toast-message').textContent = newMessage;
            }
        };
    }
}

// Instance globale
const toast = new ToastManager();

// Remplacer la fonction alert globale
window.originalAlert = window.alert;
window.alert = function(message) {
    toast.info('Information', message);
};

// Fonction utilitaire pour remplacer confirm
window.confirmAction = async function(message, title = 'Confirmation') {
    return await toast.confirm({
        title: title,
        text: message
    });
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}
