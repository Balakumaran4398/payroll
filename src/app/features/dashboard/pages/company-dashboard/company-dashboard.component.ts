import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { Employee } from '../../../employee/employee.types';

interface AttendanceSummaryCard {
  label: string;
  value: number;
  icon: string;
  tone: 'present' | 'late' | 'absent' | 'leave';
}

interface PendingApprovalItem {
  employee: string;
  request: string;
  submittedAt: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface TeamMember {
  name: string;
  email: string;
  department: string;
  position: string;
  status: 'Active' | 'WFH' | 'On Leave';
  initials: string;
  imageUrl: string;
}

@Component({
  selector: 'app-company-dashboard',
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.scss'],
})
export class CompanyDashboardComponent implements OnInit {
  constructor(private apiService: ApiService, private authService: AuthService) {}

  readonly today = new Date();
  readonly heroDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(this.today);
  readonly panelDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(this.today);

  managerName = 'Alice';
  teamName = 'Engineering';
  currentRoleLabel = 'Manager';
  teamMembersCount = 15;
  attendanceRate = 0;
  managerImageUrl = '';

  attendanceSummary: AttendanceSummaryCard[] = [
    { label: 'Present', value: 0, icon: 'check_circle', tone: 'present' },
    { label: 'Late', value: 0, icon: 'schedule', tone: 'late' },
    { label: 'Absent', value: 0, icon: 'highlight_off', tone: 'absent' },
    { label: 'On Leave', value: 0, icon: 'event_note', tone: 'leave' },
  ];

  teamAttendance: Array<{ name: string; status: string }> = [];

  pendingApprovals: PendingApprovalItem[] = [];

  teamMembers: TeamMember[] = [
    {
      name: 'Bob Martinez',
      email: 'bob.martinez@company.com',
      department: 'Engineering',
      position: 'Full Stack Developer',
      status: 'Active',
      initials: 'BM',
      imageUrl: '',
    },
    {
      name: 'Carol Chen',
      email: 'carol.chen@company.com',
      department: 'Engineering',
      position: 'DevOps Engineer',
      status: 'Active',
      initials: 'CC',
      imageUrl: '',
    },
    {
      name: 'David Singh',
      email: 'david.singh@company.com',
      department: 'Engineering',
      position: 'Frontend Engineer',
      status: 'WFH',
      initials: 'DS',
      imageUrl: '',
    },
    {
      name: 'Emma Wilson',
      email: 'emma.wilson@company.com',
      department: 'Engineering',
      position: 'QA Analyst',
      status: 'Active',
      initials: 'EW',
      imageUrl: '',
    },
    {
      name: 'Frank Lee',
      email: 'frank.lee@company.com',
      department: 'Engineering',
      position: 'Backend Engineer',
      status: 'On Leave',
      initials: 'FL',
      imageUrl: '',
    },
  ];

  ngOnInit(): void {
    this.initializeSessionContext();
    this.loadDashboardData();
    this.loadEmployeeContext();
  }

  private loadDashboardData(): void {
    this.apiService.callApi('getcompanydashboard').subscribe({
      next: (data) => {
        if (!data) {
          return;
        }

        if (typeof data.managerName === 'string' && data.managerName.trim()) {
          this.managerName = data.managerName;
        }

        if (typeof data.teamName === 'string' && data.teamName.trim()) {
          this.teamName = data.teamName;
        }

        if (typeof data.teamMembersCount === 'number') {
          this.teamMembersCount = data.teamMembersCount;
        }

        if (typeof data.attendanceRate === 'number') {
          this.attendanceRate = data.attendanceRate;
        }

        if (Array.isArray(data.attendanceSummary) && data.attendanceSummary.length) {
          this.attendanceSummary = data.attendanceSummary;
        }

        if (Array.isArray(data.teamAttendance)) {
          this.teamAttendance = data.teamAttendance;
        }

        if (Array.isArray(data.pendingApprovals)) {
          this.pendingApprovals = data.pendingApprovals;
        }

        if (Array.isArray(data.teamMembers) && data.teamMembers.length) {
          this.teamMembers = data.teamMembers.map((member: Partial<TeamMember>) => ({
            name: member.name || 'Employee',
            email: member.email || '',
            department: member.department || this.teamName,
            position: member.position || 'Team Member',
            status: (member.status as TeamMember['status']) || 'Active',
            initials: member.initials || this.getInitials(member.name || 'Employee'),
            imageUrl: member.imageUrl || '',
          }));
        }
      },
      error: (error) => {
        console.error('Error loading company dashboard data:', error);
      },
    });
  }

