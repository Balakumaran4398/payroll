import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from './token-storage.service';

export type AppRole = 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_EMPLOYEE';

export interface LoginPayload {
  username: string;
  password: string;
  // rememberMe: boolean;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];   // ✅ FIX HERE
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  static AUTH_URL(): string {
    return 'http://192.168.1.105:8081/api/auth';
    // return 'https://crm.ridsys.in:8080/dsr/api/auth';
  }

  static BASE_URL(): string {
    return '192.168.1.105:8081/api/v1/user';
    // return 'https://crm.ridsys.in:8080/api/v1/user';

  }

  constructor(private storage: TokenStorageService, private router: Router, private http: HttpClient) { }

login(payload: LoginPayload): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(AuthService.AUTH_URL() + '/signin', {
    username: payload.username,
    password: payload.password
  }).pipe(
    tap((res) => {
      this.storage.saveToken(res.token);
      this.storage.saveRole(res.roles); // take first role
      this.storage.saveUsername(res.username);
    })
  );
}

  logout(): void {
    if (this.isAuthenticated()) {
      this.http.post(AuthService.BASE_URL() + '/logout', {}).subscribe({
        next: () => {
          this.storage.clear();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.storage.clear();
          this.router.navigate(['/auth/login']);
        }
      });
    } else {
      this.storage.clear();
      this.router.navigate(['/auth/login']);
    }
  }

  isAuthenticated(): boolean {
    return !!this.storage.getToken();
  }

  getRole(): AppRole | null {
    const role = this.storage.getRole();
    return role as AppRole | null;
  }

  getUsername(): string {
    return this.storage.getUsername() || '';
  }

  getRememberedUsername(): string {
    return this.storage.getRememberedUsername() || '';
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const currentRole = this.getRole();
    return !!currentRole && roles.includes(currentRole);
  }
}
