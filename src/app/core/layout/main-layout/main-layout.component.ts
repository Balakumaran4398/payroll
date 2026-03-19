import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChildrenOutletContexts } from '@angular/router';
import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { LayoutOverlayContainer } from '../../services/layout-overlay-container.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(
          ':enter, :leave',
          [
            style({
              position: 'absolute',
              inset: 0,
              width: '100%',
            }),
          ],
          { optional: true }
        ),
        group([
          query(
            ':leave',
            [
              animate(
                '180ms ease-out',
                style({
                  opacity: 0,
                  transform: 'translateY(8px)',
                })
              ),
            ],
            { optional: true }
          ),
          query(
            ':enter',
            [
              style({
                opacity: 0,
                transform: 'translateY(10px)',
              }),
              animate(
                '240ms cubic-bezier(0.22, 1, 0.36, 1)',
                style({
                  opacity: 1,
                  transform: 'translateY(0)',
                })
              ),
            ],
            { optional: true }
          ),
        ]),
      ]),
    ]),
  ],
})
export class MainLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('contentOverlayHost', { static: true }) contentOverlayHost?: ElementRef<HTMLElement>;

  collapsed = false;
  isMobile = false;
  isTablet = false;
  mobileMenuOpen = false;

  private viewportMode: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  private collapsedPreference = false;

  constructor(
    private overlayContainer: LayoutOverlayContainer,
    private contexts: ChildrenOutletContexts,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.updateViewportState();
  }

  ngAfterViewInit(): void {
    this.overlayContainer.setHostElement(this.contentOverlayHost?.nativeElement || null);
  }

  ngOnDestroy(): void {
    this.overlayContainer.setHostElement(null);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      this.applyLayoutCssVars();
      return;
    }

    this.collapsed = !this.collapsed;
    this.collapsedPreference = this.collapsed;
    this.applyLayoutCssVars();
  }

  closeMobileMenu(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = false;
      this.applyLayoutCssVars();
    }
  }

  prepareRoute(): string {
    const primaryContext = this.contexts.getContext('primary');
    const routeSnapshot = primaryContext?.route?.snapshot;
    return routeSnapshot?.routeConfig?.path || routeSnapshot?.url.map((segment) => segment.path).join('/') || 'root';
  }

  private updateViewportState(): void {
    const width = window.innerWidth;
    const nextMode = width < 768 ? 'mobile' : width < 1200 ? 'tablet' : 'desktop';

    if (nextMode !== this.viewportMode) {
      if (nextMode === 'mobile') {
        this.mobileMenuOpen = false;
        this.collapsed = false;
      } else if (nextMode === 'tablet') {
        this.mobileMenuOpen = false;
        this.collapsed = this.collapsedPreference;
      } else {
        this.mobileMenuOpen = false;
        this.collapsed = this.collapsedPreference;
      }

      this.viewportMode = nextMode;
    }

    this.isMobile = nextMode === 'mobile';
    this.isTablet = nextMode === 'tablet';
    this.applyLayoutCssVars();
  }

  private applyLayoutCssVars(): void {
    const sidebarOffset = this.isMobile ? 0 : this.collapsed ? 88 : 260;
    this.document.documentElement.style.setProperty('--shell-sidebar-offset', `${sidebarOffset}px`);
    this.document.documentElement.style.setProperty('--shell-header-height', '64px');
  }
}
