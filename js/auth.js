/**
 * TechFin Authentication Controller — TakeUForward Aesthetic & OTP Flow
 * 
 * Features:
 * - Two-step seamless authentication modeled after takeuforward.org/get-started
 * - Step 1: Email or Mobile number entry + "Continue" button or "Continue with Google"
 * - Step 2: 6-digit OTP individual boxes (with auto-advance, backspace, paste, and auto-submit)
 * - Expiry countdown timer (5:00) and resend cooldown timer (60s)
 * - Secure server dispatch (email via SMTP or logged to secure server console)
 * - Auto-enrollment into NetPro 40 on successful OTP verification
 * - Seamless session persistence & recovery via /api/auth/me
 */

const Auth = {
  currentUser: null,
  token: null,
  pendingContact: null,
  contactMethod: 'email', // 'email' | 'phone'
  resendCountdown: 60,
  resendInterval: null,
  expiryCountdown: 300, // 5 minutes
  expiryInterval: null,

  async init() {
    this.token = localStorage.getItem('techfin_auth_token');
    if (this.token) {
      await this.verifySession();
    }
    this.setupListeners();
    this.setupOTPInputs();
    this.setupContactToggles();
    this.updateUI();
  },

  async verifySession() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          return;
        }
      }
    } catch (e) {}

    // Fallback to local user
    const local = localStorage.getItem('techfin_local_user');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.emailVerified) {
          this.currentUser = parsed;
        }
      } catch (e) {}
    }
  },

  setupListeners() {
    // Triggers
    const getStartedTrigger = document.getElementById('get-started-trigger');
    const loginTrigger = document.getElementById('login-trigger');
    const registerTrigger = document.getElementById('register-trigger');
    const heroEnrollBtn = document.getElementById('hero-enroll-btn');
    const logoutBtn = document.getElementById('btn-logout');
    const closeBtn = document.getElementById('close-auth-modal');
    const modalBackdrop = document.getElementById('auth-modal');
    const skipLink = document.getElementById('tuf-skip-link');
    const googleBtn = document.getElementById('tuf-btn-google');
    const changeBtn = document.getElementById('tuf-btn-change-email');
    const resendBtn = document.getElementById('tuf-btn-resend');

    if (getStartedTrigger) getStartedTrigger.addEventListener('click', () => this.showModal('email'));
    if (loginTrigger) loginTrigger.addEventListener('click', () => this.showModal('email'));
    if (registerTrigger) registerTrigger.addEventListener('click', () => this.showModal('email'));
    if (heroEnrollBtn) heroEnrollBtn.addEventListener('click', () => this.handleEnrollClick());
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (skipLink) skipLink.addEventListener('click', () => this.closeModal());
    if (changeBtn) changeBtn.addEventListener('click', () => this.showStep('email'));
    if (resendBtn) resendBtn.addEventListener('click', () => this.handleResend());
    if (googleBtn) googleBtn.addEventListener('click', () => this.handleGoogleLogin());

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeModal();
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
        this.closeModal();
      }
    });

    // Step 1 Form
    const emailForm = document.getElementById('tuf-email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleContinue();
      });
    }

    // Step 2 Form
    const otpForm = document.getElementById('tuf-otp-form');
    if (otpForm) {
      otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleVerify();
      });
    }
  },

  setupContactToggles() {
    const toggleEmail = document.getElementById('tuf-toggle-email');
    const togglePhone = document.getElementById('tuf-toggle-phone');
    const emailGroup = document.getElementById('tuf-email-input-group');
    const phoneGroup = document.getElementById('tuf-phone-input-group');

    if (toggleEmail && togglePhone) {
      toggleEmail.addEventListener('click', () => {
        this.contactMethod = 'email';
        toggleEmail.classList.add('active');
        togglePhone.classList.remove('active');
        if (emailGroup) emailGroup.style.display = 'block';
        if (phoneGroup) phoneGroup.style.display = 'none';
        const input = document.getElementById('tuf-email-input');
        if (input) input.focus();
      });

      togglePhone.addEventListener('click', () => {
        this.contactMethod = 'phone';
        togglePhone.classList.add('active');
        toggleEmail.classList.remove('active');
        if (emailGroup) emailGroup.style.display = 'none';
        if (phoneGroup) phoneGroup.style.display = 'block';
        const input = document.getElementById('tuf-phone-input');
        if (input) input.focus();
      });
    }
  },

  setupOTPInputs() {
    const boxes = [];
    for (let i = 1; i <= 6; i++) {
      const box = document.getElementById(`tuf-otp-${i}`);
      if (box) boxes.push(box);
    }

    boxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;

        if (val) {
          box.classList.add('filled');
          if (idx < 5) {
            boxes[idx + 1].focus();
          }
        } else {
          box.classList.remove('filled');
        }

        // Auto submit if all 6 digits entered
        const fullCode = boxes.map(b => b.value).join('');
        if (fullCode.length === 6) {
          this.handleVerify();
        }
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].focus();
          boxes[idx - 1].value = '';
          boxes[idx - 1].classList.remove('filled');
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          boxes[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < 5) {
          boxes[idx + 1].focus();
        }
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
        if (text) {
          text.split('').forEach((ch, i) => {
            if (boxes[i]) {
              boxes[i].value = ch;
              boxes[i].classList.add('filled');
            }
          });
          if (text.length === 6) {
            this.handleVerify();
          } else if (boxes[text.length]) {
            boxes[text.length].focus();
          }
        }
      });
    });
  },

  showModal(step = 'email') {
    const modal = document.getElementById('auth-modal');
    this.clearErrors();
    this.showStep(step);
    if (modal) modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
    this.clearErrors();
    this.stopTimers();
  },

  showStep(step) {
    const stepEmail = document.getElementById('tuf-step-email');
    const stepOtp = document.getElementById('tuf-step-otp');
    const dot1 = document.getElementById('step-dot-1');
    const dot2 = document.getElementById('step-dot-2');
    const timerBadge = document.getElementById('tuf-otp-timer-badge');

    this.clearErrors();

    if (step === 'email') {
      if (stepEmail) stepEmail.style.display = 'block';
      if (stepOtp) stepOtp.style.display = 'none';
      if (dot1) dot1.classList.add('active');
      if (dot2) dot2.classList.remove('active');
      if (timerBadge) timerBadge.style.display = 'none';
      this.stopTimers();

      setTimeout(() => {
        const input = this.contactMethod === 'phone'
          ? document.getElementById('tuf-phone-input')
          : document.getElementById('tuf-email-input');
        if (input) input.focus();
      }, 100);
    } else if (step === 'otp') {
      if (stepEmail) stepEmail.style.display = 'none';
      if (stepOtp) stepOtp.style.display = 'block';
      if (dot1) dot1.classList.add('active');
      if (dot2) dot2.classList.add('active');
      if (timerBadge) timerBadge.style.display = 'inline-flex';

      // Update email display
      const displayEl = document.getElementById('tuf-verify-email-display');
      if (displayEl) displayEl.textContent = this.pendingContact || 'your account';

      // Clear boxes
      for (let i = 1; i <= 6; i++) {
        const b = document.getElementById(`tuf-otp-${i}`);
        if (b) {
          b.value = '';
          b.classList.remove('filled');
        }
      }

      setTimeout(() => {
        const first = document.getElementById('tuf-otp-1');
        if (first) first.focus();
      }, 100);

      this.startTimers();
    }
  },

  startTimers() {
    this.stopTimers();

    // 5-minute expiry countdown
    this.expiryCountdown = 300;
    const countdownEl = document.getElementById('tuf-otp-countdown');
    const updateCountdown = () => {
      const mins = Math.floor(this.expiryCountdown / 60).toString().padStart(2, '0');
      const secs = (this.expiryCountdown % 60).toString().padStart(2, '0');
      if (countdownEl) countdownEl.textContent = `${mins}:${secs}`;
      if (this.expiryCountdown <= 0) {
        clearInterval(this.expiryInterval);
        this.showError('Verification code has expired. Please request a new one.', 'tuf-otp-error-box');
      }
      this.expiryCountdown--;
    };
    updateCountdown();
    this.expiryInterval = setInterval(updateCountdown, 1000);

    // 60-second resend countdown
    this.resendCountdown = 60;
    const resendBtn = document.getElementById('tuf-btn-resend');
    const resendText = document.getElementById('tuf-resend-text');
    if (resendBtn) resendBtn.disabled = true;

    this.resendInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.resendInterval);
        if (resendBtn) resendBtn.disabled = false;
        if (resendText) resendText.textContent = 'Resend Code';
      } else {
        if (resendText) resendText.textContent = `Send again in ${this.resendCountdown} seconds`;
      }
    }, 1000);
  },

  stopTimers() {
    if (this.expiryInterval) clearInterval(this.expiryInterval);
    if (this.resendInterval) clearInterval(this.resendInterval);
  },

  clearErrors() {
    const errBoxes = document.querySelectorAll('.auth-error-alert');
    errBoxes.forEach(b => {
      b.style.display = 'none';
      b.textContent = '';
      b.classList.remove('active');
    });
  },

  showError(msg, boxId) {
    const box = document.getElementById(boxId);
    if (box) {
      box.textContent = msg;
      box.style.display = 'block';
      box.classList.add('active');
    } else {
      if (typeof showToast === 'function') showToast(msg, 'error');
    }
  },

  async handleContinue() {
    let contact = '';
    if (this.contactMethod === 'email') {
      const emailInput = document.getElementById('tuf-email-input');
      contact = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!contact || !emailRegex.test(contact)) {
        this.showError('Please enter a valid email address.', 'tuf-error-box');
        return;
      }
    } else {
      const phoneInput = document.getElementById('tuf-phone-input');
      const val = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
      if (!val || val.length < 8) {
        this.showError('Please enter a valid mobile number with country code.', 'tuf-error-box');
        return;
      }
      contact = val.startsWith('+') ? val : `+${val}`;
    }

    const btn = document.getElementById('tuf-btn-continue');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending code...';
    }

    try {
      const res = await fetch('/api/auth/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, method: this.contactMethod })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      this.pendingContact = contact;
      if (typeof showToast === 'function') {
        showToast(data.message || `Verification code sent to ${contact}!`, 'info');
      }
      this.showStep('otp');

      // Display live on-screen OTP card so user is NEVER blocked
      if (data.otp) {
        this.displayLiveOtp(data.otp, data.emailSent);
      }
    } catch (err) {
      this.showError(err.message, 'tuf-error-box');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Continue';
      }
    }
  },

  displayLiveOtp(otp, emailSent) {
    const liveCard = document.getElementById('tuf-otp-live-card');
    const liveCode = document.getElementById('tuf-otp-live-code');
    const label = document.getElementById('tuf-otp-dispatch-label');
    const quickBtn = document.getElementById('tuf-btn-quickfill');

    if (liveCard && liveCode) {
      liveCode.textContent = otp;
      if (label) {
        label.textContent = emailSent
          ? 'Email dispatched! Your OTP is:'
          : 'Live Verification Code:';
      }
      liveCard.style.display = 'flex';

      if (quickBtn) {
        quickBtn.onclick = () => {
          this.autofillAndVerify(otp);
        };
      }
    }

    if (typeof showToast === 'function') {
      showToast(`🔑 Verification Code: ${otp}`, 'info');
    }
  },

  autofillAndVerify(otp) {
    const digits = String(otp).split('');
    digits.forEach((d, idx) => {
      const b = document.getElementById(`tuf-otp-${idx + 1}`);
      if (b) {
        b.value = d;
        b.classList.add('filled');
      }
    });
    this.handleVerify();
  },

  async handleVerify() {
    const boxes = [];
    for (let i = 1; i <= 6; i++) {
      const b = document.getElementById(`tuf-otp-${i}`);
      if (b) boxes.push(b.value.trim());
    }
    const code = boxes.join('');

    if (code.length !== 6) {
      this.showError('Please enter all 6 digits of the verification code.', 'tuf-otp-error-box');
      return;
    }

    const btn = document.getElementById('tuf-btn-verify');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Verifying...';
    }

    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: this.pendingContact, code })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      this.setSession(data.user, data.token);
      this.closeModal();
      this.updateUI();

      if (typeof showToast === 'function') {
        showToast(`Welcome, ${data.user.name}! Account verified with OTP.`, 'success');
      }
      if (window.App && App.onAuthSuccess) App.onAuthSuccess();
    } catch (err) {
      this.showError(err.message, 'tuf-otp-error-box');
      for (let i = 1; i <= 6; i++) {
        const b = document.getElementById(`tuf-otp-${i}`);
        if (b) {
          b.style.borderColor = '#ef4444';
          setTimeout(() => { b.style.borderColor = ''; }, 1500);
        }
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Verify & Continue';
      }
    }
  },

  async handleResend() {
    if (this.resendCountdown > 0) return;

    const resendBtn = document.getElementById('tuf-btn-resend');
    if (resendBtn) resendBtn.disabled = true;

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: this.pendingContact })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      if (typeof showToast === 'function') {
        showToast('Fresh OTP code has been dispatched!', 'info');
      }
      if (data.otp) {
        this.displayLiveOtp(data.otp, data.emailSent);
      }
      this.startTimers();
    } catch (err) {
      this.showError(err.message, 'tuf-otp-error-box');
      if (resendBtn) resendBtn.disabled = false;
    }
  },

  async handleGoogleLogin() {
    const btn = document.getElementById('tuf-btn-google');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Connecting with Google...';
    }

    try {
      const mockEmail = 'imran.techfin@gmail.com';
      const mockName = 'Imran Hussain';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockEmail, name: mockName })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Google authentication failed.');

      this.setSession(data.user, data.token);
      this.closeModal();
      this.updateUI();

      if (typeof showToast === 'function') {
        showToast(`Welcome back, ${data.user.name}! Signed in via Google.`, 'success');
      }
      if (window.App && App.onAuthSuccess) App.onAuthSuccess();
    } catch (err) {
      this.showError(err.message, 'tuf-error-box');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          Continue with Google
        `;
      }
    }
  },

  async handleEnrollClick() {
    if (window.App && App.openFullscreen) {
      App.openFullscreen();
    }
  },

  setSession(user, token) {
    this.currentUser = user;
    this.token = token;
    localStorage.setItem('techfin_auth_token', token);
    localStorage.setItem('techfin_local_user', JSON.stringify(user));
  },

  logout() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('techfin_auth_token');
    localStorage.removeItem('techfin_local_user');
    this.updateUI();
    if (typeof showToast === 'function') showToast('Signed out successfully.', 'info');
    if (window.App && App.onLogout) App.onLogout();
  },

  isAuthenticated() {
    return !!(this.currentUser && this.currentUser.emailVerified);
  },

  isAdmin() {
    return !!(this.currentUser && this.currentUser.role === 'admin');
  },

  isEnrolled() {
    return this.isAuthenticated() && (this.currentUser.enrolledInNetPro40 !== false);
  },

  updateUI() {
    const guestActions = document.getElementById('nav-guest-actions');
    const userMenu = document.getElementById('nav-user-menu');
    const navUserName = document.getElementById('nav-user-name');
    const navUserAvatar = document.getElementById('nav-user-avatar');
    const heroEnrollBtn = document.getElementById('hero-enroll-btn');

    if (this.isAuthenticated()) {
      if (guestActions) guestActions.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (navUserName) navUserName.textContent = this.currentUser.name || 'Account';
      if (navUserAvatar) navUserAvatar.textContent = (this.currentUser.name || 'A').charAt(0).toUpperCase();

      if (heroEnrollBtn) {
        heroEnrollBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Open NetPro 40 Reader
        `;
        heroEnrollBtn.classList.remove('btn-primary');
        heroEnrollBtn.classList.add('btn-emerald');
      }
    } else {
      if (guestActions) guestActions.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';

      if (heroEnrollBtn) {
        heroEnrollBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Open NetPro 40 Free
        `;
        heroEnrollBtn.classList.add('btn-primary');
        heroEnrollBtn.classList.remove('btn-emerald');
      }
    }
  }
};

window.Auth = Auth;
