import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  collapsed = false;
  isMobile = false;
  isTablet = false;
  mobileMenuOpen = false;

  private viewportMode: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  private collapsedPreference = false;

  ngOnInit(): void {
    this.updateViewportState();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      return;
    }

    this.collapsed = !this.collapsed;
    this.collapsedPreference = this.collapsed;
  }

  closeMobileMenu(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = false;
    }
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
  }
}
