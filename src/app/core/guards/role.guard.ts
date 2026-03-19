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
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const roles = (route.data.roles || []) as AppRole[];
    return this.checkRole(roles, state.url);
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const roles = ((route.data && route.data.roles) || []) as AppRole[];
    const targetUrl = `/${[route.path || '', ...segments.map((segment) => segment.path)].filter(Boolean).join('/')}`;
    return this.checkRole(roles, targetUrl);
  }

  private checkRole(allowedRoles: AppRole[], returnUrl: string): boolean | UrlTree {
    if (!this.authService.hasValidSession()) {
      this.authService.clearSession();
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: {
          returnUrl: returnUrl || '/app/dashboard',
          reason: 'session-expired',
        },
      });
    }

    if (!allowedRoles.length || this.authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    return this.router.parseUrl('/app/dashboard');
  }
}
