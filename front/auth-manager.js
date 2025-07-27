// AuthManager pour BirthdayReminder
class AuthManager {  constructor() {
    console.log('Initializing AuthManager...');
    
    // Get DOM elements - with fallback retry mechanism
    this.authModal = document.getElementById('auth-modal');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.authSwitchBtn = document.getElementById('auth-switch-btn');
    this.authSwitchText = document.getElementById('auth-switch-text');
    this.authError = document.getElementById('auth-error');
    this.authLoading = document.getElementById('auth-loading');
    this.usernameDisplay = document.getElementById('username-display');
    this.logoutBtn = document.getElementById('logout-btn');
    this.profileBtn = document.getElementById('profile-btn');
    this.demoBtns = document.querySelectorAll('.demo-btn');
    
    console.log('AuthManager elements found:', {
      authModal: !!this.authModal,
      loginForm: !!this.loginForm,
      registerForm: !!this.registerForm,
      authSwitchBtn: !!this.authSwitchBtn,
      authError: !!this.authError
    });
    
    this.init();  }
  
  init() {
    console.log('AuthManager init called');
    
    // Vérifier s'il y a un token de réinitialisation dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    
    if (resetToken) {
      console.log('Token de réinitialisation détecté:', resetToken);
      // S'assurer que le DOM est prêt et attendre un peu
      setTimeout(() => {
        this.showAuthModal(true); // true = ne pas basculer vers le formulaire de connexion
        this.showResetPasswordForm(resetToken);
        this.setupEvents();
      }, 100); // Petit délai pour s'assurer que le DOM est prêt
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Vérifier la session au chargement
    const sessionToken = localStorage.getItem('session_token');
    console.log('Session token found:', !!sessionToken);
    
    if (sessionToken) {
      console.log('Verifying session token...');
      this.verifySession(sessionToken).then(isValid => {
        console.log('Session verification result:', isValid);
        if (isValid) {
          this.hideAuthModal();
          document.dispatchEvent(new Event('authSuccess'));
        } else {
          console.log('Session invalid, showing auth modal');
          this.showAuthModal();
        }
      });
    } else {
      console.log('No session token, showing auth modal');
      this.showAuthModal();
    }
    this.setupEvents();
  }

  setupEvents() {
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', e => {
        e.preventDefault();
        this.login();
      });
    }
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', e => {
        e.preventDefault();
        this.register();
      });
    }
    if (this.authSwitchBtn) {
      this.authSwitchBtn.addEventListener('click', () => {
        this.toggleAuthForm();
      });
    }
    
    // Event listeners pour les formulaires de mot de passe oublié
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', e => {
        e.preventDefault();
        this.handleForgotPassword();
      });
    }
    
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
      resetPasswordForm.addEventListener('submit', e => {
        e.preventDefault();
        this.handleResetPassword();
      });
    }
    
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }if (this.profileBtn) {
      this.profileBtn.addEventListener('click', () => {
        if (window.showView) {
          window.showView('profile');
        } else {
          console.error('showView function not available');
        }
        document.getElementById('user-dropdown').classList.add('hidden'); // Fermer le dropdown
      });
    }
    if (this.demoBtns) {
      this.demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const username = btn.getAttribute('data-username');
          const password = btn.getAttribute('data-password');
          this.login(username, password);
        });
      });
    }
  }  showAuthModal(skipFormSwitch = false) {
    console.log('showAuthModal called - skipFormSwitch:', skipFormSwitch);
    
    // Re-get elements if they weren't found initially
    if (!this.authModal) {
      this.authModal = document.getElementById('auth-modal');
      console.log('Re-fetched auth modal:', this.authModal);
    }
    if (!this.authError) {
      this.authError = document.getElementById('auth-error');
    }
    if (!this.authLoading) {
      this.authLoading = document.getElementById('auth-loading');
    }
    
    if (this.authModal) {
      console.log('Showing auth modal - removing hidden class');
      this.authModal.classList.remove('hidden');
    } else {
      console.error('Auth modal element not found!');
    }
    
    if (this.authError) this.authError.classList.add('hidden');
    if (this.authLoading) this.authLoading.classList.add('hidden');
    if (!skipFormSwitch) {
      this.toggleAuthForm('login');
    }
  }
  hideAuthModal() {
    if (this.authModal) {
      this.authModal.classList.add('hidden');
      // Force le reflow pour s'assurer que la classe est appliquée
      this.authModal.offsetHeight;
    }
  }

  toggleAuthForm(mode) {
    if (!mode) mode = this.loginForm.classList.contains('hidden') ? 'login' : 'register';
    if (mode === 'login') {
      this.loginForm.classList.remove('hidden');
      this.registerForm.classList.add('hidden');
      this.authSwitchText.textContent = 'Pas encore de compte ?';
      this.authSwitchBtn.textContent = "S'inscrire";
    } else {
      this.loginForm.classList.add('hidden');
      this.registerForm.classList.remove('hidden');
      this.authSwitchText.textContent = 'Déjà inscrit ?';
      this.authSwitchBtn.textContent = 'Se connecter';
    }
    if (this.authError) this.authError.classList.add('hidden');
  }
  async login(username, password) {
    if (!username) username = document.getElementById('login-username').value;
    if (!password) password = document.getElementById('login-password').value;
    this.setLoading(true);
    try {
      const res = await fetch('https://rappelanniv.aa-world.store/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes('Email non vérifié')) {
          this.showError('Votre email n\'est pas vérifié. Veuillez vérifier votre boîte de réception.');
        } else {
          throw new Error(data.error || 'Erreur de connexion');
        }
      } else {
        localStorage.setItem('session_token', data.session_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        this.updateUsernameDisplay(data.user ? data.user.username : 'Invité');
        this.hideAuthModal();
        window.location.reload();
        document.dispatchEvent(new Event('authSuccess'));
      }
    } catch (e) {
      this.showError(e.message);
    } finally {
      this.setLoading(false);
    }
  }

  async register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm-password').value;
    if (password !== confirm) {
      this.showError('Les mots de passe ne correspondent pas');
      return;
    }
    this.setLoading(true);
    try {
      const res = await fetch('https://rappelanniv.aa-world.store/api/auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'inscription");
      // Do not log in immediately, show verification message
      this.showSuccess('Un email de vérification a été envoyé à ' + email + '. Veuillez vérifier votre boîte de réception.');
      // Optionally clear the register form
      if (this.registerForm) {
        this.registerForm.reset();
      }
    } catch (e) {
      this.showError(e.message);
    } finally {
      this.setLoading(false);
    }
  }
  async verifySession(token) {
    try {
      const res = await fetch('https://rappelanniv.aa-world.store/api/auth.php?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      this.updateUsernameDisplay(data.user ? data.user.username : 'Invité');
      return true;
    } catch {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_data');
      this.updateUsernameDisplay('Invité');
      return false;
    }
  }

  async logout() {
    const token = localStorage.getItem('session_token');
    if (!token) return;    try {
      await fetch('https://rappelanniv.aa-world.store/api/auth.php?action=logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token })
      });
    } catch {}
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_data');
    this.updateUsernameDisplay('Invité');
    document.dispatchEvent(new Event('authLogout'));
    this.showAuthModal();
  }

  updateUsernameDisplay(username) {
    if (this.usernameDisplay) this.usernameDisplay.textContent = username || 'Invité';
  }
  setLoading(isLoading) {
    if (this.authLoading) this.authLoading.classList.toggle('hidden', !isLoading);
  }
  showError(msg) {
    if (this.authError) {
      this.authError.textContent = msg;
      this.authError.classList.remove('hidden');
    }
  }

  showSuccess(msg) {
    if (this.authError) {
      this.authError.textContent = msg;
      this.authError.classList.remove('hidden');
      this.authError.style.color = '#28a745'; // green color for success
    }
  }

  // Gérer la soumission du formulaire de mot de passe oublié
  async handleForgotPassword() {
    const emailInput = document.getElementById('forgot-email');
    if (!emailInput) return;

    const email = emailInput.value.trim();
    if (!email) {
      this.showError('Veuillez entrer votre adresse email');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showError('Veuillez entrer une adresse email valide');
      return;
    }

    this.setLoading(true);
    const success = await this.forgotPassword(email);
    this.setLoading(false);

    if (!success) {
      // L'erreur est déjà affichée par forgotPassword
    }
  }

  // Gérer la soumission du formulaire de réinitialisation
  async handleResetPassword() {
    const resetForm = document.getElementById('reset-password-form');
    const newPasswordInput = document.getElementById('reset-new-password');
    const confirmPasswordInput = document.getElementById('reset-confirm-password');

    if (!resetForm || !newPasswordInput || !confirmPasswordInput) return;

    const token = resetForm.dataset.token;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
      this.showError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      this.showError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.setLoading(true);
    const success = await this.resetPassword(token, newPassword, confirmPassword);
    this.setLoading(false);

    if (!success) {
      // L'erreur est déjà affichée par resetPassword
    }
  }

  // Validation d'email simple
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  // Demande de réinitialisation de mot de passe
  async forgotPassword(email) {
    try {
      const response = await fetch('https://rappelanniv.aa-world.store/api/auth.php?action=forgotpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showForgotPasswordSuccess();
        return true;
      } else {
        this.showError(data.error || 'Erreur lors de l\'envoi de l\'email');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      this.showError('Erreur de connexion');
      return false;
    }
  }
  // Réinitialisation du mot de passe avec token
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      const response = await fetch('https://rappelanniv.aa-world.store/api/auth.php?action=reset_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showResetPasswordSuccess();
        return true;
      } else {
        this.showError(data.error || 'Erreur lors de la réinitialisation');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      this.showError('Erreur de connexion');
      return false;
    }
  }

  // Afficher le formulaire de mot de passe oublié
  showForgotPasswordForm() {
    if (this.loginForm) this.loginForm.classList.add('hidden');
    if (this.registerForm) this.registerForm.classList.add('hidden');
    
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
      forgotForm.classList.remove('hidden');
    }
    
    // Mettre à jour le bouton de basculement
    if (this.authSwitchBtn) {
      this.authSwitchBtn.textContent = 'Retour à la connexion';
      this.authSwitchBtn.onclick = () => this.showLoginForm();
    }
  }

  // Afficher le formulaire de connexion
  showLoginForm() {
    const forgotForm = document.getElementById('forgot-password-form');
    const resetForm = document.getElementById('reset-password-form');
    
    if (forgotForm) forgotForm.classList.add('hidden');
    if (resetForm) resetForm.classList.add('hidden');
    if (this.registerForm) this.registerForm.classList.add('hidden');
    if (this.loginForm) this.loginForm.classList.remove('hidden');
    
    // Restaurer le bouton de basculement
    if (this.authSwitchBtn) {
      this.authSwitchBtn.textContent = 'Créer un compte';
      this.authSwitchBtn.onclick = () => this.toggleAuthForm();
    }
  }
  // Afficher le formulaire de réinitialisation
  showResetPasswordForm(token) {
    console.log('showResetPasswordForm appelé avec token:', token);
    
    // Masquer tous les autres formulaires
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-password-form');
    const resetForm = document.getElementById('reset-password-form');
    
    if (loginForm) {
      loginForm.classList.add('hidden');
      console.log('Login form caché');
    }
    if (registerForm) {
      registerForm.classList.add('hidden');
      console.log('Register form caché');
    }
    if (forgotForm) {
      forgotForm.classList.add('hidden');
      console.log('Forgot form caché');
    }
    
    if (resetForm) {
      resetForm.classList.remove('hidden');
      resetForm.dataset.token = token;
      console.log('Reset form affiché avec token:', token);
    } else {
      console.error('Reset form non trouvé!');
    }
    
    // Mettre à jour le bouton de basculement pour revenir à la connexion
    if (this.authSwitchBtn) {
      this.authSwitchBtn.textContent = 'Retour à la connexion';
      this.authSwitchBtn.onclick = () => this.showLoginForm();
    }
  }

  // Afficher le message de succès pour mot de passe oublié
  showForgotPasswordSuccess() {
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
      forgotForm.innerHTML = `
        <div class="text-center">
          <div class="success-icon mb-3">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745;"></i>
          </div>
          <h3>Email envoyé!</h3>
          <p>Un lien de réinitialisation a été envoyé à votre adresse email.</p>
          <p class="text-muted small">Vérifiez vos spams si vous ne le trouvez pas.</p>
          <button type="button" class="btn btn-primary mt-3" onclick="authManager.showLoginForm()">
            Retour à la connexion
          </button>
        </div>
      `;
    }
  }

  // Afficher le message de succès pour réinitialisation
  showResetPasswordSuccess() {
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
      resetForm.innerHTML = `
        <div class="text-center">
          <div class="success-icon mb-3">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745;"></i>
          </div>
          <h3>Mot de passe modifié!</h3>
          <p>Votre mot de passe a été modifié avec succès.</p>
          <button type="button" class="btn btn-primary mt-3" onclick="authManager.showLoginForm()">
            Se connecter
          </button>
        </div>
      `;
    }
  }
}

// Rendre AuthManager global
window.AuthManager = AuthManager;
