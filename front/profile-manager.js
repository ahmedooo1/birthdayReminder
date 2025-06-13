/**
 * Profile Manager - Gestion du profil utilisateur
 */
class ProfileManager {
    constructor(dataManager, toastManager) {
        this.dataManager = dataManager;
        this.toast = toastManager;
        this.currentUser = null;
        this.profileForm = null;
        // this.passwordForm will be populated in setupEventListeners
        this.passwordForm = {
            currentPassword: null,
            newPassword: null,
            confirmPassword: null,
            saveBtn: null
        };
        
        // Bind event handlers to this instance to ensure 'this' context is correct
        // and to have stable references for add/removeEventListener.
        this._boundHandleProfileSubmit = this._handleProfileSubmit.bind(this);
        this._boundHandlePasswordSaveClick = this._handlePasswordSaveClick.bind(this);
        this._boundHandleTabLinkClick = this._handleTabLinkClick.bind(this);
        this._boundHandleChangeAvatarBtnClick = this._handleChangeAvatarBtnClick.bind(this);
        this._boundHandleAvatarUploadChange = this._handleAvatarUploadChange.bind(this);

        this.initializeEventListeners();
    }

    // Event handler methods
    _handleProfileSubmit(e) {
        e.preventDefault();
        this.saveProfile();
    }

    _handlePasswordSaveClick(e) {
        e.preventDefault();
        this.changePassword();
    }

    _handleTabLinkClick(e) {
        e.preventDefault();
        // 'this' here is ProfileManager, e.currentTarget is the link
        const tabName = e.currentTarget.dataset.tab; 
        console.log('Tab clicked:', tabName); // Keep debug log from original
        this.switchTab(tabName);
    }

    _handleChangeAvatarBtnClick() {
        const avatarUploadInput = document.getElementById('avatar-upload-input');
        if (avatarUploadInput) {
            avatarUploadInput.click();
        }
    }

    _handleAvatarUploadChange(e) {
        this.handleAvatarUpload(e); // The original method takes event 'e'
    }

    /**
     * Initialiser les écouteurs d'événements
     */    
    initializeEventListeners() {
        // Si le DOM est déjà chargé, initialiser immédiatement
        // Sinon, attendre le DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
    }

    /**
     * Configurer les écouteurs d'événements
     */
    setupEventListeners() {
        // Ensure elements are fetched each time, as DOM might change or not be ready initially
        this.profileForm = document.getElementById('profile-form');
        
        // Populate this.passwordForm with current elements
        this.passwordForm.currentPassword = document.getElementById('current-password');
        this.passwordForm.newPassword = document.getElementById('new-password');
        this.passwordForm.confirmPassword = document.getElementById('confirm-new-password');
        this.passwordForm.saveBtn = document.getElementById('save-password-btn');

        const avatarUploadInput = document.getElementById('avatar-upload-input');
        const changeAvatarBtn = document.getElementById('change-avatar-btn');

        // Onglets du profil
        const tabLinks = document.querySelectorAll('.tab-link');
        console.log('Found tab links:', tabLinks.length); // Debug log from original
        tabLinks.forEach(link => {
            console.log('Setting up tab link:', link.dataset.tab); // Debug log from original
            // Remove then add to prevent duplicates if setupEventListeners is called multiple times
            link.removeEventListener('click', this._boundHandleTabLinkClick);
            link.addEventListener('click', this._boundHandleTabLinkClick);
        });

        // Formulaire de profil
        if (this.profileForm) {
            this.profileForm.removeEventListener('submit', this._boundHandleProfileSubmit);
            this.profileForm.addEventListener('submit', this._boundHandleProfileSubmit);
        }

        // Changement de mot de passe
        if (this.passwordForm.saveBtn) {
            this.passwordForm.saveBtn.removeEventListener('click', this._boundHandlePasswordSaveClick);
            this.passwordForm.saveBtn.addEventListener('click', this._boundHandlePasswordSaveClick);
        }

        // Upload d'avatar
        // const avatarUpload = document.getElementById('avatar-upload-input'); // Already fetched as avatarUploadInput
        // const changeAvatarBtn = document.getElementById('change-avatar-btn'); // Already fetched
        
        if (changeAvatarBtn) {
            changeAvatarBtn.removeEventListener('click', this._boundHandleChangeAvatarBtnClick);
            changeAvatarBtn.addEventListener('click', this._boundHandleChangeAvatarBtnClick);
        }
        
        if (avatarUploadInput) {
            avatarUploadInput.removeEventListener('change', this._boundHandleAvatarUploadChange);
            avatarUploadInput.addEventListener('change', this._boundHandleAvatarUploadChange);
        }
    }

