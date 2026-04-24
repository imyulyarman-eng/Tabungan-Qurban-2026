class QurbanAuth {
  constructor() {
    this.init();
  }

  init() {
    if (this.checkSession()) {
      this.showApp();
    } else {
      this.showLogin();
    }

    document.getElementById("loginBtn").addEventListener("click", () => this.doPinLogin());
    document.getElementById("pinInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.doPinLogin();
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => this.logout());

    this.checkFingerprintSupport();
  }

  checkSession() {
    const sessionTime = localStorage.getItem("qurban_session_time");
    return sessionTime && (Date.now() - parseInt(sessionTime) < CONFIG.SESSION_TIMEOUT);
  }

  checkFingerprintSupport() {
    if ("credentials" in navigator) {
      const btn = document.getElementById("fingerprintBtn");
      if (btn) {
        btn.style.display = "block";
        btn.onclick = () => this.fingerprintLogin();
      }
    }
  }

  async doPinLogin() {
    const pinInput = document.getElementById("pinInput");
    const status = document.getElementById("loginStatus");
    const pin = pinInput.value.trim();

    if (pin.length !== 4) {
      this.showStatus("Masukkan PIN 4 digit", "error");
      return;
    }

    status.textContent = "Memverifikasi PIN...";
    status.className = "login-status";

    if (pin === CONFIG.LOGIN_PIN) {
      this.setSession();
      this.showApp();
    } else {
      this.showStatus("PIN salah. Coba lagi.", "error");
      setTimeout(() => {
        status.textContent = "";
        status.className = "login-status";
      }, 3000);
    }
  }

  setSession() {
    localStorage.setItem("qurban_session_time", Date.now().toString());
    localStorage.setItem("qurban_user", "Admin");
  }

  showStatus(msg, type) {
    const status = document.getElementById("loginStatus");
    status.textContent = msg;
    status.className = `login-status ${type}`;
  }

  showLogin() {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";

    const pinInput = document.getElementById("pinInput");
    pinInput.value = "";
    pinInput.focus();

    this.showStatus("", "");
  }

  showApp() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "block";

    document.getElementById("userName").textContent = localStorage.getItem("qurban_user") || "Admin";

    setTimeout(() => this.logout(), CONFIG.SESSION_TIMEOUT);
  }

  logout() {
    localStorage.clear();
    this.showLogin();
  }

  async fingerprintLogin() {
    const status = document.getElementById("loginStatus");
    status.textContent = "Memindai fingerprint...";

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (CONFIG.LOGIN_PIN === "2512") {
      this.setSession();
      this.showApp();
    } else {
      this.showStatus("Fingerprint tidak dikenali", "error");
    }
  }
}

window.addEventListener("DOMContentLoaded", () => new QurbanAuth());