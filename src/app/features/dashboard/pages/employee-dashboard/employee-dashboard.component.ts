import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppRole, AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { Employee } from '../../../employee/employee.types';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

type AttendanceState = 'present' | 'absent' | 'late' | 'half-day' | 'leave' | 'holiday' | 'weekend' | 'upcoming';
type ActionTone = 'blue' | 'purple' | 'orange' | 'teal';
type CalendarEventType = 'holiday' | 'festival' | 'important';

interface EmployeeStatCard {
  title: string;
  value: string;
  icon: string;
  tone: 'success' | 'danger' | 'warning' | 'primary';
}

interface DashboardStatusDetails {
  apsent?: number | string | null;
  absent?: number | string | null;
  late?: number | string | null;
  present?: number | string | null;
  improper_thump?: number | string | null;
  improper_thumb?: number | string | null;
}

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  tone: ActionTone;
  route: string;
}

interface AttendanceLegendItem {
  state: AttendanceState;
  label: string;
  description: string;
}

interface CalendarEventSeed {
  title: string;
  type: CalendarEventType;
  description: string;
  accentFrom: string;
  accentTo: string;
  badge: string;
  imageUrl: string;
}

interface CalendarEvent extends CalendarEventSeed {
  imageUrl: string;
}

interface DashboardAttendanceApiItem {
  inTime?: string | null;
  outTime?: string | null;
  shift_name?: string | null;
  shift_type?: string | null;
  shiftName?: string | null;
  thumb_status?: string | null;
  thumbstatus?: string | null;
  thumbStatus?: string | null;
  thumb?: string | null;
  attendance_date?: string | null;
  attendanceDate?: string | null;
  att_date?: string | null;
  attendance_status?: string | null;
  attendanceStatus?: string | null;
  day_status?: string | null;
  dayStatus?: string | null;
  status?: string | null;
  is_holiday?: boolean | string | number | null;
  is_weekoff?: boolean | string | number | null;
  workingHours?: string | null;
  total_hours?: string | null;
  totalHours?: string | null;
  leave_status?: string | null;
  out_time?: string | null;
  date?: string | null;
  in_time?: string | null;
  shift?: string | null;
  thump_status?: string | null;
  working_hours?: string | null;
}

interface AttendanceRecord {
  state: AttendanceState;
  statusText: string;
  summary: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  thumbStatus: string;
  note: string;
}

interface AttendanceMetric {
  label: string;
  value: string;
  icon: string;
}

interface BirthdayEmployee {
  id: number;
  name: string;
  avatarUrl: string;
  department: string;
}

interface AnniversaryEmployee {
  id: number;
  name: string;
  avatarUrl: string;
  department: string;
  yearsCompleted: number;
}

interface NewJoinerEmployee {
  id: number;
  name: string;
  avatarUrl: string;
  department: string;
  joiningDateLabel: string;
}