    /**
     * Charger les données du profil
     */
    async loadProfile() {
        try {
            const user = await this.dataManager.getCurrentUser();
            if (!user) {
                this.toast.error('Erreur', 'Impossible de charger les informations du profil');
                return;
            }

            this.currentUser = user;
            this.populateProfileForm(user);
            this.toast.success('Profil chargé', 'Les informations du profil ont été chargées avec succès');
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            this.toast.error('Erreur', 'Impossible de charger le profil');
        }
    }

    /**
     * Remplir le formulaire avec les données utilisateur
     */
    populateProfileForm(user) {
        // Sidebar
        const usernameDisplay = document.getElementById('profile-username-display');
        const emailDisplay = document.getElementById('profile-email-display');
        const avatarImg = document.getElementById('profile-avatar-img');

        if (usernameDisplay) usernameDisplay.textContent = user.username || 'Utilisateur';
        if (emailDisplay) emailDisplay.textContent = user.email || 'email@example.com';
        
        // Avatar par défaut avec initiales
        if (avatarImg && !user.avatar) {
            const initials = this.getInitials(user.first_name, user.last_name, user.username);
            avatarImg.src = this.generateAvatarUrl(initials);
        } else if (avatarImg && user.avatar) {
            avatarImg.src = user.avatar;
        }        // Formulaire principal
        const firstNameInput = document.getElementById('profile-first-name');
        const lastNameInput = document.getElementById('profile-last-name');
        const emailInput = document.getElementById('profile-email');
        const emailNotificationsCheckbox = document.getElementById('profile-email-notifications');
        const notificationDaysInput = document.getElementById('profile-notification-days');

        if (firstNameInput) firstNameInput.value = user.first_name || '';
        if (lastNameInput) lastNameInput.value = user.last_name || '';
        if (emailInput) emailInput.value = user.email || '';
        
        // Remplir les champs de notification seulement s'ils existent
        if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = user.email_notifications == 1;
        if (notificationDaysInput) notificationDaysInput.value = user.notification_days || 7;
    }

    /**
     * Obtenir les initiales pour l'avatar
     */
    getInitials(firstName, lastName, username) {
        if (firstName && lastName) {
            return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        } else if (firstName) {
            return firstName.charAt(0).toUpperCase();
        } else if (username) {
            return username.substring(0, 2).toUpperCase();
        }
        return 'U';
    }

