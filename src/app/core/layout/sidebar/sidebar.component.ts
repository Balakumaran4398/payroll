import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AppRole, AuthService } from '../../services/auth.service';

interface MenuChildItem {
  label: string;
  route: string;
  roles: AppRole[];
}

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  roles: AppRole[];
  children?: MenuChildItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
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
        {
          label: 'Attendance',
          route: '/app/attendance',
          roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
        },
        {
          label: 'Payroll',
          route: '/app/users',
          roles: ['ROLE_ADMIN'],
        },
      ],
    },
    {
      label: 'Departments',
      route: '/app/departments',
      icon: 'apartment',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER'],
    },
    {
      label: 'Reports',
      route: '/app/reports',
      icon: 'bar_chart',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Settings',
      route: '/app/settings',
      icon: 'settings',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Themes',
      route: '/app/themes',
      icon: 'palette',
      roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
  ];

  visibleMenu: MenuItem[] = [];
  expandedMenu: { [key: string]: boolean } = {};

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const currentRole = this.authService.getRole();
    console.log('Sidebar initialized with role:', currentRole);

    if (!currentRole) {
      console.log('No role found, showing all menu items for testing');
      // If no role, show all menu items for debugging
      this.visibleMenu = this.menu.map((item) => {
        if (!item.children) {
          return item;
        }
        return { ...item, children: item.children };
      });
      return;
    }

    this.visibleMenu = this.menu
      .filter((item) => this.isAllowed(item.roles, currentRole))
      .map((item) => {
        if (!item.children) {
          return item;
        }

        const filteredChildren = item.children.filter((child) =>
          this.isAllowed(child.roles, currentRole)
        );

        return { ...item, children: filteredChildren };
      })
      .filter((item) => !item.children || item.children.length > 0);
  }

  toggleGroup(item: MenuItem): void {
    if (!item.children || item.children.length === 0) {
      return;
    }

    // Toggle the dropdown expansion
    this.expandedMenu[item.label] = !this.expandedMenu[item.label];
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
    return !this.collapsed || this.isMobile;
  }

  shouldShowSubmenu(item: MenuItem): boolean {
    return this.shouldShowLabels() && !!item.children && item.children.length > 0;
  }

  handleMenuNavigate(): void {
    if (this.isMobile) {
      this.menuNavigate.emit();
    }
  }

  private isAllowed(roles: AppRole[], currentRole: AppRole | null): boolean {
    return !!currentRole && roles.includes(currentRole);
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

  get userRoleClass(): string {
    const rawRole = this.authService.getRole();
    if (!rawRole) return '';

    // Return lowercase version for CSS classes
    switch (rawRole) {
      case 'ROLE_ADMIN': return 'admin';
      case 'ROLE_COMPANY': return 'company';
      case 'ROLE_MANAGER': return 'manager';
      case 'ROLE_EMPLOYEE': return 'employee';
      default: return (rawRole as string).toLowerCase();
    }
  }
}