interface CalendarDay {
  date: Date | null;
  day: number | null;
  state: AttendanceState;
  stateLabel: string;
  tooltipLabel: string;
  selected: boolean;
  today: boolean;
  future: boolean;
  details: AttendanceRecord | null;
  specialEvent: CalendarEvent | null;
}
@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss'],
})
export class EmployeeDashboardComponent implements OnInit {
  private readonly dashboardRoute = '/app/dashboard';
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly attendanceLegend: AttendanceLegendItem[] = [
    { state: 'present', label: 'Present', description: 'Present - Full Day' },
    { state: 'absent', label: 'Absent', description: 'No attendance marked' },
    { state: 'late', label: 'Late', description: 'Late punch-in recorded' },
    { state: 'half-day', label: 'Half Day', description: 'Half Day Leave' },
    { state: 'leave', label: 'Leave', description: 'Approved leave day' },
    { state: 'holiday', label: 'Holiday', description: 'Holiday, festival, or important day entry' },
    { state: 'upcoming', label: 'Upcoming', description: 'Approved future leave or pending attendance' },
  ];
  readonly calendarActions = [
    { title: 'Apply Leave', subtitle: 'Create leave request', icon: 'event_available', tone: 'blue' as const, route: '/app/attendance/apply-leave' },
    { title: 'Regularize Punch', subtitle: 'Fix missed swipe logs', icon: 'touch_app', tone: 'orange' as const, route: '/app/attendance/regularize-swipe' },
    { title: 'Request OD', subtitle: 'Submit on-duty request', icon: 'work_history', tone: 'purple' as const, route: '/app/attendance/request-od' },
    // { title: 'Raise Query', subtitle: 'Ask HR for clarification', icon: 'support_agent', tone: 'teal' as const, route: '/app/attendance/raise-query' },
    { title: 'Permission Request', subtitle: 'Submit short-time approval', icon: 'verified_user', tone: 'purple', route: '/app/attendance/permission-request' },

  ];
  readonly recurringEvents: Record<string, CalendarEventSeed> = {
    '01-01': {
      title: 'New Year Holiday',
      type: 'holiday',
      description: 'Global holiday marking the beginning of the new year.',
      accentFrom: '#1f7aec',
      accentTo: '#64c3ff',
      badge: 'NY',
      imageUrl: 'assets/images/newyear.jpeg'
    },
    '01-14': {
      title: 'Makar Sankranti',
      type: 'festival',
      description: 'Harvest festival celebrated across India with regional traditions.',
      accentFrom: '#f59f2a',
      accentTo: '#f7d154',
      badge: 'MS',
      imageUrl: 'assets/images/pongal.jpeg'
    },
    '01-26': {
      title: 'Republic Day',
      type: 'holiday',
      description: 'National holiday commemorating the Constitution of India.',
      accentFrom: '#ff8f40',
      accentTo: '#1c9d5f',
      badge: 'RD',
      imageUrl: 'assets/images/rebublicday.jpeg'

    },
    '03-08': {
      title: 'Womens Day',
      type: 'holiday',
      description: 'Important day recognizing the achievements, leadership, and contributions of women across every field.',
      accentFrom: '#2d6cdf',
      accentTo: '#a056f7',
      badge: 'WD',
      imageUrl: 'assets/images/womensday.jpeg'
    },
    '04-14': {
      title: 'Ambedkar Jayanthi',
      type: 'holiday',
      description: 'Commemorative holiday observing the birth anniversary of Dr. B. R. Ambedkar.',
      accentFrom: '#2d6cdf',
      accentTo: '#a056f7',
      badge: 'AJ',
      imageUrl: 'assets/images/Ambedkar_Jayanthi.jpeg'

    },
    '06-05': {
      title: 'Environment Day',
      type: 'important',
      description: 'Important awareness day to promote sustainability, responsibility, and green initiatives across the workplace.',
      accentFrom: '#0f9d58',
      accentTo: '#5ccf8e',
      badge: 'ED',
      imageUrl: 'assets/images/Environment_Day.jpeg'

    },
    '05-01': {
      title: 'Labour Day',
      type: 'holiday',
      description: 'Public holiday recognizing workers and labour contributions.',
      accentFrom: '#0e9f6e',
      accentTo: '#6bd3a6',
      badge: 'LD',
      imageUrl: 'assets/images/labourday.jpeg'

    },
    '07-01': {
      title: 'Founders Day',
      type: 'important',
      description: 'Important company day celebrating the journey, culture, and milestones that shaped the organization.',
      accentFrom: '#4f46e5',
      accentTo: '#8b5cf6',
      badge: 'FD',
      imageUrl: 'assets/images/Founders.jpeg'
    },
    '08-15': {
      title: 'Independence Day',
      type: 'holiday',
      description: 'National holiday celebrating India\'s independence.',
      accentFrom: '#f28b2e',
      accentTo: '#0f9d58',
      badge: 'ID',
      imageUrl: 'assets/images/Independence_Day.jpeg'
    },
    '09-05': {
      title: 'Teachers Day',
      type: 'important',
      description: 'Important commemorative day honoring mentors, guidance, and the value of learning.',
      accentFrom: '#2563eb',
      accentTo: '#60a5fa',
      badge: 'TD',
      imageUrl: 'assets/images/Teachers_day.jpeg'
    },
    '10-02': {
      title: 'Gandhi Jayanti',
      type: 'holiday',
      description: 'National holiday commemorating Mahatma Gandhi\'s birth anniversary.',
      accentFrom: '#4f86ed',
      accentTo: '#9bc1ff',
      badge: 'GJ',
      imageUrl: 'assets/images/Gandhi_Jayanti.jpeg'
    },
    '11-14': {
      title: 'Childrens Day',
      type: 'important',
      description: 'Important observance celebrating joy, care, and the importance of nurturing the next generation.',
      accentFrom: '#ec4899',
      accentTo: '#f97316',
      badge: 'CD',
      imageUrl: 'assets/images/Childrens_day.jpeg'

    },
    '11-19': {
      title: 'Mens Day',
      type: 'important',
      description: 'Important day recognizing positive role models, wellbeing, and the contributions of men in families, workplaces, and communities.',
      accentFrom: '#1f7aec',
      accentTo: '#4f86ed',
      badge: 'MD',
      imageUrl: 'assets/images/mens.jpeg'
    },
    '12-25': {
      title: 'Christmas',
      type: 'festival',
      description: 'Festival holiday celebrated with gatherings, lights, and year-end events.',
      accentFrom: '#1f9d62',
      accentTo: '#dd4b63',
      badge: 'XM',
      imageUrl: 'assets/images/Christmas.jpeg'

    },
  };

  greetingName = 'Bob';
  employeeName = 'Bob';
  heroDate = '';
  heroSubtitle = '';
  heroWelcomeMessage = '';
  heroImageUrl = '';
  heroRoleLabel = 'Employee';
  monthLabel = '';
  calendarWeeks: CalendarDay[][] = [];
  selectedCalendarDay: CalendarDay | null = null;
  viewedDate = new Date();
  currentEmployeeId = 0;
  attendanceRecordsByDate = new Map<string, AttendanceRecord>();
  birthdaysToday: BirthdayEmployee[] = [];
  anniversariesToday: AnniversaryEmployee[] = [];
  newJoiners: NewJoinerEmployee[] = [];

  statCards: EmployeeStatCard[] = [];
  private hasDashboardStatusCards = false;

  readonly quickActions: QuickAction[] = [
    { title: 'Apply Leave', subtitle: 'Request planned leave in seconds', icon: 'event_available', tone: 'blue', route: '/app/attendance/apply-leave' },
    { title: 'Regularize Swipe', subtitle: 'Correct missed or late punches', icon: 'fingerprint', tone: 'orange', route: '/app/attendance/regularize-swipe' },
    { title: 'Permission Request', subtitle: 'Submit short-time approval', icon: 'verified_user', tone: 'purple', route: '/app/attendance/permission-request' },
    { title: 'Request OD', subtitle: 'Submit on-duty movement for field visits, client meetings, or travel work', icon: 'work_history', tone: 'orange', route: '/app/attendance/request-od' },
    // { title: 'Attendance Report', subtitle: 'Review monthly attendance summary', icon: 'insights', tone: 'teal', route: '/app/reports' },
  ];
  userid: number;
  constructor(private authService: AuthService,
    private apiService: ApiService,private tokenStorage:TokenStorageService,
    private router: Router) {
      this.userid=tokenStorage.getID();
     }

