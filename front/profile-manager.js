/**
 * Profile Manager - Gestion du profil utilisateur
 */
class ProfileManager {    constructor(dataManager, toastManager) {
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
        // and to have stable references for add/removeEventListener.        this._boundHandleProfileSubmit = this._handleProfileSubmit.bind(this);
        this._boundHandlePasswordSaveClick = this._handlePasswordSaveClick.bind(this);
        this._boundHandleTabLinkClick = this._handleTabLinkClick.bind(this);

        this.initializeEventListeners();
        
        // Exposer les méthodes de debug en mode développement
        if (typeof window !== 'undefined') {
            this.exposeDebugMethods();
        }
    }    // Event handler methods
    _handleProfileSubmit(e) {
        console.log('🔴 [URGENT] Form submit intercepted!');
        console.log('🔴 Event object:', e);
        console.log('🔴 Event type:', e.type);
        console.log('🔴 Calling preventDefault...');
        e.preventDefault();
        e.stopPropagation();
        console.log('🔴 preventDefault called - should not reload page');
        console.log('🔴 Now calling saveProfile...');
        this.saveProfile();
        console.log('🔴 saveProfile called');
        return false; // Extra protection
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
    }    /**
     * Configurer les écouteurs d'événements
     */
    setupEventListeners() {
        console.log('🟢 setupEventListeners() called');
        
        // Ensure elements are fetched each time, as DOM might change or not be ready initially        
        this.profileForm = document.getElementById('profile-form');
        
        // Populate this.passwordForm with current elements
        this.passwordForm.currentPassword = document.getElementById('current-password');
        this.passwordForm.newPassword = document.getElementById('new-password');
        this.passwordForm.confirmPassword = document.getElementById('confirm-new-password');
        this.passwordForm.saveBtn = document.getElementById('save-password-btn');

        // Onglets du profil
        const tabLinks = document.querySelectorAll('.tab-link');
        console.log('🟢 Found tab links:', tabLinks.length);
        tabLinks.forEach(link => {
            console.log('🟢 Setting up tab link:', link.dataset.tab);
            // Remove then add to prevent duplicates if setupEventListeners is called multiple times
            link.removeEventListener('click', this._boundHandleTabLinkClick);
            link.addEventListener('click', this._boundHandleTabLinkClick);
        });        

        // Formulaire de profil
        if (this.profileForm) {
            console.log('🟢 Profile form found:', this.profileForm);
            console.log('🟢 Removing old listener...');
            this.profileForm.removeEventListener('submit', this._boundHandleProfileSubmit);
            console.log('🟢 Adding new listener...');
            this.profileForm.addEventListener('submit', this._boundHandleProfileSubmit);
            console.log('🟢 Submit listener attached successfully');
            
            // Ajouter aussi un écouteur sur le bouton submit directement
            const submitBtn = this.profileForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                console.log('🟢 Adding click listener to submit button');
                submitBtn.addEventListener('click', (e) => {
                    console.log('🔴 Submit button clicked directly!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.saveProfile();
                    return false;
                });
            }
        } else {
            console.error('❌ Profile form NOT found! ID: profile-form');
            console.error('❌ Available forms:', document.querySelectorAll('form'));
        }

        // Changement de mot de passe
        if (this.passwordForm.saveBtn) {
            this.passwordForm.saveBtn.removeEventListener('click', this._boundHandlePasswordSaveClick);
            this.passwordForm.saveBtn.addEventListener('click', this._boundHandlePasswordSaveClick);
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
    }    /**
     * Mettre à jour les statistiques du profil
     */
    async updateProfileStats() {
        const birthdaysCountElement = document.getElementById('profile-birthdays-count');
        const groupsCountElement = document.getElementById('profile-groups-count');

        if (birthdaysCountElement) {
            // Compter le nombre total d'anniversaires
            const birthdaysCount = this.dataManager.data.birthdays.length;
            birthdaysCountElement.textContent = birthdaysCount;
        }

        if (groupsCountElement) {
            // Compter le nombre total de groupes
            const groupsCount = this.dataManager.data.groups.length;
            groupsCountElement.textContent = groupsCount;
        }
    }    /**
     * Remplir le formulaire avec les données utilisateur
     */
    populateProfileForm(user) {
        // Sidebar
        const usernameDisplay = document.getElementById('profile-username-display');
        const emailDisplay = document.getElementById('profile-email-display');
        const avatarImg = document.getElementById('profile-avatar-img');        if (usernameDisplay) usernameDisplay.textContent = user.username || 'Utilisateur';
        if (emailDisplay) emailDisplay.textContent = user.email || 'email@example.com';
        
        // Avatar par défaut avec initiales uniquement
        if (avatarImg) {
            const initials = this.getInitials(user.first_name, user.last_name, user.username);
            avatarImg.src = this.generateAvatarUrl(initials);
            avatarImg.alt = 'Avatar par défaut';
        }

        // Mettre à jour les statistiques du profil
        this.updateProfileStats();
        
        // Formulaire principal
        const usernameInput = document.getElementById('profile-username');
        const firstNameInput = document.getElementById('profile-first-name');
        const lastNameInput = document.getElementById('profile-last-name');
        const emailInput = document.getElementById('profile-email');
        const emailNotificationsCheckbox = document.getElementById('profile-email-notifications');
        const notificationDaysInput = document.getElementById('profile-notification-days');

        if (usernameInput) usernameInput.value = user.username || '';
        if (firstNameInput) firstNameInput.value = user.first_name || '';
        if (lastNameInput) lastNameInput.value = user.last_name || '';
        if (emailInput) emailInput.value = user.email || '';
        
        // Remplir les champs de notification seulement s'ils existent
        if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = user.email_notifications == 1;
        if (notificationDaysInput) {
            // Correctly display 0 if it's the value, otherwise default to 7 if null/undefined
            notificationDaysInput.value = (user.notification_days !== null && typeof user.notification_days !== 'undefined') ? user.notification_days : 7;
        }
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
    }    /**
     * Générer une URL d'avatar avec initiales
     */
    generateAvatarUrl(initials) {
        return `https://ui-avatars.com/api/?name=${initials}&background=4361ee&color=ffffff&size=150&bold=true`;
    }/**
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
    }    /**
     * Sauvegarder le profil
     */    async saveProfile() {
        console.log('🟡 [URGENT] saveProfile() started - should see this before page reloads');
        console.log('🟡 Creating loading toast...');
        const loadingToast = this.toast.loading('Enregistrement', 'Mise à jour du profil...');
        console.log('🟡 Loading toast created');        
        
        try {
            const formData = {
                username: document.getElementById('profile-username').value.trim(),
                first_name: document.getElementById('profile-first-name').value.trim(),
                last_name: document.getElementById('profile-last-name').value.trim(),
                email: document.getElementById('profile-email').value.trim()
            };            // Ajouter les champs de notification seulement s'ils existent dans le DOM
            const emailNotificationsCheckbox = document.getElementById('profile-email-notifications');
            const notificationDaysInput = document.getElementById('profile-notification-days');
            
            if (emailNotificationsCheckbox) {
                formData.email_notifications = emailNotificationsCheckbox.checked;
                console.log('Email notifications checkbox:', emailNotificationsCheckbox.checked);
            }
            
            if (notificationDaysInput) {
                const daysValue = notificationDaysInput.value.trim();
                if (daysValue === "") {
                    // If the user clears the field, send null.
                    // Backend can then handle it, e.g., by applying a default value or storing NULL.
                    formData.notification_days = null; 
                } else {
                    // Use parseFloat for initial check to catch decimals, then ensure it's an integer.
                    const parsedValue = parseFloat(daysValue);
                    if (isNaN(parsedValue) || parsedValue < 0 || !Number.isInteger(parsedValue)) {
                        loadingToast.remove();
                        this.toast.error('Erreur', 'Le délai de notification doit être un nombre entier positif ou zéro.');
                        return;
                    }
                    formData.notification_days = parseInt(daysValue, 10); // Final value is an integer
                }
                console.log('Notification days input:', notificationDaysInput.value, 'Processed as:', formData.notification_days);
            }

            console.log('Form data to save:', formData);

            // Validation
            if (!formData.email) {
                loadingToast.remove();
                this.toast.error('Erreur', 'L\'email est requis');
                return;
            }

            if (!formData.username) {
                loadingToast.remove();
                this.toast.error('Erreur', 'Le nom d\'utilisateur est requis');
                return;
            }

            // Validation du nom d'utilisateur (seulement lettres, chiffres, tirets et underscores)
            const usernameRegex = /^[a-zA-Z0-9_-]+$/;
            if (!usernameRegex.test(formData.username)) {
                loadingToast.remove();
                this.toast.error('Erreur', 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
                return;
            }            const result = await this.dataManager.updateProfile(formData);
            console.log('[ProfileManager] SaveProfile result from API:', JSON.stringify(result, null, 2));

            if (result.success) {
                const headerUsernameDisplay = document.querySelector('.user-btn span'); // Moved up

                if (result.updated_user_data) {
                    console.log('[ProfileManager] Using updated_user_data from saveProfile response to refresh UI.');
                    this.currentUser = result.updated_user_data;
                    localStorage.setItem('user_data', JSON.stringify(result.updated_user_data));
                    this.populateProfileForm(result.updated_user_data);
                    console.log('[ProfileManager] Profile form repopulated with data from update_profile response.');

                    // Update header username using data from API response
                    if (headerUsernameDisplay && result.updated_user_data.username) {
                        headerUsernameDisplay.textContent = result.updated_user_data.username;
                    }
                } else {
                    console.log('[ProfileManager] updated_user_data not in saveProfile response, calling refreshUserData().');
                    await this.refreshUserData(); // This updates this.currentUser and populates form
                    
                    // Update header username using data from refreshed currentUser
                    if (headerUsernameDisplay && this.currentUser && this.currentUser.username) {
                        headerUsernameDisplay.textContent = this.currentUser.username;
                    }
                }
                
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
    }    /**
     * Actualiser les données utilisateur depuis l'API
     */
    async refreshUserData() {        try {
            // Forcer le rechargement depuis l'API au lieu du cache
            console.log('[ProfileManager] Attempting to refresh user data from API...');
            const freshUserData = await this.dataManager.apiRequest('auth.php?action=profile', 'GET', null);
            console.log('[ProfileManager] Fresh user data received from API:', JSON.stringify(freshUserData, null, 2));
            
            if (freshUserData && freshUserData.success !== false) { // Check if freshUserData is not an error response
                this.currentUser = freshUserData;
                
                // Mettre à jour le localStorage avec les nouvelles données
                localStorage.setItem('user_data', JSON.stringify(freshUserData));
                console.log('[ProfileManager] User data updated in localStorage.');
                
                // Re-remplir le formulaire avec les données fraîches
                this.populateProfileForm(freshUserData);
                console.log('[ProfileManager] Profile form repopulated.');
                
                console.log('[ProfileManager] Données utilisateur actualisées:', freshUserData);
            } else {
                console.error('[ProfileManager] Failed to refresh user data or received error:', freshUserData);
                // Optionally, show a toast to the user if freshUserData indicates an error
                // this.toast.error('Erreur', 'Impossible de rafraîchir les données du profil après la mise à jour.');
            }
        } catch (error) {
            console.error('[ProfileManager] Erreur lors de l\'actualisation des données utilisateur:', error);
            // this.toast.error('Erreur', 'Une erreur technique est survenue lors du rafraîchissement des données.');
        }
    }    /**
     * Afficher la vue profil
     */
    showProfile() {
        console.log('🟢 showProfile() called');
        // Attendre que le DOM soit prêt avant d'initialiser les event listeners
        this.waitForProfileForm().then(() => {
            console.log('🟢 Profile form is ready, setting up listeners');
            this.setupEventListeners();
            this.loadProfile();
        });
    }
    
    /**
     * Attendre que le formulaire de profil soit disponible dans le DOM
     */
    async waitForProfileForm(maxAttempts = 10) {
        console.log('🟢 waitForProfileForm() called');
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const profileForm = document.getElementById('profile-form');
            console.log(`🟢 Attempt ${attempts + 1}: Profile form found:`, !!profileForm);
            
            if (profileForm) {
                console.log('🟢 Profile form found successfully!');
                return profileForm;
            }
            
            // Attendre 100ms avant le prochain essai
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.error('❌ Profile form not found after', maxAttempts, 'attempts');
        throw new Error('Profile form not found in DOM');
    }/**
     * Exposer les méthodes de debug globalement pour le test
     */
    exposeDebugMethods() {
        window.refreshUserData = this.refreshUserData.bind(this);
        window.debugProfile = this.debugProfile.bind(this);
        window.testToken = this.testToken.bind(this);
        window.testSaveProfile = this.testSaveProfile.bind(this);
    }
    
    /**
     * Test de sauvegarde du profil (sans submit de formulaire)
     */
    async testSaveProfile() {
        console.log('🔵 [TEST] Starting manual profile save test');
        
        // Tester directement la fonction saveProfile sans passer par le formulaire
        await this.saveProfile();
        
        console.log('🔵 [TEST] Manual profile save test completed');
    }
    
    /**
     * Tester si le token est valide
     */
    async testToken() {
        const token = localStorage.getItem('session_token');
        console.log('Session token:', token ? token.substring(0, 20) + '...' : 'NONE');
        
        if (!token) {
            console.error('❌ Aucun token trouvé dans localStorage');
            return false;
        }
        
        try {
            const response = await this.dataManager.apiRequest('auth.php?action=profile', 'GET', null);
            console.log('✅ Token valide, réponse:', response);
            return true;
        } catch (error) {
            console.error('❌ Token invalide:', error);
            return false;
        }
    }
    
    /**
     * Debug complet du profil
     */
    async debugProfile() {
        console.log('=== DEBUG PROFIL ===');
        console.log('1. Vérification du token...');
        const tokenValid = await this.testToken();
        
        if (!tokenValid) {
            console.log('❌ Arrêt - Token invalide');
            return;
        }
        
        console.log('2. Récupération des données du formulaire...');
        const formData = {
            username: document.getElementById('profile-username')?.value || 'N/A',
            first_name: document.getElementById('profile-first-name')?.value || 'N/A',
            last_name: document.getElementById('profile-last-name')?.value || 'N/A',
            email: document.getElementById('profile-email')?.value || 'N/A',
            email_notifications: document.getElementById('profile-email-notifications')?.checked || false,
            notification_days: document.getElementById('profile-notification-days')?.value || 'N/A'
        };
        console.log('Données du formulaire:', formData);
        
        console.log('3. Test de sauvegarde...');
        try {
            const result = await this.dataManager.updateProfile(formData);
            console.log('✅ Résultat de la sauvegarde:', result);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
        
        console.log('=== FIN DEBUG ===');
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}
