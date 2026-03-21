import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly LOGIN_TIMESTAMP_KEY = 'payrol_login_timestamp';
  private loginTimestamp: number | null = null;
  private readonly sessionStorageRef = sessionStorage;

  constructor() {
    this.loadLoginTimestamp();
  }

  // Set login timestamp for session validation
  setLoginTimestamp(): void {
    this.loginTimestamp = Date.now();
    this.sessionStorageRef.setItem(this.LOGIN_TIMESTAMP_KEY, this.loginTimestamp.toString());
  }

  // Load login timestamp from localStorage
  private loadLoginTimestamp(): void {
    const stored = this.sessionStorageRef.getItem(this.LOGIN_TIMESTAMP_KEY);
    if (stored) {
      this.loginTimestamp = parseInt(stored, 10);
    }
  }

  // Clear login timestamp on logout
  clearLoginTimestamp(): void {
    this.loginTimestamp = null;
    this.sessionStorageRef.removeItem(this.LOGIN_TIMESTAMP_KEY);
  }

  // Get session age in minutes
  getSessionAge(): number {
    if (!this.loginTimestamp) return 0;
    return (Date.now() - this.loginTimestamp) / (1000 * 60);
  }

  // Validate current session
  isSessionValid(): boolean {
    if (!this.loginTimestamp) return false;

    // Check session age (optional: implement session timeout)
    const sessionAge = this.getSessionAge();
    const maxSessionAge = 480; // 8 hours in minutes

    return sessionAge < maxSessionAge;
  }

  // Force logout and clear all data
  forceLogout(): void {
    this.clearLoginTimestamp();
    // Clear localStorage
    localStorage.clear();
    // Clear sessionStorage
    sessionStorage.clear();
  }
}
