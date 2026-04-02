import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppRole, AuthService } from '../../services/auth.service';

interface MenuChildItem {
  label: string;
  route: string;
  roles: AppRole[];
  exact?: boolean;
}

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  roles: AppRole[];
  exact?: boolean;
  children?: MenuChildItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Input() isMobile = false;
  @Input() mobileOpen = false;
  @Output() menuNavigate = new EventEmitter<void>();

  private readonly menu: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/app/dashboard',
      icon: 'dashboard',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    // {
    //   label: 'New Requests',
    //   route: '/app/dashboard/requests',
    //   icon: 'notifications_active',
    //   roles: ['ROLE_ADMIN'],
    // },
    {
      label: 'Employees',
      icon: 'groups',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
      children: [
        {
          label: 'Employee List',
          route: '/app/employee',
          roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
        },

        // {
        //   label: 'Payroll',
        //   route: '/app/users',
        //   roles: ['ROLE_ADMIN'],
        // },
      ],
    },
    {
      label: 'Payroll',
      icon: 'folder_open',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
      children: [
        {
          label: 'Pay Slip',
          route: '/app/documents/pay-slip',
          roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
        },
        {
          label: 'CTC',
          route: '/app/documents/ctc',
          roles: ['ROLE_ADMIN'],
          // roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
        },
        // {
        //   label: 'Call Letter',
        //   route: '/app/documents/call-letter',
        //   roles: ['ROLE_ADMIN',],
        // },
      ],
    },
    {
      label: 'Attendance',
      route: '/app/attendance',
      icon: 'event_note',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
      exact: true,
    },
    {
      label: 'Leave Management',
      route: '/app/attendance/app-leave-management',
      icon: 'assignment',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
      exact: true,
    },
    // {
    //   label: 'Departments',
    //   route: '/app/departments',
    //   icon: 'apartment',
    //   roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER'],
    // },
    // {
    //   label: 'Reports',
    //   route: '/app/reports',
    //   icon: 'bar_chart',
    //   roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    // },
    {
      label: 'Holiday Calendar',
      route: '/app/company',
      icon: 'calendar_month',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    // {
    //   label: 'Settings',
    //   route: '/app/settings',
    //   icon: 'settings',
    //   roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    // },
    {
      label: 'Themes',
      route: '/app/themes',
      icon: 'palette',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },

  ];

  visibleMenu: MenuItem[] = [];
  expandedMenu: { [key: string]: boolean } = {};
  hoverExpanded = false;
  signoutDialogOpen = false;

  private routerEventsSubscription?: Subscription;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    const currentRole = this.authService.getRole();

    if (!currentRole) {
      this.visibleMenu = this.menu.map((item) => this.mapMenuItem(item, null));
      this.syncExpandedMenuWithRoute();
      return;
    }

    this.visibleMenu = this.menu
      .filter((item) => this.isAllowed(item.roles, currentRole))
      .map((item) => this.mapMenuItem(item, currentRole))
      .filter((item) => !item.children || item.children.length > 0);

    this.syncExpandedMenuWithRoute();

    this.routerEventsSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.syncExpandedMenuWithRoute();
        this.hoverExpanded = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerEventsSubscription?.unsubscribe();
  }

  toggleGroup(item: MenuItem): void {
    if (!item.children || item.children.length === 0) {
      return;
    }

    const nextState = !this.expandedMenu[item.label];
    this.expandedMenu = nextState ? { [item.label]: true } : {};
  }

  isGroupExpanded(item: MenuItem): boolean {
    return !!this.expandedMenu[item.label];
  }

  isGroupActive(item: MenuItem): boolean {
    if (!item.children) {
      return false;
    }

    return item.children.some((child) => this.router.isActive(child.route, false));
  }

  shouldShowLabels(): boolean {
    return !this.collapsed || this.isMobile || this.hoverExpanded;
  }

  shouldShowSubmenu(item: MenuItem): boolean {
    return this.shouldShowLabels() && !!item.children && item.children.length > 0;
  }

  handleMouseEnter(): void {
    if (!this.isMobile && this.collapsed) {
      this.hoverExpanded = true;
    }
  }

  handleMouseLeave(): void {
    if (!this.isMobile) {
      this.hoverExpanded = false;
    }
  }

  isDesktopHoverExpanded(): boolean {
    return !this.isMobile && this.collapsed && this.hoverExpanded;
  }

  handleMenuNavigate(): void {
    if (this.isMobile) {
      this.menuNavigate.emit();
    }
  }

  signOut(): void {
    this.signoutDialogOpen = true;
  }

  cancelSignOut(): void {
    this.signoutDialogOpen = false;
  }

  confirmSignOut(): void {
    this.signoutDialogOpen = false;
    this.authService.logout();
  }

  private isAllowed(roles: AppRole[], currentRole: AppRole | null): boolean {
    return !!currentRole && roles.includes(currentRole);
  }

  private mapMenuItem(item: MenuItem, currentRole: AppRole | null): MenuItem {
    const label = this.resolveMenuLabel(item.label, currentRole);

    if (!item.children) {
      return { ...item, label };
    }

    const children = currentRole
      ? item.children.filter((child) => this.isAllowed(child.roles, currentRole))
      : item.children;

    return {
      ...item,
      label,
      children,
    };
  }

  private resolveMenuLabel(label: string, currentRole: AppRole | null): string {
    if (label !== 'Payroll') {
      return label;
    }

    return currentRole === 'ROLE_ADMIN' ? 'Payroll' : 'Documents';
  }

  private syncExpandedMenuWithRoute(): void {
    const activeGroup = this.visibleMenu.find((item) => this.isGroupActive(item));
    this.expandedMenu = activeGroup ? { [activeGroup.label]: true } : {};
  }

  get userRole(): string {
    const rawRole = this.authService.getRole();
    if (!rawRole) return '';

    // Convert ROLE_* to user-friendly names for display
    switch (rawRole) {
      case 'ROLE_ADMIN': return 'Admin';
      case 'ROLE_COMPANY': return 'Company';
      case 'ROLE_MANAGER': return 'Manager';
      case 'ROLE_EMPLOYEE': return 'Employee';
      default: return rawRole;
    }
  }
}