  ngOnInit(): void {
    this.employeeName = this.resolveEmployeeName();
    this.greetingName = this.resolveFirstName(this.employeeName);
    this.heroDate = this.formatHeroDate(new Date());
    this.heroSubtitle = this.resolveHeroSubtitle(this.authService.getRole());
    console.log(this.heroSubtitle);

    this.heroRoleLabel = this.formatRoleLabel(this.authService.getRole());
    this.heroWelcomeMessage = this.buildWelcomeMessage(this.greetingName);
    this.heroImageUrl = this.buildFallbackAvatar(this.employeeName);
    this.currentEmployeeId = Number(this.authService.getID() || 0) || 0;
    this.viewedDate = new Date();
    this.viewedDate.setDate(1);
    this.loadDashboardStatusCards();
    this.loadAttendanceCalendar();
    this.loadEmployeeHero();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.selectedCalendarDay) {
      this.closeAttendanceDialog();
    }
  }

  trackByTitle(_index: number, item: { title: string }): string {
    return item.title;
  }

  trackByState(_index: number, item: AttendanceLegendItem): AttendanceState {
    return item.state;
  }

  trackByEmployeeId(_index: number, item: { id: number }): number {
    return item.id;
  }

  onEmployeeImageError(event: Event, employeeName?: string): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.buildFallbackAvatar(employeeName || 'Employee');
    }
  }

  onSpecialEventImageError(event: Event, specialEvent: CalendarEvent): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.buildEventImage(specialEvent);
    }
  }

  selectCalendarDay(day: CalendarDay): void {
    if (!day.day || !day.date) {
      return;
    }
    this.selectedCalendarDay = day;
    this.rebuildCalendar(day.date);
  }

  changeMonth(offset: number): void {
    this.viewedDate = new Date(this.viewedDate.getFullYear(), this.viewedDate.getMonth() + offset, 1);
    this.selectedCalendarDay = null;
    this.loadAttendanceCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.viewedDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedCalendarDay = null;
    this.loadAttendanceCalendar();
  }

  closeAttendanceDialog(): void {
    this.selectedCalendarDay = null;
    this.rebuildCalendar();
  }

  onDialogContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  openQuickAction(action: QuickAction): void {
    this.navigateToActionRoute(action.route);
  }

  openCalendarAction(action: QuickAction): void {
    const selectedDate = this.selectedCalendarDay?.date;
    const queryParams = selectedDate ? { date: this.toIsoDate(selectedDate) } : undefined;
    this.navigateToActionRoute(action.route, queryParams);
  }

  get selectedDateLabel(): string {
    if (!this.selectedCalendarDay?.date) {
      return '';
    }

    return this.selectedCalendarDay.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get selectedDialogTitle(): string {
    const activeDay = this.selectedCalendarDay;
    if (!activeDay) {
      return '';
    }

    return activeDay.specialEvent?.title || this.selectedDateLabel;
  }

  get selectedDialogSubtitle(): string {
    const activeDay = this.selectedCalendarDay;
    if (!activeDay) {
      return '';
    }

    if (activeDay.specialEvent) {
      return `${this.selectedDateLabel} - ${this.resolveEventTooltipLabel(activeDay.specialEvent)}`;
    }

    return activeDay.tooltipLabel;
  }

  get selectedAttendanceMetrics(): AttendanceMetric[] {
    const details = this.selectedCalendarDay?.details;
    if (!details) {
      return [];
    }

    return [
      { label: 'Status', value: details.statusText, icon: 'fact_check' },
      { label: 'Check In', value: details.checkIn, icon: 'login' },
      { label: 'Check Out', value: details.checkOut, icon: 'logout' },
      { label: 'Shift', value: details.shift, icon: 'badge' },
      { label: 'Working Hours', value: details.workingHours, icon: 'schedule' },
      { label: 'Thumb Status', value: details.thumbStatus, icon: 'touch_app' },
    ];
  }

  getCalendarDayAriaLabel(day: CalendarDay): string {
    if (!day.date) {
      return '';
    }

    return `${day.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}: ${day.tooltipLabel}`;
  }

  getEventTypeLabel(type: CalendarEventType): string {
    switch (type) {
      case 'festival':
        return 'Festival';
      case 'important':
        return 'Important Day';
      case 'holiday':
      default:
        return 'Holiday';
    }
  }



  private resolveEmployeeName(): string {
    const employeeName = `${this.authService.getEmpname() || ''}`.trim();
    if (employeeName) {
      return employeeName;
    }

    const username = `${this.authService.getUsername() || ''}`.trim();
    if (username) {
      const parts = username.split('@')[0].split(/[._-]/).filter(Boolean);
      if (parts.length) {
        return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      }
    }

    return 'Bob';
  }

  private resolveFirstName(name: string): string {
    return name.split(' ').filter(Boolean)[0] || 'Bob';
  }

  private buildWelcomeMessage(name: string): string {
    return `Welcome back, ${name}! Wishing you a productive and successful day.`;
  }

  private resolveHeroSubtitle(role: AppRole | null): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'System Administrator - Enterprise Control';
      case 'ROLE_COMPANY':
        return 'HR Payroll Lead - People Operations';
      case 'ROLE_MANAGER':
        return 'Team Manager - People Operations';
      case 'ROLE_EMPLOYEE':
      default:
        return 'Full Stack Developer - Engineering';
    }
  }

  private formatHeroDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private loadEmployeeHero(): void {
    this.apiService.getEmployeeList(this.userid).subscribe({
      next: (employees: Employee[] = []) => {
        if (!Array.isArray(employees) || !employees.length) {
          return;
        }

        this.populatePeopleCards(employees);

        const currentEmployee = this.findCurrentEmployee(employees) || employees[0];
        if (!currentEmployee) {
          return;
        }

        const fullName = this.getEmployeeFullName(currentEmployee);
        this.employeeName = fullName || this.resolveAccountDisplayName(currentEmployee.username, currentEmployee.email) || this.employeeName;
        this.greetingName = this.resolveFirstName(this.employeeName);
        this.heroSubtitle = this.resolveEmployeeSubtitle(currentEmployee);
        this.heroRoleLabel = currentEmployee.role || this.heroRoleLabel;
        this.heroImageUrl = this.resolveEmployeeImage(currentEmployee);
        this.heroWelcomeMessage = this.buildWelcomeMessage(this.greetingName);
      },
      error: (error) => {
        console.error('Error loading employee hero context:', error);
      },
    });
  }

  private findCurrentEmployee(employees: Employee[]): Employee | undefined {
    const storedName = `${this.authService.getEmpname() || ''}`.trim().toLowerCase();
    const username = `${this.authService.getUsername() || ''}`.trim().toLowerCase();

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

  private getEmployeeFullName(employee: Partial<Employee>): string {
    return `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
  }

  private resolveAccountDisplayName(username?: string, email?: string): string {
    const source = `${username || email || ''}`.trim();
    if (source) {
      return source
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    return '';
  }

  private resolveEmployeeSubtitle(employee: Partial<Employee>): string {
    const position = `${employee.position || ''}`.trim();
    const department = `${employee.department_name || ''}`.trim();
    const role = `${employee.role || ''}`.trim();

    if (position && department) {
      return `${position} - ${department}`;
    }

    if (role && department) {
      return `${role} - ${department}`;
    }

    if (position) {
      return position;
    }

    if (role) {
      return role;
    }

    return this.heroSubtitle;
  }

  private resolveEmployeeImage(employee: Partial<Employee>): string {
    const imageUrl = this.normalizeImagePath(employee.profile_image_url || employee.image_url || '');
    const normalizedName = this.getEmployeeDisplayName(employee);

    if (!imageUrl) {
      return this.buildFallbackAvatar(normalizedName);
    }

    return this.buildAbsoluteImageUrl(imageUrl) || this.buildFallbackAvatar(normalizedName);
  }

  private getEmployeeDisplayName(employee: Partial<Employee>): string {
    return this.getEmployeeFullName(employee) || this.resolveAccountDisplayName(employee.username, employee.email) || 'Employee';
  }

  private normalizeImagePath(imageValue: unknown): string {
    const candidate = `${imageValue || ''}`.trim();
    if (!candidate) {
      return '';
    }

    if (candidate.startsWith('data:') || candidate.startsWith('blob:')) {
      return '';
    }

    return candidate.replace(/\\/g, '/');
  }

  private buildAbsoluteImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith('/assets/')) {
      return imagePath;
    }

    if (imagePath.startsWith('/')) {
      return `http://192.168.1.105:8081${imagePath}`;
    }

    return `http://192.168.1.105:8081/${imagePath.replace(/^\/+/, '')}`;
  }

  private formatRoleLabel(role: AppRole | null | string): string {
    if (!role) {
      return 'Employee';
    }

    return role
      .replace(/^ROLE_/, '')
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private navigateToActionRoute(route: string, queryParams?: Record<string, string>): void {
    this.closeAttendanceDialog();
    this.router.navigate(['/', ...route.split('/').filter(Boolean)], {
      queryParams,
      state: this.buildWorkflowNavigationState(route),
    });
  }

  private buildWorkflowNavigationState(route: string): { from: string } | undefined {
    return this.isWorkflowRoute(route) ? { from: this.dashboardRoute } : undefined;
  }

  private isWorkflowRoute(route: string): boolean {
    return route === '/app/attendance/apply-leave'
      || route === '/app/attendance/request-od'
      || route === '/app/attendance/permission-request'
      || route === '/app/attendance/regularize-swipe';
  }

  private buildFallbackAvatar(name: string): string {
    const initials = (name || 'Employee')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'EM';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${initials}">
        <defs>
          <linearGradient id="heroAvatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#67e8f9" />
            <stop offset="100%" stop-color="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="60" fill="url(#heroAvatarGradient)" />
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          fill="#ffffff" font-family="Arial, sans-serif" font-size="38" font-weight="700">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private populatePeopleCards(employees: Employee[]): void {
    const today = new Date();
    const activeEmployees = employees.filter((employee) => employee && employee.isactive !== false && !employee.isdelete);

    this.birthdaysToday = activeEmployees
      .filter((employee) => this.isSameMonthDay(employee.date_of_birth, today))
      .map((employee) => ({
        id: employee.id,
        name: this.getEmployeeDisplayName(employee),
        avatarUrl: this.resolveEmployeeImage(employee),
        department: `${employee.department_name || ''}`.trim(),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    this.anniversariesToday = activeEmployees
      .filter((employee) => this.isSameMonthDay(employee.joining_date, today))
      .map((employee) => ({
        id: employee.id,
        name: this.getEmployeeDisplayName(employee),
        avatarUrl: this.resolveEmployeeImage(employee),
        department: `${employee.department_name || ''}`.trim(),
        yearsCompleted: this.getCompletedYears(employee.joining_date, today),
      }))
      .filter((employee) => employee.yearsCompleted > 0)
      .sort((left, right) => right.yearsCompleted - left.yearsCompleted || left.name.localeCompare(right.name));

    this.newJoiners = activeEmployees
      .map((employee) => ({
        employee,
        joiningDate: this.parseDate(employee.joining_date),
      }))
      .filter((item) => !!item.joiningDate)
      .filter((item) => this.getDaysDifference(item.joiningDate as Date, today) <= 5 && this.getDaysDifference(item.joiningDate as Date, today) >= 0)
      .sort((left, right) => (right.joiningDate as Date).getTime() - (left.joiningDate as Date).getTime())
      .map((item) => ({
        id: item.employee.id,
        name: this.getEmployeeDisplayName(item.employee),
        avatarUrl: this.resolveEmployeeImage(item.employee),
        department: `${item.employee.department_name || ''}`.trim(),
        joiningDateLabel: this.formatShortDate(item.joiningDate as Date),
      }));
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isSameMonthDay(value: string | null | undefined, reference: Date): boolean {
    const parsed = this.parseDate(value);
    if (!parsed) {
      return false;
    }

    return parsed.getMonth() === reference.getMonth() && parsed.getDate() === reference.getDate();
  }

  private getCompletedYears(value: string | null | undefined, reference: Date): number {
    const parsed = this.parseDate(value);
    if (!parsed) {
      return 0;
    }

    return Math.max(reference.getFullYear() - parsed.getFullYear(), 0);
  }

  private getDaysDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    return Math.floor((end - start) / 86400000);
  }

  private formatShortDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private loadAttendanceCalendar(selectedDate?: Date): void {
    if (!this.currentEmployeeId) {
      this.attendanceRecordsByDate = new Map();
      this.rebuildCalendar(selectedDate);
      return;
    }
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = monthNames[this.viewedDate.getMonth()];
    const year = `${this.viewedDate.getFullYear()}`;

    this.apiService.getAttendanceDetails(this.currentEmployeeId, month, year).subscribe({
      next: (data: any) => {

        this.attendanceRecordsByDate = this.mapAttendanceRecords(data);
        this.rebuildCalendar(selectedDate);
      },
      error: (error) => {
        this.attendanceRecordsByDate = new Map();
        this.rebuildCalendar(selectedDate);
      },
    });
  }

  private mapAttendanceRecords(data: any): Map<string, AttendanceRecord> {
    const mappedRecords = new Map<string, AttendanceRecord>();

    this.extractAttendanceList(data).forEach((item) => {
      const dateKey = this.resolveAttendanceDateKey(item);
      if (!dateKey) {
        return;
      }

      const recordDate = new Date(dateKey);
      const specialEvent = Number.isNaN(recordDate.getTime()) ? null : this.resolveSpecialEvent(recordDate);
      const checkIn = this.formatTimeOnly(item.in_time ?? item.inTime);
      const checkOut = this.formatTimeOnly(item.out_time ?? item.outTime);
      const shift = `${item.shift ?? item.shift_name ?? item.shift_type ?? item.shiftName ?? 'General Shift'}`.trim() || 'General Shift';
      const thumbStatus = this.resolveThumbStatus(item);
      const state = this.mapAttendanceState(item, checkIn, checkOut);
      const statusText = this.resolveAttendanceStatusLabel(item, state);
      const displayState = this.resolveCalendarDisplayState(dateKey, state, statusText);

      mappedRecords.set(dateKey, {
        state: displayState.state,
        statusText: displayState.statusText,
        summary: this.buildAttendanceSummary(displayState.state, displayState.statusText, specialEvent),
        shift,
        checkIn,
        checkOut,
        workingHours: this.resolveWorkingHours(item, checkIn, checkOut, displayState.state, displayState.statusText),
        thumbStatus,
        note: this.buildAttendanceNote(displayState.state, displayState.statusText, thumbStatus, specialEvent),
      });
    });

    return mappedRecords;
  }

  private extractAttendanceList(data: any): DashboardAttendanceApiItem[] {
    if (Array.isArray(data)) {
      return data as DashboardAttendanceApiItem[];
    }

    if (Array.isArray(data?.data)) {
      return data.data as DashboardAttendanceApiItem[];
    }

    if (Array.isArray(data?.result)) {
      return data.result as DashboardAttendanceApiItem[];
    }

    if (Array.isArray(data?.records)) {
      return data.records as DashboardAttendanceApiItem[];
    }

    return [];
  }

  private resolveAttendanceDateKey(item: DashboardAttendanceApiItem): string {
    const rawValue = item.attendance_date || item.attendanceDate || item.att_date || item.date || item.in_time || item.inTime || item.out_time || item.outTime || '';
    return this.normalizeAttendanceDateKey(rawValue);
  }

  private normalizeAttendanceDateKey(value: unknown): string {
    const candidate = `${value || ''}`.trim();
    if (!candidate) {
      return '';
    }

    const isoMatch = candidate.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      return isoMatch[0];
    }

    const parsedDate = new Date(candidate);
    if (!Number.isNaN(parsedDate.getTime())) {
      return this.toIsoDate(parsedDate);
    }

    const slashMatch = candidate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  private mapAttendanceState(item: DashboardAttendanceApiItem, checkIn: string, checkOut: string): AttendanceState {
    const rawStatus = this.getNormalizedAttendanceStatus(item);
    const rawThumbStatus = this.getNormalizedThumbStatus(item);

    if (this.isTruthyAttendanceFlag(item.is_holiday)) {
      return 'holiday';
    }

    if (this.isTruthyAttendanceFlag(item.is_weekoff)) {
      return 'weekend';
    }

    if (
      rawStatus.includes('holiday')
      || rawStatus.includes('special day')
      || rawStatus.includes('festival')
      || rawStatus.includes('important')
    ) {
      return 'holiday';
    }

    if (rawStatus.includes('week off') || rawStatus.includes('weekoff') || rawStatus.includes('weekend')) {
      return 'weekend';
    }

    if (
      rawStatus.includes('half')
      || rawStatus.includes('afternoon leave')
      || rawStatus.includes('beforenoon leave')
      || rawStatus.includes('forenoon leave')
      || rawStatus.includes('before noon leave')
    ) {
      return 'half-day';
    }

    if (rawStatus.includes('leave')) {
      return 'leave';
    }

    if (rawStatus.includes('late') || rawThumbStatus.includes('late')) {
      return 'late';
    }

    if (rawStatus.includes('present')) {
      return 'present';
    }

    if (rawStatus.includes('absent')) {
      return 'absent';
    }

    return checkIn !== '--' || checkOut !== '--' ? 'present' : 'absent';
  }

  private getNormalizedAttendanceStatus(item: DashboardAttendanceApiItem): string {
    const rawStatus = [
      item.leave_status,
      item.attendance_status,
      item.attendanceStatus,
      item.day_status,
      item.dayStatus,
      item.status,
    ]
      .map((value) => `${value ?? ''}`.trim())
      .find(Boolean) || '';

    return rawStatus.toLowerCase().replace(/[_-]+/g, ' ');
  }

  private getNormalizedThumbStatus(item: DashboardAttendanceApiItem): string {
    const rawThumbStatus = [
      item.thump_status,
      item.thumb_status,
      item.thumbstatus,
      item.thumbStatus,
      item.thumb,
    ]
      .map((value) => `${value ?? ''}`.trim())
      .find(Boolean) || '';

    return rawThumbStatus.toLowerCase().replace(/[_-]+/g, ' ');
  }

  private resolveAttendanceStatusLabel(item: DashboardAttendanceApiItem, state: AttendanceState): string {
    const rawStatus = [
      item.leave_status,
      item.attendance_status,
      item.attendanceStatus,
      item.day_status,
      item.dayStatus,
      item.status,
    ]
      .map((value) => `${value ?? ''}`.trim())
      .find(Boolean);

    if (state === 'late') {
      return 'Late';
    }

    if (rawStatus) {
      return this.formatStatusLabel(rawStatus);
    }

    return this.resolveStateLabel(state);
  }

  private resolveThumbStatus(item: DashboardAttendanceApiItem): string {
    const rawThumbStatus = [
      item.thump_status,
      item.thumb_status,
      item.thumbstatus,
      item.thumbStatus,
      item.thumb,
    ]
      .map((value) => `${value ?? ''}`.trim())
      .find(Boolean);

    return rawThumbStatus ? this.formatStatusLabel(rawThumbStatus) : 'Not Available';
  }

  private formatStatusLabel(value: unknown): string {
    const normalized = `${value ?? ''}`.trim().replace(/[_-]+/g, ' ');
    if (!normalized) {
      return '';
    }

    return normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => (part === part.toUpperCase()
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
      .join(' ');
  }

  private resolveCalendarDisplayState(
    dateKey: string,
    state: AttendanceState,
    statusText: string
  ): { state: AttendanceState; statusText: string } {
    if (state === 'leave' && this.isTodayOrFutureDate(dateKey)) {
      return {
        state: 'upcoming',
        statusText: 'Upcoming Leave',
      };
    }

    return { state, statusText };
  }

  private isTodayOrFutureDate(dateKey: string): boolean {
    return dateKey >= this.toIsoDate(new Date());
  }

  private isTruthyAttendanceFlag(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = `${value ?? ''}`.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y'].includes(normalized);
  }

  private formatTimeOnly(value: unknown): string {
    const candidate = `${value || ''}`.trim();
    if (!candidate) {
      return '--';
    }

    const timeMatch = candidate.match(/(\d{2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      return this.formatTime(Number(timeMatch[1]), Number(timeMatch[2]));
    }

    const parsedDate = new Date(candidate);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return candidate;
  }

  private resolveWorkingHours(
    item: DashboardAttendanceApiItem,
    checkIn: string,
    checkOut: string,
    state: AttendanceState,
    statusText: string
  ): string {
    const candidate = `${item.working_hours || item.workingHours || item.total_hours || item.totalHours || ''}`.trim();
    if (candidate) {
      return candidate;
    }

    const derivedHours = this.calculateWorkingHours(checkIn, checkOut);
    if (derivedHours) {
      return derivedHours;
    }

    switch (state) {
      case 'leave':
        return 'Approved Leave';
      case 'holiday':
        return 'Holiday';
      case 'weekend':
        return 'Week Off';
      case 'upcoming':
        return statusText.toLowerCase().includes('leave') ? 'Approved Leave' : 'Pending';
      default:
        return '--';
    }
  }

  private calculateWorkingHours(checkIn: string, checkOut: string): string {
    const start = this.parseDisplayTime(checkIn);
    const end = this.parseDisplayTime(checkOut);

    if (!start || !end) {
      return '';
    }

    let diffMinutes = end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    const hours = `${Math.floor(diffMinutes / 60)}`.padStart(2, '0');
    const minutes = `${diffMinutes % 60}`.padStart(2, '0');
    return `${hours}h ${minutes}m`;
  }

  private parseDisplayTime(value: string): { hours: number; minutes: number } | null {
    const candidate = `${value || ''}`.trim();
    if (!candidate || candidate === '--') {
      return null;
    }

    const twelveHourMatch = candidate.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (twelveHourMatch) {
      let hours = Number(twelveHourMatch[1]) % 12;
      const minutes = Number(twelveHourMatch[2]);
      if (twelveHourMatch[3].toUpperCase() === 'PM') {
        hours += 12;
      }
      return { hours, minutes };
    }

    const twentyFourHourMatch = candidate.match(/^(\d{2}):(\d{2})/);
    if (twentyFourHourMatch) {
      return {
        hours: Number(twentyFourHourMatch[1]),
        minutes: Number(twentyFourHourMatch[2]),
      };
    }

    return null;
  }

  private buildAttendanceSummary(
    state: AttendanceState,
    statusText: string,
    specialEvent: CalendarEvent | null
  ): string {
    if (specialEvent && specialEvent.type === 'holiday') {
      return `${specialEvent.title} is marked on the calendar for this date.`;
    }

    switch (state) {
      case 'present':
        return 'Attendance is marked present for this date.';
      case 'late':
        return 'Attendance is marked late for this date.';
      case 'half-day':
        return `Attendance is marked as ${statusText.toLowerCase()} for this date.`;
      case 'leave':
        return `Attendance is marked as ${statusText.toLowerCase()} for this date.`;
      case 'holiday':
        return statusText === 'Holiday'
          ? 'This date is marked as a holiday.'
          : 'This date is marked as a special day.';
      case 'weekend':
        return 'This date is marked as a weekly off.';
      case 'upcoming':
        return statusText.toLowerCase().includes('leave')
          ? 'Approved leave is scheduled for this date.'
          : 'Attendance is pending for this future date.';
      case 'absent':
      default:
        return 'Attendance is marked absent for this date.';
    }
  }

  private buildAttendanceNote(
    state: AttendanceState,
    statusText: string,
    thumbStatus: string,
    specialEvent: CalendarEvent | null
  ): string {
    const eventNote = specialEvent && specialEvent.type !== 'holiday' ? ` ${specialEvent.title}: ${specialEvent.description}` : '';

    switch (state) {
      case 'present':
        return `Thumb status: ${thumbStatus}.${eventNote}`.trim();
      case 'late':
        return `Late attendance recorded. Thumb status: ${thumbStatus}.${eventNote}`.trim();
      case 'half-day':
        return `Half day attendance recorded. Thumb status: ${thumbStatus}.${eventNote}`.trim();
      case 'leave':
        return `Approved leave has been applied for this date.${eventNote}`.trim();
      case 'holiday':
        return specialEvent?.description || 'This date is marked as a holiday.';
      case 'weekend':
        return specialEvent?.description || 'This date is marked as a weekly off.';
      case 'upcoming':
        return statusText.toLowerCase().includes('leave')
          ? 'Approved leave is scheduled for this date.'
          : specialEvent?.description || 'Attendance details will appear after punches are recorded.';
      case 'absent':
      default:
        return `No attendance punches are available for this date.${eventNote}`.trim();
    }
  }

  private rebuildCalendar(selectedDate?: Date): void {
    this.monthLabel = this.viewedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    this.calendarWeeks = this.buildCalendar(this.viewedDate.getFullYear(), this.viewedDate.getMonth(), selectedDate);
    if (selectedDate) {
      this.selectedCalendarDay = this.findCalendarDay(selectedDate);
    }
    this.updateStatCards();
  }

  private buildCalendar(year: number, monthIndex: number, selectedDate?: Date): CalendarDay[][] {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const today = new Date();
    const todayKey = this.getDateKey(today);
    const selectedKey = selectedDate ? this.getDateKey(selectedDate) : '';
    const todayCutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const cells: CalendarDay[] = [];

    for (let index = 0; index < firstDayIndex; index += 1) {
      cells.push({
        date: null,
        day: null,
        state: 'upcoming',
        stateLabel: '',
        tooltipLabel: '',
        selected: false,
        today: false,
        future: false,
        details: null,
        specialEvent: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cellDate = new Date(year, monthIndex, day);
      const isFuture = cellDate.getTime() > todayCutoff;
      const specialEvent = this.resolveSpecialEvent(cellDate);
      const state = this.resolveAttendanceState(cellDate, isFuture, specialEvent);
      const details = this.buildAttendanceDetails(cellDate, state, specialEvent);
      const dateKey = this.getDateKey(cellDate);

      cells.push({
        date: cellDate,
        day,
        state,
        stateLabel: details.statusText,
        tooltipLabel: this.resolveTooltipLabel(state, specialEvent, details.statusText),
        selected: selectedKey ? dateKey === selectedKey : dateKey === todayKey,
        today: dateKey === todayKey,
        future: isFuture,
        details,
        specialEvent,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        date: null,
        day: null,
        state: 'upcoming',
        stateLabel: '',
        tooltipLabel: '',
        selected: false,
        today: false,
        future: false,
        details: null,
        specialEvent: null,
      });
    }

    const weeks: CalendarDay[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }

    return weeks;
  }

  private updateStatCards(): void {
    if (this.hasDashboardStatusCards) {
      return;
    }

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      improperThumb: 0,
    };

    for (const week of this.calendarWeeks) {
      for (const day of week) {
        if (!day.date) {
          continue;
        }

        if (day.state === 'present') {
          counts.present += 1;
        } else if (day.state === 'absent') {
          counts.absent += 1;
        } else if (day.state === 'late') {
          counts.late += 1;
        } else if ((day.details?.thumbStatus || '').toLowerCase().includes('improper')) {
          counts.improperThumb += 1;
        }
      }
    }

    this.statCards = [
      { title: 'Present', value: `${counts.present}`, icon: 'task_alt', tone: 'success' },
      { title: 'Absent', value: `${counts.absent}`, icon: 'event_busy', tone: 'danger' },
      { title: 'Late', value: `${counts.late}`, icon: 'schedule', tone: 'warning' },
      { title: 'Improper Thumb', value: `${counts.improperThumb}`, icon: 'touch_app', tone: 'primary' },
    ];
  }

  private loadDashboardStatusCards(): void {
    if (!this.currentEmployeeId) {
      this.hasDashboardStatusCards = false;
      this.updateStatCards();
      return;
    }

    this.apiService.getdashboarddetails(this.currentEmployeeId).subscribe({
      next: (data: DashboardStatusDetails | null | undefined) => {
        this.hasDashboardStatusCards = true;
        this.statCards = this.buildDashboardStatusCards(data);
      },
      error: () => {
        this.hasDashboardStatusCards = false;
        this.updateStatCards();
      },
    });
  }

  private buildDashboardStatusCards(data: DashboardStatusDetails | null | undefined): EmployeeStatCard[] {
    return [
      { title: 'Present', value: `${this.toCardNumber(data?.present)}`, icon: 'task_alt', tone: 'success' },
      { title: 'Absent', value: `${this.toCardNumber(data?.apsent ?? data?.absent)}`, icon: 'event_busy', tone: 'danger' },
      { title: 'Late', value: `${this.toCardNumber(data?.late)}`, icon: 'schedule', tone: 'warning' },
      { title: 'Improper Thumb', value: `${this.toCardNumber(data?.improper_thump ?? data?.improper_thumb)}`, icon: 'touch_app', tone: 'primary' },
    ];
  }

  private toCardNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private resolveAttendanceState(date: Date, isFuture: boolean, specialEvent: CalendarEvent | null): AttendanceState {
    const attendanceRecord = this.attendanceRecordsByDate.get(this.toIsoDate(date));
    if (attendanceRecord) {
      return attendanceRecord.state;
    }

    if (specialEvent) {
      return 'holiday';
    }

    if (date.getDay() === 0) {
      return 'weekend';
    }

    if (isFuture) {
      return 'upcoming';
    }

    return 'absent';
  }

  private resolveStateLabel(state: AttendanceState, specialEvent?: CalendarEvent | null): string {
    switch (state) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'half-day':
        return 'Half Day';
      case 'leave':
        return 'Leave';
      case 'weekend':
        return 'Week Off';
      case 'holiday':
        return 'Holiday';
      case 'upcoming':
      default:
        return 'Pending';
    }
  }

  private resolveTooltipLabel(
    state: AttendanceState,
    specialEvent: CalendarEvent | null,
    statusText?: string
  ): string {
    if (specialEvent) {
      const eventLabel = this.resolveEventTooltipLabel(specialEvent);
      if (specialEvent.type !== 'holiday' && state !== 'upcoming') {
        return `${eventLabel} • ${statusText || this.resolveStateLabel(state)}`;
      }

      return eventLabel;
    }

    if (statusText) {
      return statusText;
    }

    switch (state) {
      case 'present':
        return 'Present - Full Day';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late Arrival';
      case 'half-day':
        return 'Half Day';
      case 'leave':
        return 'Leave';
      case 'holiday':
        return 'Holiday';
      case 'weekend':
        return 'Week Off';
      case 'upcoming':
      default:
        return 'Pending - Attendance Awaited';
    }
  }

  private resolveEventTooltipLabel(specialEvent: CalendarEvent): string {
    switch (specialEvent.type) {
      case 'festival':
        return `Festival: ${specialEvent.title}`;
      case 'important':
        return `Important Day: ${specialEvent.title}`;
      case 'holiday':
      default:
        return `Holiday: ${specialEvent.title}`;
    }
  }

  private buildAttendanceDetails(date: Date, state: AttendanceState, specialEvent: CalendarEvent | null): AttendanceRecord {
    const attendanceRecord = this.attendanceRecordsByDate.get(this.toIsoDate(date));
    const specialEventSuffix = specialEvent && specialEvent.type !== 'holiday'
      ? ` ${specialEvent.title}: ${specialEvent.description}`
      : '';

    if (attendanceRecord) {
      return {
        ...attendanceRecord,
        note: `${attendanceRecord.note}${specialEventSuffix}`.trim(),
      };
    }

    if (specialEvent && state === 'holiday') {
      return {
        state: 'holiday',
        statusText: 'Holiday',
        summary: `${specialEvent.title} is marked on the calendar for this date.`,
        shift: 'Holiday',
        checkIn: '--',
        checkOut: '--',
        workingHours: 'Holiday',
        thumbStatus: 'Not Required',
        note: specialEvent.description,
      };
    }

    switch (state) {
      case 'absent':
        return {
          state,
          statusText: this.resolveStateLabel(state),
          summary: 'No attendance record is available for this date.',
          shift: 'General Shift',
          checkIn: '--',
          checkOut: '--',
          workingHours: '00h 00m',
          thumbStatus: 'Not Available',
          note: `Attendance is marked absent.${specialEventSuffix}`.trim(),
        };
      case 'weekend':
        return {
          state,
          statusText: this.resolveStateLabel(state),
          summary: 'This date is marked as a weekly off.',
          shift: 'Week Off',
          checkIn: '--',
          checkOut: '--',
          workingHours: 'Week Off',
          thumbStatus: 'Not Required',
          note: specialEvent ? specialEvent.description : 'This date is marked as a weekly off.',
        };
      case 'holiday':
        return {
          state,
          statusText: this.resolveStateLabel(state),
          summary: 'This date is marked as a holiday.',
          shift: 'Holiday',
          checkIn: '--',
          checkOut: '--',
          workingHours: 'Holiday',
          thumbStatus: 'Not Required',
          note: specialEvent ? specialEvent.description : 'This date is marked as a holiday.',
        };
      case 'leave':
        return {
          state,
          statusText: this.resolveStateLabel(state),
          summary: 'Attendance is marked on leave for this date.',
          shift: 'Leave',
          checkIn: '--',
          checkOut: '--',
          workingHours: 'Approved Leave',
          thumbStatus: 'Not Required',
          note: 'Approved leave has been applied for this date.',
        };
      case 'upcoming':
      default:
        return {
          state,
          statusText: this.resolveStateLabel(state),
          summary: 'Attendance has not been recorded yet for this future date.',
          shift: 'Upcoming',
          checkIn: '--',
          checkOut: '--',
          workingHours: 'Pending',
          thumbStatus: 'Pending',
          note: specialEvent ? specialEvent.description : 'Attendance details will appear after punches are recorded.',
        };
    }
  }

  private resolveSpecialEvent(date: Date): CalendarEvent | null {
    const monthDayKey = `${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
    const eventSeed = this.recurringEvents[monthDayKey];
    if (!eventSeed) {
      return null;
    }

    const normalizedEvent: CalendarEventSeed = {
      ...eventSeed,
      description: this.normalizeSpecialEventDescription(eventSeed),
      imageUrl: this.normalizeSpecialEventImage(eventSeed.imageUrl),
    };

    return {
      ...normalizedEvent,
      imageUrl: normalizedEvent.imageUrl || this.buildEventImage(normalizedEvent),
    };
  }

  private normalizeSpecialEventDescription(eventSeed: CalendarEventSeed): string {
    const description = `${eventSeed.description || ''}`.trim();
    if (description) {
      return description;
    }

    return `${eventSeed.title} is highlighted on the calendar for this date.`;
  }

  private normalizeSpecialEventImage(imageUrl: string): string {
    const normalized = `${imageUrl || ''}`.trim().replace(/\\/g, '/').replace(/^\.?\//, '');
    if (!normalized) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('/assets/')) {
      return normalized;
    }

    if (normalized.startsWith('assets/')) {
      return normalized;
    }

    return `assets/${normalized.replace(/^\/+/, '')}`;
  }

  private buildEventImage(eventSeed: CalendarEventSeed): string {
    const eventType = this.getEventTypeLabel(eventSeed.type);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 680" role="img" aria-label="${eventSeed.title}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${eventSeed.accentFrom}" />
            <stop offset="100%" stop-color="${eventSeed.accentTo}" />
          </linearGradient>
        </defs>
        <rect width="1200" height="680" rx="44" fill="url(#bg)" />
        <circle cx="1050" cy="120" r="110" fill="rgba(255,255,255,0.16)" />
        <circle cx="180" cy="560" r="160" fill="rgba(255,255,255,0.10)" />
        <rect x="72" y="88" width="1056" height="504" rx="36" fill="rgba(10,22,47,0.12)" stroke="rgba(255,255,255,0.22)" />
        <rect x="104" y="126" width="192" height="56" rx="28" fill="rgba(255,255,255,0.18)" />
        <text x="200" y="162" font-size="26" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="700">${eventType}</text>
        <text x="104" y="292" font-size="72" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="800">${eventSeed.title}</text>
        <text x="104" y="354" font-size="30" fill="rgba(255,255,255,0.88)" font-family="Arial, Helvetica, sans-serif">${eventSeed.description}</text>
        <rect x="104" y="428" width="170" height="108" rx="28" fill="rgba(255,255,255,0.20)" />
        <text x="189" y="494" font-size="54" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="800">${eventSeed.badge}</text>
        <text x="104" y="610" font-size="24" fill="rgba(255,255,255,0.78)" font-family="Arial, Helvetica, sans-serif">HR Dashboard Calendar Event</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private formatTime(hours: number, minutes: number): string {
    const normalizedHours = hours % 24;
    const normalizedMinutes = minutes % 60;
    const meridiem = normalizedHours >= 12 ? 'PM' : 'AM';
    const displayHours = normalizedHours % 12 || 12;
    const displayMinutes = `${normalizedMinutes}`.padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${meridiem}`;
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private findCalendarDay(date: Date): CalendarDay | null {
    const key = this.getDateKey(date);
    for (const week of this.calendarWeeks) {
      const match = week.find((day) => day.date && this.getDateKey(day.date) === key);
      if (match) {
        return match;
      }
    }

    return null;
  }
}
