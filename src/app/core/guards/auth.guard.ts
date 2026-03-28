import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {

  constructor(
    private authService: AuthService,
    private router: Router,
    private securityService: SecurityService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    return this.handleAuth(state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): boolean | UrlTree {

    const url = `/${[route.path || '', ...segments.map(s => s.path)]
      .filter(Boolean)
      .join('/')}`;

    return this.handleAuth(url);
  }

  // ✅ Common auth logic
  private handleAuth(returnUrl: string): boolean | UrlTree {

    const isLoggedIn = this.authService.isAuthenticated();
    const isSessionValid = this.securityService.isSessionValid();

    // ✅ If logged in → allow access
    if (isLoggedIn && isSessionValid) {
      return true;
    }

    // ❌ If not logged in → clear session
    this.authService.clearSession();

    // 🔁 Redirect to login with return URL
    return this.router.createUrlTree(['/'], {
      queryParams: {
        returnUrl: returnUrl || '/app/dashboard'
      }
    });
  }
}