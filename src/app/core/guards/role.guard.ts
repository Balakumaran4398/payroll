import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppRole, AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate, CanLoad {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const roles = (route.data.roles || []) as AppRole[];
    return this.checkRole(roles);
  }

  canLoad(route: Route, _segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    const roles = ((route.data && route.data.roles) || []) as AppRole[];
    return this.checkRoleForLoad(roles);
  }

  private checkRole(allowedRoles: AppRole[]): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.parseUrl('/auth/login');
    }

    if (!allowedRoles.length || this.authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    return this.router.parseUrl('/dashboard');
  }

  private checkRoleForLoad(allowedRoles: AppRole[]): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!allowedRoles.length || this.authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
