import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ApiService } from '../../services/api.service';
import { TokenStorageService } from '../../services/token-storage.service';

interface HeaderNotificationItem {
  title: string;
  description: string;
  time: string;
  icon: string;
  route?: string;
}

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
  notificationsCount = 0;
  readonly searchPlaceholder = 'Search employees, attendance, reports';
  notificationPanelOpen = false;
  notificationPanelClosing = false;
  notifications: HeaderNotificationItem[] = [];
  empid: number;
  notification = 0;
  constructor(
    private authService: AuthService,
    private themeService: ThemeService, private tokenServie: TokenStorageService,
    private apiService: ApiService,
    private router: Router,
  ) {
    this.empid = tokenServie.getID();
  }

  ngOnInit(): void {
    this.updateViewportState();
    this.getNotifications();
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
  // toggleNotificationsPanel(): void {
  //   if (this.notificationPanelOpen) {
  //     this.closeNotificationsPanel();
  //     return;
  //   }

  //   this.openNotificationsPanel();
  // }

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

  onNotificationClick(notification: HeaderNotificationItem): void {
    if (!notification.route) {
      return;
    }

    this.closeNotificationsPanel(true);
    this.router.navigate(['/app/attendance']);
  }

  getNotifications(): void {
    this.apiService.getNotifications(this.empid).subscribe({
      next: (data: any) => {
        const pendingOnDuty = Number(data?.pending_onduty || 0);
        const pendingLeave = Number(data?.pending_leave || 0);
        const pending_permission = Number(data?.pending_permission || 0);
        const pending_swipe = Number(data?.pending_swipe || 0);

        this.notification = pendingOnDuty + pendingLeave + pending_permission + pending_swipe;
        this.notificationsCount = this.notification;
        this.notifications = this.buildNotifications(pendingLeave, pendingOnDuty,pending_permission,pending_swipe);
      },
      error: () => {
        this.notification = 0;
        this.notificationsCount = 0;
        this.notifications = this.buildNotifications(0, 0,0,0);
      },
    });
  }

  private buildNotifications(pendingLeave: number, pendingOnDuty: number,pending_swipe:number,pending_permission:number): HeaderNotificationItem[] {
    const notifications: HeaderNotificationItem[] = [];

    if (pendingLeave > 0) {
      notifications.push({
        title: `Pending Leave Requests (${pendingLeave})`,
        description: `${pendingLeave} leave request${pendingLeave === 1 ? '' : 's'} waiting in Attendance.`,
        time: 'Open Attendance',
        icon: 'event_note',
        route: '/app/attendance',
      });
    }

    if (pendingOnDuty > 0) {
      notifications.push({
        title: `Pending OD Requests (${pendingOnDuty})`,
        description: `${pendingOnDuty} on duty request${pendingOnDuty === 1 ? '' : 's'} waiting in Attendance.`,
        time: 'Open Attendance',
        icon: 'work_history',
        route: '/app/attendance',
      });
    }
    if (pending_swipe > 0) {
      notifications.push({
        title: `Swipe Requests (${pending_swipe})`,
        description: `${pending_swipe} Swipe request${pending_swipe === 1 ? '' : 's'} waiting in Attendance.`,
        time: 'Open Attendance',
        icon: 'work_history',
        route: '/app/attendance',
      });
    }
    if (pending_permission > 0) {
      notifications.push({
        title: `Pending OD Requests (${pending_permission})`,
        description: `${pending_permission} Permission request${pending_permission === 1 ? '' : 's'} waiting in Attendance.`,
        time: 'Open Attendance',
        icon: 'work_history',
        route: '/app/attendance',
      });
    }

    if (!notifications.length) {
      notifications.push({
        title: 'No pending notifications',
        description: 'There are no attendance notifications right now.',
        time: 'All caught up',
        icon: 'notifications_off',
      });
    }

    return notifications;
  }
}
