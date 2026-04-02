import { Injectable, OnInit } from '@angular/core';
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
  empid: number;
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
export interface CompanyDetails {
  companyidid: number;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnInit {
  static AUTH_URL(): string {
    // return 'http://192.168.1.105:8081/api/auth';
    return 'http://192.168.70.100:8585/dsr/api/auth';
    // return 'https://crm.ridsys.in:8080/dsr/api/auth';
  }

  static BASE_URL(): string {
    // return 'http://192.168.1.105:8081/api/v1';
    return 'http://192.168.70.100:8585/dsr/api/v1';
    // return 'https://crm.ridsys.in:8080/dsr/api/v1';
  }
  username: any;
  constructor(
    private storage: TokenStorageService,
    private router: Router,
    private http: HttpClient,
    private securityService: SecurityService
  ) {

  }
  ngOnInit(): void {
    this.getUsername();
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${AuthService.AUTH_URL()}/signin`, {
      username: payload.username,
      password: payload.password,
    }).pipe(
      tap((res) => {
        const displayName = this.resolveDisplayName(res.employee_name, res.username);
        this.storage.saveToken(res.token);
        this.storage.saveRole(res.roles);
        this.storage.saveUsername(res.username);
        this.storage.saveEmployee(displayName);
        this.storage.saveID(res.empid);
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
          this.router.navigate(['/'], { replaceUrl: true });
        },
        error: () => {
          this.clearSession();
          this.router.navigate(['/'], { replaceUrl: true });
        },
      });
      return;
    }

    this.clearSession();
    this.router.navigate(['/'], { replaceUrl: true });
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
    console.log("ID   ======>",this.storage.getID());
    
    return this.storage.getID();
  }

  getUsername(): string {
    return this.storage.getUsername() || '';
  }

  getEmpname(): string {
    const storedName = `${this.storage.getEmpname() || ''}`.trim();
    return storedName || this.resolveDisplayName('', this.getUsername());
  }

  getRememberedUsername(): string {
    return this.storage.getRememberedUsername() || '';
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const currentRole = this.getRole();
    return !!currentRole && roles.includes(currentRole);
  }

  resolveDisplayName(employeeName?: string | null, username?: string | null): string {
    const normalizedEmployeeName = `${employeeName || ''}`.trim();

    if (normalizedEmployeeName && !normalizedEmployeeName.includes('@')) {
      return this.toDisplayCase(normalizedEmployeeName);
    }

    const normalizedUsername = `${username || ''}`.trim();
    const source = normalizedEmployeeName || normalizedUsername;

    if (!source) {
      return 'Employee';
    }

    const localPart = source.includes('@') ? source.split('@')[0] : source;
    const cleanedName = localPart.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();

    return cleanedName ? this.toDisplayCase(cleanedName) : 'Employee';
  }

  private toDisplayCase(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => {
        if (part.length <= 2) {
          return part.toUpperCase();
        }

        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
