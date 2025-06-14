// AuthManager pour BirthdayReminder
class AuthManager {
  constructor() {
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
    this.init();
  }

  init() {
    // Vérifier la session au chargement
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      this.verifySession(sessionToken).then(isValid => {
        if (isValid) {
          document.dispatchEvent(new Event('authSuccess'));
        } else {
          this.showAuthModal();
        }
      });
    } else {
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
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        this.logout();
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
  }

  showAuthModal() {
    if (this.authModal) this.authModal.classList.remove('hidden');
    if (this.authError) this.authError.classList.add('hidden');
    if (this.authLoading) this.authLoading.classList.add('hidden');
    this.toggleAuthForm('login');
  }

  hideAuthModal() {
    if (this.authModal) this.authModal.classList.add('hidden');
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
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
      localStorage.setItem('session_token', data.session_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      this.updateUsernameDisplay(data.user.username);
      this.hideAuthModal();
      document.dispatchEvent(new Event('authSuccess'));
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
      localStorage.setItem('session_token', data.session_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      this.updateUsernameDisplay(data.user.username);
      this.hideAuthModal();
      document.dispatchEvent(new Event('authSuccess'));
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
      this.updateUsernameDisplay(data.user.username);
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
    if (!token) return;
    try {
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
}

// Rendre AuthManager global
window.AuthManager = AuthManager;
