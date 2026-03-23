import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly profileCloseDurationMs = 340;
  private readonly notificationCloseDurationMs = 300;
  profilePanelOpen = false;
  profilePanelClosing = false;
  confirmDialogOpen = false;
  isSidebarOpen = true;
  isMobileViewport = false;
  notificationsCount = 3;
  readonly searchPlaceholder = 'Search employees, attendance, reports';
  notificationPanelOpen = false;
  notificationPanelClosing = false;
  readonly notifications = [
    { title: 'Attendance regularization pending', description: '3 requests require manager review today.', time: '5 min ago', icon: 'schedule' },
    { title: 'Festival calendar updated', description: 'Next month highlights were synced with the dashboard calendar.', time: '18 min ago', icon: 'event' },
    { title: 'Directory refresh complete', description: 'Employee directory was updated with the latest team data.', time: '1 hour ago', icon: 'groups' },
  ];

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
  ) { }

  ngOnInit(): void {
    this.updateViewportState();
  }

  get role(): string {
    const rawRole = this.authService.getRole();
    if (!rawRole) return 'Guest';

    switch (rawRole) {
      case 'ROLE_ADMIN': return 'Admin';
      case 'ROLE_COMPANY': return 'Company';
      case 'ROLE_MANAGER': return 'Manager';
      case 'ROLE_EMPLOYEE': return 'Employee';
      default: return rawRole;
    }
  }

  getRawRole(): string {
    return this.authService.getRole() || '';
  }

  get username(): string {
    return this.authService.getUsername() || 'User';
  }

  get empname(): string {
    return this.authService.getEmpname() || 'Employee';
  }

  get userEmail(): string {
    const username = this.authService.getUsername();
    if (!username) {
      return 'user@demo.app';
    }

    return username.indexOf('@') > -1 ? username : username + '@demo.app';
  }

  get userInitials(): string {
    const source = this.empname || this.username || 'User';
    const initials = source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'US';
  }

  get isDarkMode(): boolean {
    return this.themeService.currentMode === 'dark';
  }

  get themeToggleLabel(): string {
    return this.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';
  }

  get themeModeLabel(): string {
    return this.isDarkMode ? 'Dark mode' : 'Light mode';
  }

  get themeModeHint(): string {
    return this.isDarkMode ? 'Use light workspace' : 'Use dark workspace';
  }

  toggleThemeMode(): void {
    this.themeService.toggleMode();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.confirmDialogOpen) {
      this.cancelSignout();
      return;
    }

    if (this.notificationPanelOpen) {
      this.closeNotificationsPanel();
      return;
    }

    if (this.profilePanelOpen) {
      this.closeProfilePanel();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  openProfilePanel(): void {
    this.closeNotificationsPanel(true);
    this.profilePanelClosing = false;
    this.profilePanelOpen = true;
  }

  toggleProfilePanel(): void {
    if (this.profilePanelOpen) {
      this.closeProfilePanel();
      return;
    }

    this.openProfilePanel();
  }

  closeProfilePanel(): void {
    if (!this.profilePanelOpen || this.profilePanelClosing) {
      return;
    }

    this.profilePanelClosing = true;
    window.setTimeout(() => {
      this.profilePanelOpen = false;
      this.profilePanelClosing = false;
      this.confirmDialogOpen = false;
    }, this.profileCloseDurationMs);
  }

  onProfileStageClick(): void {
    if (!this.confirmDialogOpen) {
      this.closeProfilePanel();
    }
  }

  toggleNotificationsPanel(): void {
    if (this.notificationPanelOpen) {
      this.closeNotificationsPanel();
      return;
    }

    this.openNotificationsPanel();
  }

  openNotificationsPanel(): void {
    this.closeProfilePanel();
    this.notificationPanelClosing = false;
    this.notificationPanelOpen = true;
  }

  closeNotificationsPanel(immediate = false): void {
    if (!this.notificationPanelOpen || this.notificationPanelClosing) {
      return;
    }

    if (immediate) {
      this.notificationPanelOpen = false;
      this.notificationPanelClosing = false;
      return;
    }

    this.notificationPanelClosing = true;
    window.setTimeout(() => {
      this.notificationPanelOpen = false;
      this.notificationPanelClosing = false;
    }, this.notificationCloseDurationMs);
  }

  onNotificationsStageClick(): void {
    this.closeNotificationsPanel();
  }

  requestSignout(): void {
    this.confirmDialogOpen = true;
  }

  cancelSignout(): void {
    this.confirmDialogOpen = false;
  }

  confirmSignout(): void {
    this.confirmDialogOpen = false;
    this.profilePanelOpen = false;
    this.profilePanelClosing = false;
    this.authService.logout();
  }

  onToggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.toggleSidebar.emit();
  }

  private updateViewportState(): void {
    this.isMobileViewport = window.innerWidth < 768;
  }
}
