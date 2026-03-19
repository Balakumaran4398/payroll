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
import { AuthService } from '../services/auth.service';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private authService: AuthService, private router: Router, private securityService: SecurityService) {}

  canActivate(
    _next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth(state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const targetUrl = `/${[route.path || '', ...segments.map((segment) => segment.path)].filter(Boolean).join('/')}`;
    return this.checkAuth(targetUrl);
  }

  private checkAuth(returnUrl: string): boolean | UrlTree {
    if (this.authService.isAuthenticated() && this.securityService.isSessionValid()) {
      return true;
    }

    this.authService.clearSession();

    return this.router.createUrlTree(['/auth/login'], {
      queryParams: {
        returnUrl: returnUrl || '/app/dashboard',
        reason: 'session-expired',
      },
    });
  }
}
