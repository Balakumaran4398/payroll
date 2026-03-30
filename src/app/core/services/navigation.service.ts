import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly dashboardUrl = '/app/dashboard';
  private previousUrl = this.dashboardUrl;
  private currentUrl = this.dashboardUrl;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = this.normalizeUrl(event.urlAfterRedirects);
      });
  }

  getPreviousUrl(): string {
    return this.previousUrl || this.dashboardUrl;
  }

  isDashboardRoute(url?: string | null): boolean {
    return this.normalizeUrl(url) === this.dashboardUrl;
  }

  getDashboardUrl(): string {
    return this.dashboardUrl;
  }

  private normalizeUrl(url?: string | null): string {
    const value = `${url || ''}`.trim();
    if (!value) {
      return this.dashboardUrl;
    }

    return value.split('?')[0].split('#')[0] || this.dashboardUrl;
  }
}