    /**
     * Générer une URL d'avatar avec initiales
     */
    generateAvatarUrl(initials) {
        return `https://ui-avatars.com/api/?name=${initials}&background=4361ee&color=ffffff&size=150&bold=true`;
    }    /**
     * Changer d'onglet
     */
    switchTab(tabName) {
        console.log('Switching to tab:', tabName); // Debug log
        
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activer l'onglet sélectionné
        const tabLink = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        console.log('Tab link found:', tabLink); // Debug log
        console.log('Tab content found:', tabContent); // Debug log
        
        if (tabLink) tabLink.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    /**
     * Sauvegarder le profil
     */    async saveProfile() {
        const loadingToast = this.toast.loading('Enregistrement', 'Mise à jour du profil...');

        try {
            const formData = {
                first_name: document.getElementById('profile-first-name').value.trim(),
                last_name: document.getElementById('profile-last-name').value.trim(),
                email: document.getElementById('profile-email').value.trim()
            };

            // Ajouter les champs de notification seulement s'ils existent dans le DOM
            const emailNotificationsCheckbox = document.getElementById('profile-email-notifications');
            const notificationDaysInput = document.getElementById('profile-notification-days');
            
            if (emailNotificationsCheckbox) {
                formData.email_notifications = emailNotificationsCheckbox.checked;
            }
            
            if (notificationDaysInput) {
                formData.notification_days = parseInt(notificationDaysInput.value, 10);
            }

            // Validation
            if (!formData.email) {
                loadingToast.remove();
                this.toast.error('Erreur', 'L\'email est requis');
                return;
            }

            const result = await this.dataManager.updateProfile(formData);
            
            if (result.success) {
                this.currentUser = { ...this.currentUser, ...formData, email_notifications: formData.email_notifications ? 1 : 0 }; // Update local state
                this.populateProfileForm(this.currentUser); // Re-populate to reflect changes
                loadingToast.remove();
                this.toast.success('Profil mis à jour', 'Vos informations ont été enregistrées.');
            } else {
                loadingToast.remove();
                this.toast.error('Erreur', result.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
            loadingToast.remove();
            this.toast.error('Erreur', 'Impossible de sauvegarder le profil');
        }
    }

    /**
     * Changer le mot de passe
     */
    async changePassword() {
        const currentPassword = this.passwordForm.currentPassword.value;
        const newPassword = this.passwordForm.newPassword.value;
        const confirmPassword = this.passwordForm.confirmPassword.value;

        // Validation
        if (!currentPassword) {
            this.toast.error('Erreur', 'Veuillez saisir votre mot de passe actuel');
            return;
        }

        if (!newPassword) {
            this.toast.error('Erreur', 'Veuillez saisir un nouveau mot de passe');
            return;
        }

        if (newPassword.length < 6) {
            this.toast.error('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.toast.error('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        const loadingToast = this.toast.loading('Modification', 'Changement du mot de passe...');

        try {
            const result = await this.dataManager.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                // Vider les champs
                this.passwordForm.currentPassword.value = '';
                this.passwordForm.newPassword.value = '';
                this.passwordForm.confirmPassword.value = '';
                
                loadingToast.remove();
                this.toast.success('Succès', 'Mot de passe modifié avec succès');
            } else {
                loadingToast.remove();
                this.toast.error('Erreur', result.message || 'Erreur lors du changement de mot de passe');
            }
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            loadingToast.remove();
            this.toast.error('Erreur', 'Impossible de changer le mot de passe');
        }
    }

    /**
     * Gérer l'upload d'avatar
     */
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validation du type de fichier
        if (!file.type.startsWith('image/')) {
            this.toast.error('Erreur', 'Veuillez sélectionner un fichier image');
            return;
        }

        // Validation de la taille (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.toast.error('Erreur', 'L\'image ne doit pas dépasser 2MB');
            return;
        }

        const loadingToast = this.toast.loading('Upload', 'Téléchargement de l\'avatar...');

        try {
            const result = await this.dataManager.uploadAvatar(file);
            
            if (result.success) {
                const avatarImg = document.getElementById('profile-avatar-img');
                if (avatarImg) {
                    avatarImg.src = result.avatar_url;
                }
                loadingToast.remove();
                this.toast.success('Succès', 'Avatar mis à jour avec succès');
            } else {
                loadingToast.remove();
                this.toast.error('Erreur', result.message || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur lors de l\'upload d\'avatar:', error);
            loadingToast.remove();
            this.toast.error('Erreur', 'Impossible de télécharger l\'avatar');
        }

        // Réinitialiser l'input file
        event.target.value = '';
    }    /**
     * Afficher la vue profil
     */
    showProfile() {
        // Re-initialiser les event listeners au cas où les éléments DOM auraient changé
        this.setupEventListeners();
        this.loadProfile();
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}
