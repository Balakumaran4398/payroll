import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly LOGIN_TIMESTAMP_KEY = 'payrol_login_timestamp';
  private readonly SESSION_TAB_ID_KEY = 'payrol_session_tab_id';
  private loginTimestamp: number | null = null;
  private sessionTabId: string | null = null;
  private currentTabId = '';
  private readonly sessionStorageRef = sessionStorage;

  constructor() {
    this.initializeTabId();
    this.loadLoginTimestamp();
  }

  setLoginTimestamp(): void {
    this.loginTimestamp = Date.now();
    this.sessionTabId = this.currentTabId;
    this.sessionStorageRef.setItem(this.LOGIN_TIMESTAMP_KEY, this.loginTimestamp.toString());
    this.sessionStorageRef.setItem(this.SESSION_TAB_ID_KEY, this.sessionTabId);
  }

  private loadLoginTimestamp(): void {
    const storedTimestamp = this.sessionStorageRef.getItem(this.LOGIN_TIMESTAMP_KEY);
    const storedTabId = this.sessionStorageRef.getItem(this.SESSION_TAB_ID_KEY);

    if (storedTimestamp) {
      this.loginTimestamp = parseInt(storedTimestamp, 10);
    }

    this.sessionTabId = storedTabId || null;
  }

  clearLoginTimestamp(): void {
    this.loginTimestamp = null;
    this.sessionTabId = null;
    this.sessionStorageRef.removeItem(this.LOGIN_TIMESTAMP_KEY);
    this.sessionStorageRef.removeItem(this.SESSION_TAB_ID_KEY);
  }

  getSessionAge(): number {
    if (!this.loginTimestamp) return 0;
    return (Date.now() - this.loginTimestamp) / (1000 * 60);
  }

  isSessionValid(): boolean {
    if (!this.loginTimestamp) return false;
    if (!this.sessionTabId || this.sessionTabId !== this.currentTabId) return false;

    const sessionAge = this.getSessionAge();
    const maxSessionAge = 480; // 8 hours in minutes

    return sessionAge < maxSessionAge;
  }

  isBrowserPageLoad(): boolean {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return false;
    }

    const navigationEntries = performance.getEntriesByType?.('navigation') as PerformanceNavigationTiming[] | undefined;
    const navigationType = navigationEntries?.[0]?.type;
    if (navigationType) {
      return navigationType === 'navigate' || navigationType === 'reload';
    }

    const legacyNavigation = (performance as any).navigation;
    return legacyNavigation?.type === 0 || legacyNavigation?.type === 1;
  }

  forceLogout(): void {
    this.clearLoginTimestamp();
    localStorage.clear();
    sessionStorage.clear();
  }

  private initializeTabId(): void {
    if (typeof window === 'undefined') {
      this.currentTabId = '';
      return;
    }

    const existingTabId = `${window.name || ''}`.trim();
    if (existingTabId) {
      this.currentTabId = existingTabId;
      return;
    }

    this.currentTabId = `payrol_tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.name = this.currentTabId;
  }
}
