import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export type LoadingMode = 'boot' | 'route' | 'http' | 'idle';

export interface LoadingViewModel {
  visible: boolean;
  // mode: LoadingMode;
  // headline: string;
  // caption: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly bootLoadingSubject = new BehaviorSubject<boolean>(true);
  private readonly routeLoadingSubject = new BehaviorSubject<boolean>(false);
  private readonly httpRequestsSubject = new BehaviorSubject<number>(0);

  readonly state$ = combineLatest([
    this.bootLoadingSubject,
    this.routeLoadingSubject,
    this.httpRequestsSubject,
  ]).pipe(
    map(([bootLoading, routeLoading, httpRequests]) => {
      if (bootLoading) {
        return this.createState(
          true,
          // 'boot',
          // 'Preparing your workspace',
          // 'Launching modules, permissions, and application shell.'
        );
      }

      if (routeLoading) {
        return this.createState(
          true,
          // 'route',
          // 'Opening the next page',
          // 'Arranging navigation, layout, and live page content.'
        );
      }

      if (httpRequests > 0) {
        return this.createState(
          false,
          // 'http',
          // 'Syncing live data',
          // 'Fetching secure API data and updating the latest records.'
        );
      }

      return this.createState(false);
      // return this.createState(false, 'idle', '', '');
    })
  );

  startBootLoading(): void {
    this.bootLoadingSubject.next(true);
  }

  stopBootLoading(): void {
    this.bootLoadingSubject.next(false);
  }

  startRouteLoading(): void {
    this.routeLoadingSubject.next(true);
  }

  stopRouteLoading(): void {
    this.routeLoadingSubject.next(false);
  }

  startHttpLoading(): void {
    this.httpRequestsSubject.next(this.httpRequestsSubject.value + 1);
  }

  stopHttpLoading(): void {
    this.httpRequestsSubject.next(Math.max(0, this.httpRequestsSubject.value - 1));
  }

  private createState(
    visible: boolean,
    // mode: LoadingMode,
    // headline: string,
    // caption: string
  ): LoadingViewModel {
    // return { visible, mode, headline, caption };
    return { visible };
  }
}
