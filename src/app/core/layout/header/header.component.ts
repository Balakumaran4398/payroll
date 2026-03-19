import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly profileCloseDurationMs = 340;
  profilePanelOpen = false;
  profilePanelClosing = false;
  confirmDialogOpen = false;
  isSidebarOpen = true;
  constructor(private authService: AuthService) { }

  get role(): string {
    const rawRole = this.authService.getRole();
    if (!rawRole) return 'Guest';

    // Convert ROLE_* to user-friendly names
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
    const value = this.username || 'U';
    return value.substring(0, 2).toUpperCase();
  }

  openProfilePanel(): void {
    this.profilePanelClosing = false;
    this.profilePanelOpen = true;
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
    this.isSidebarOpen = !this.isSidebarOpen; // toggle state
    this.toggleSidebar.emit(); // notify parent
  }

}
