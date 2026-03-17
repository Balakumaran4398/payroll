import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class TokenStorageService {
  private readonly TOKEN_KEY = 'payrol_token';
  private readonly ROLE_KEY = 'payrol_role';
  private readonly USERNAME_KEY = 'payrol_username';
  private readonly REMEMBERED_USERNAME_KEY = 'payrol_remembered_username';

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  saveRole(roles: any[]): void {
    localStorage.setItem(this.ROLE_KEY, JSON.stringify(roles));
  }

  getRole(): string | null {
    const roles = JSON.parse(localStorage.getItem(this.ROLE_KEY) || '[]');
    return Array.isArray(roles) && roles.length > 0 ? roles[0] : null;
  }

  saveUsername(username: string): void {
    localStorage.setItem(this.USERNAME_KEY, username);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  saveRememberedUsername(username: string): void {
    localStorage.setItem(this.REMEMBERED_USERNAME_KEY, username);
  }

  getRememberedUsername(): string | null {
    return localStorage.getItem(this.REMEMBERED_USERNAME_KEY);
  }

  clearRememberedUsername(): void {
    localStorage.removeItem(this.REMEMBERED_USERNAME_KEY);
  }

  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
  }
}
