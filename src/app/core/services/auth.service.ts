import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';
import { SecurityService } from './security.service';

export type AppRole = 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  type: number;
  parent_id: number;
  mobile: string;
  email: string;
  isactive: boolean;
  isdelete: boolean;
  createddate: string;
  updateddate: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];
  employee_name: string;
  id: number;
}

export interface SignUpResponse {
  id: number;
  type: number | string;
  message?: string;
}

export interface BusinessUnitType {
  id: number;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  static AUTH_URL(): string {
    return 'http://192.168.1.105:8081/api/auth';
  }

  static BASE_URL(): string {
    return 'http://192.168.1.105:8081/api/v1';
  }

  constructor(
    private storage: TokenStorageService,
    private router: Router,
    private http: HttpClient,
    private securityService: SecurityService
  ) { }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${AuthService.AUTH_URL()}/signin`, {
      username: payload.username,
      password: payload.password,
    }).pipe(
      tap((res) => {
        this.storage.saveToken(res.token);
        this.storage.saveRole(res.roles);
        this.storage.saveUsername(res.username);
        this.storage.saveEmployee(res.employee_name);
        this.storage.saveID(res.id);
        this.securityService.setLoginTimestamp();
      })
    );
  }

  getBusinessUnitTypes(): Observable<BusinessUnitType[]> {
    const url = `${AuthService.BASE_URL()}/common/getbusinessunittypes`;
    return this.http.get<any>(url).pipe(
      map((response) => {
        const source = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
              ? response.result
              : [];

        return source
          .map((item: any) => ({
            id: Number(item?.id || item?.business_unit_type_id || item?.type_id || 0),
            type: `${item?.type || item?.business_unit_type || item?.name || ''}`.trim(),
          }))
          .filter((item: BusinessUnitType) => item.id > 0 && !!item.type);
      })
    );
  }

  createCompany(payload: SignUpPayload): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(`${AuthService.AUTH_URL()}/createcompany`, {
      name: payload.name,
      type: payload.type,
      parent_id: payload.parent_id,
      mobile: payload.mobile,
      email: payload.email,
      isactive: payload.isactive,
      isdelete: payload.isdelete,
      createddate: payload.createddate,
      updateddate: payload.updateddate,
      password: payload.password,
    }).pipe(
      tap((res) => {
        this.storage.saveCompanyId(res.id);
        this.storage.saveCompanyType(res.type);
        this.securityService.setLoginTimestamp();
      })
    );
  }

  logout(): void {
    if (this.isAuthenticated()) {
      this.http.post(`${AuthService.BASE_URL()}/logout`, {}).subscribe({
        next: () => {
          this.clearSession();
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        },
        error: () => {
          this.clearSession();
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        },
      });
      return;
    }

    this.clearSession();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  isAuthenticated(): boolean {
    return !!this.storage.getToken();
  }

  hasValidSession(): boolean {
    return this.isAuthenticated() && this.securityService.isSessionValid();
  }

  clearSession(): void {
    this.storage.clear();
    this.securityService.clearLoginTimestamp();
  }

  getRole(): AppRole | null {
    const role = this.storage.getRole();
    return (role as AppRole | null) || null;
  }

  getToken(): string | null {
    return this.storage.getToken();
  }
  getID(): any | null {
    console.log("ID ===============>",this.storage.getID());

    return this.storage.getID();
  }

  getUsername(): string {
    return this.storage.getUsername() || '';
  }

  getEmpname(): string {
    return this.storage.getEmpname() || '';
  }

  getRememberedUsername(): string {
    return this.storage.getRememberedUsername() || '';
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const currentRole = this.getRole();
    return !!currentRole && roles.includes(currentRole);
  }
}