  private initializeSessionContext(): void {
    const storedName = this.authService.getEmpname().trim();
    const storedRole = this.authService.getRole();

    if (storedName) {
      this.managerName = storedName;
    }

    if (storedRole) {
      this.currentRoleLabel = this.formatRoleLabel(storedRole);
    }
  }

  private loadEmployeeContext(): void {
    this.apiService.getEmployeeList().subscribe({
      next: (employees: Employee[] = []) => {
        if (!Array.isArray(employees) || !employees.length) {
          this.managerImageUrl = this.buildFallbackAvatar(this.managerName);
          return;
        }

        this.teamMembers = employees.map((employee) => this.mapEmployeeToTeamMember(employee));
        this.teamMembersCount = employees.length;

        const currentEmployee = this.findCurrentEmployee(employees) || employees[0];

        if (currentEmployee) {
          const fullName = this.getEmployeeFullName(currentEmployee);
          this.managerName = fullName || this.managerName;
          this.teamName = currentEmployee.department_name || this.teamName;
          this.currentRoleLabel = currentEmployee.role || this.currentRoleLabel;
          this.managerImageUrl = this.resolveEmployeeImage(currentEmployee);
        }

        if (!this.managerImageUrl) {
          this.managerImageUrl = this.buildFallbackAvatar(this.managerName);
        }
      },
      error: (error) => {
        console.error('Error loading employee list for manager dashboard:', error);
        this.managerImageUrl = this.buildFallbackAvatar(this.managerName);
      },
    });
  }

  private findCurrentEmployee(employees: Employee[]): Employee | undefined {
    const storedName = this.authService.getEmpname().trim().toLowerCase();
    const username = this.authService.getUsername().trim().toLowerCase();

    return employees.find((employee) => {
      const fullName = this.getEmployeeFullName(employee).toLowerCase();
      const employeeUsername = `${employee.username || ''}`.trim().toLowerCase();
      const employeeEmail = `${employee.email || ''}`.trim().toLowerCase();

      return (
        (!!storedName && fullName === storedName) ||
        (!!username && (employeeUsername === username || employeeEmail === username))
      );
    });
  }

  private mapEmployeeToTeamMember(employee: Employee): TeamMember {
    return {
      name: this.getEmployeeFullName(employee) || 'Employee',
      email: employee.email || '',
      department: employee.department_name || this.teamName,
      position: employee.position || 'Team Member',
      status: this.resolveMemberStatus(employee),
      initials: this.getInitials(this.getEmployeeFullName(employee) || 'Employee'),
      imageUrl: this.resolveEmployeeImage(employee),
    };
  }

  private getEmployeeFullName(employee: Partial<Employee>): string {
    return `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
  }

  private resolveEmployeeImage(employee: Partial<Employee>): string {
    const imageUrl = `${employee.profile_image_url || employee.image_url || ''}`.trim();
    return imageUrl || this.buildFallbackAvatar(this.getEmployeeFullName(employee) || 'Employee');
  }

  private resolveMemberStatus(employee: Partial<Employee>): TeamMember['status'] {
    if (employee.wfh) {
      return 'WFH';
    }

    if (employee.releaving_date || employee.isactive === false) {
      return 'On Leave';
    }

    return 'Active';
  }

  private formatRoleLabel(role: string): string {
    return role
      .replace(/^ROLE_/, '')
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private buildFallbackAvatar(name: string): string {
    const initials = this.getInitials(name || 'Employee') || 'EM';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${initials}">
        <defs>
          <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#0f766e" />
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="48" fill="url(#avatarGradient)" />
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}
