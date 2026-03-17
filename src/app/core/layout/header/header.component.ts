import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  profilePanelOpen = false;
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
    this.profilePanelOpen = true;
  }

  closeProfilePanel(): void {
    this.profilePanelOpen = false;
    this.confirmDialogOpen = false;
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
    this.authService.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmDialogOpen) {
      this.confirmDialogOpen = false;
      return;
    }

    if (this.profilePanelOpen) {
      this.profilePanelOpen = false;
    }
  }
  onToggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen; // toggle state
    this.toggleSidebar.emit(); // notify parent
  }

}
