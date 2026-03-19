import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService, AppRole } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<string> {

  constructor(private authService: AuthService) {}

  resolve(): Observable<string> {
    const role = this.authService.getRole();

    switch (role) {
      case 'ROLE_ADMIN':
        return of('admin');
      case 'ROLE_COMPANY':
      case 'ROLE_MANAGER':
        return of('company');
      case 'ROLE_EMPLOYEE':
        return of('employee');
      default:
        return of('default');
    }
  }
}
