import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class TokenStorageService {
  private readonly TOKEN_KEY = 'payrol_token';
  private readonly ID_KEY = 'payrol_ID';
  private readonly ROLE_KEY = 'payrol_role';
  private readonly COMPANY_ID_KEY = 'payrol_company_id';
  private readonly COMPANY_TYPE_KEY = 'payrol_company_type';
  private readonly USERNAME_KEY = 'payrol_username';
  private readonly EMPLOYEENAME_KEY = 'payrol_employee_name';
  private readonly REMEMBERED_USERNAME_KEY = 'payrol_remembered_username';
  private readonly authStorage = sessionStorage;

  saveToken(token: string): void {
    this.authStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return this.authStorage.getItem(this.TOKEN_KEY);
  }
  saveID(id: any): void {
    this.authStorage.setItem(this.ID_KEY, id);
  }

  getID(): any | null {
    return this.authStorage.getItem(this.ID_KEY);
  }

  saveRole(roles: any[]): void {
    this.authStorage.setItem(this.ROLE_KEY, JSON.stringify(roles));
  }

  getRole(): string | null {
    const roles = JSON.parse(this.authStorage.getItem(this.ROLE_KEY) || '[]');
    return Array.isArray(roles) && roles.length > 0 ? roles[0] : null;
  }
  saveCompanyId(id: any): void {
    this.authStorage.setItem(this.COMPANY_ID_KEY, id);
  }

  getCompanyId(): any | null {
    return this.authStorage.getItem(this.COMPANY_ID_KEY);
  }

  saveCompanyType(type: any): void {
    this.authStorage.setItem(this.COMPANY_TYPE_KEY, JSON.stringify(type));
  }

  getCompanyType(): any | null {
    return this.authStorage.getItem(this.COMPANY_TYPE_KEY);

  }

  saveUsername(username: string): void {
    this.authStorage.setItem(this.USERNAME_KEY, username);
  }

  getUsername(): string | null {
    return this.authStorage.getItem(this.USERNAME_KEY);
  }
  saveEmployee(empname: any): void {
    this.authStorage.setItem(this.EMPLOYEENAME_KEY, empname);
  }

  getEmpname(): string | null {
    return this.authStorage.getItem(this.EMPLOYEENAME_KEY);
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
  saveBusinessUnits(data: any[]) {
    localStorage.setItem('businessUnits', JSON.stringify(data));
  }

  getBusinessUnits() {
    return JSON.parse(localStorage.getItem('businessUnits') || '[]');
  }
  clear(): void {
    this.authStorage.removeItem(this.TOKEN_KEY);
    this.authStorage.removeItem(this.ROLE_KEY);
    this.authStorage.removeItem(this.USERNAME_KEY);
    this.authStorage.removeItem(this.EMPLOYEENAME_KEY);
  }
}
