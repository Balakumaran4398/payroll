import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppRole, AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { Employee } from '../../../employee/employee.types';

type AttendanceState = 'present' | 'absent' | 'late' | 'half-day' | 'leave' | 'holiday' | 'weekend' | 'upcoming';
type ActionTone = 'blue' | 'purple' | 'orange' | 'teal';
type CalendarEventType = 'holiday' | 'festival' | 'important';

interface EmployeeStatCard {
  title: string;
  value: string;
  icon: string;
  tone: 'success' | 'danger' | 'warning' | 'primary';
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

interface AttendanceRecord {
  summary: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
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
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly attendanceLegend: AttendanceLegendItem[] = [
    { state: 'present', label: 'Present', description: 'Present - Full Day' },
    { state: 'absent', label: 'Absent', description: 'No attendance marked' },
    { state: 'late', label: 'Late', description: 'Late punch-in recorded' },
    { state: 'half-day', label: 'Half Day', description: 'Half Day Leave' },
    { state: 'leave', label: 'Leave', description: 'Approved leave day' },
    { state: 'holiday', label: 'Special Day', description: 'Holiday, festival, or important day entry' },
  ];
  readonly calendarActions = [
    { title: 'Apply Leave', subtitle: 'Create leave request', icon: 'event_available', tone: 'blue' as const, route: '/app/attendance/apply-leave' },
    { title: 'Regularize Punch', subtitle: 'Fix missed swipe logs', icon: 'touch_app', tone: 'orange' as const, route: '/app/attendance/regularize-swipe' },
    { title: 'Request OD', subtitle: 'Submit on-duty request', icon: 'work_history', tone: 'purple' as const, route: '/app/attendance/request-od' },
    { title: 'Raise Query', subtitle: 'Ask HR for clarification', icon: 'support_agent', tone: 'teal' as const, route: '/app/attendance/raise-query' },
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
  birthdaysToday: BirthdayEmployee[] = [];
  anniversariesToday: AnniversaryEmployee[] = [];
  newJoiners: NewJoinerEmployee[] = [];

  statCards: EmployeeStatCard[] = [];

  readonly quickActions: QuickAction[] = [
    { title: 'Apply Leave', subtitle: 'Request planned leave in seconds', icon: 'event_available', tone: 'blue', route: '/app/attendance/apply-leave' },
    { title: 'Regularize Swipe', subtitle: 'Correct missed or late punches', icon: 'fingerprint', tone: 'orange', route: '/app/attendance/regularize-swipe' },
    { title: 'Permission Request', subtitle: 'Submit short-time approval', icon: 'verified_user', tone: 'purple', route: '/app/attendance/permission-request' },
    { title: 'Request OD', subtitle: 'Submit on-duty movement for field visits, client meetings, or travel work', icon: 'work_history', tone: 'orange', route: '/app/attendance/request-od' },
    { title: 'Attendance Report', subtitle: 'Review monthly attendance summary', icon: 'insights', tone: 'teal', route: '/app/reports' },
  ];

  constructor(private authService: AuthService, private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.employeeName = this.resolveEmployeeName();
    this.greetingName = this.resolveFirstName(this.employeeName);
    this.heroDate = this.formatHeroDate(new Date());
    this.heroSubtitle = this.resolveHeroSubtitle(this.authService.getRole());
    this.heroRoleLabel = this.formatRoleLabel(this.authService.getRole());
    this.heroWelcomeMessage = this.buildWelcomeMessage(this.greetingName);
    this.heroImageUrl = this.buildFallbackAvatar(this.employeeName);
    this.viewedDate = new Date();
    this.viewedDate.setDate(1);
    this.rebuildCalendar();
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
    this.rebuildCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.viewedDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedCalendarDay = null;
    this.rebuildCalendar();
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
    const activeDay = this.selectedCalendarDay;
    const details = activeDay?.details;
    if (!activeDay || !details) {
      return [];
    }

    if (activeDay.specialEvent) {
      return [
        { label: 'Event Type', value: this.getEventTypeLabel(activeDay.specialEvent.type), icon: 'celebration' },
        { label: 'Status', value: activeDay.stateLabel, icon: 'event' },
        { label: 'Schedule', value: details.shift, icon: 'schedule' },
        { label: 'Summary', value: details.totalHours, icon: 'info' },
      ];
    }

    return [
      { label: 'Shift', value: details.shift, icon: 'badge' },
      { label: 'Check In', value: details.checkIn, icon: 'login' },
      { label: 'Check Out', value: details.checkOut, icon: 'logout' },
      { label: 'Work Summary', value: details.totalHours, icon: 'schedule' },
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

  // getEventTypeLabel(type: CalendarEventType): string {
  //   return type === 'festival' ? 'Festival' : 'Holiday';
  // }

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
    this.apiService.getEmployeeList().subscribe({
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
    this.router.navigate(['/', ...route.split('/').filter(Boolean)], { queryParams });
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
      const dateKey = this.getDateKey(cellDate);

      cells.push({
        date: cellDate,
        day,
        state,
        stateLabel: this.resolveStateLabel(state, specialEvent),
        tooltipLabel: this.resolveTooltipLabel(state, specialEvent),
        selected: selectedKey ? dateKey === selectedKey : dateKey === todayKey,
        today: dateKey === todayKey,
        future: isFuture,
        details: this.buildAttendanceDetails(cellDate, state, specialEvent),
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
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
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
        } else if (day.state === 'leave' || day.state === 'half-day' || day.state === 'holiday') {
          counts.leave += 1;
        }
      }
    }

    this.statCards = [
      { title: 'Present', value: `${counts.present}`, icon: 'task_alt', tone: 'success' },
      { title: 'Absent', value: `${counts.absent}`, icon: 'event_busy', tone: 'danger' },
      { title: 'Late', value: `${counts.late}`, icon: 'schedule', tone: 'warning' },
      { title: 'Leave / Holiday', value: `${counts.leave}`, icon: 'celebration', tone: 'primary' },
    ];
  }

  private resolveAttendanceState(date: Date, isFuture: boolean, specialEvent: CalendarEvent | null): AttendanceState {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    if (specialEvent) {
      return 'holiday';
    }

    if (isFuture) {
      return 'upcoming';
    }

    if (dayOfWeek === 0) {
      return 'weekend';
    }

    if (dayOfMonth % 13 === 0) {
      return 'leave';
    }

    if (dayOfMonth % 9 === 0) {
      return 'half-day';
    }

    if (dayOfMonth % 7 === 0) {
      return 'late';
    }

    if (dayOfMonth % 5 === 0 || dayOfMonth % 11 === 0) {
      return 'absent';
    }

    return 'present';
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
      case 'holiday':
        return specialEvent ? this.getEventTypeLabel(specialEvent.type) : 'Holiday';
      case 'weekend':
        return 'Week Off';
      case 'upcoming':
      default:
        return 'Upcoming';
    }
  }

  private resolveTooltipLabel(state: AttendanceState, specialEvent: CalendarEvent | null): string {
    if (specialEvent) {
      return this.resolveEventTooltipLabel(specialEvent);
    }

    switch (state) {
      case 'present':
        return 'Present - Full Day';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late Arrival';
      case 'half-day':
        return 'Half Day Leave';
      case 'leave':
        return 'Approved Leave';
      case 'holiday':
        return 'Holiday';
      case 'weekend':
        return 'Sunday - Week Off';
      case 'upcoming':
      default:
        return 'Upcoming - Attendance Pending';
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
    const daySeed = date.getDate();
    const presentCheckIn = this.formatTime(9, 4 + (daySeed % 12));
    const presentCheckOut = this.formatTime(18, 6 + (daySeed % 16));
    const lateCheckIn = this.formatTime(9, 24 + (daySeed % 18));

    if (specialEvent) {
      return {
        summary: `${specialEvent.title} is marked on the calendar for this date.`,
        shift: `${this.getEventTypeLabel(specialEvent.type)} Calendar`,
        checkIn: '--',
        checkOut: '--',
        totalHours: 'Holiday Schedule',
        note: specialEvent.description,
      };
    }

    switch (state) {
      case 'present':
        return {
          summary: 'Completed the full shift with standard attendance compliance.',
          shift: 'General Shift',
          checkIn: presentCheckIn,
          checkOut: presentCheckOut,
          totalHours: `08h ${18 + (daySeed % 24)}m`,
          note: 'Attendance is healthy for the day. No exception or correction is required.',
        };
      case 'absent':
        return {
          summary: 'No punch record was captured for this working day.',
          shift: 'General Shift',
          checkIn: '--',
          checkOut: '--',
          totalHours: '00h 00m',
          note: 'This date is marked absent. Use regularization only if there was a missed punch or manual attendance issue.',
        };
      case 'late':
        return {
          summary: 'Employee checked in after shift start and attendance is marked late.',
          shift: 'General Shift',
          checkIn: lateCheckIn,
          checkOut: this.formatTime(18, 12 + (daySeed % 12)),
          totalHours: `08h ${2 + (daySeed % 18)}m`,
          note: 'Grace time was exceeded on this date. HR or reporting manager approval may be required for adjustment.',
        };
      case 'half-day':
        return {
          summary: 'Attendance was recorded for half of the working day.',
          shift: 'Half Day',
          checkIn: this.formatTime(9, 8 + (daySeed % 10)),
          checkOut: this.formatTime(13, 10 + (daySeed % 20)),
          totalHours: `04h ${10 + (daySeed % 22)}m`,
          note: 'Half day leave is linked to this date. Review the leave request if shift coverage needs validation.',
        };
      case 'leave':
        return {
          summary: 'Approved leave was applied for the full working day.',
          shift: 'Leave',
          checkIn: '--',
          checkOut: '--',
          totalHours: 'Approved Leave',
          note: 'This date is on approved leave. No action is required unless the leave request needs to be modified.',
        };
      case 'weekend':
        return {
          summary: 'Sunday is configured as the weekly off day in this calendar.',
          shift: 'Week Off',
          checkIn: '--',
          checkOut: '--',
          totalHours: 'Weekly Off',
          note: 'Only Sunday is treated as week off. Saturday remains a working day unless a holiday is added separately.',
        };
      case 'holiday':
        return {
          summary: 'Holiday is marked for this date.',
          shift: 'Holiday',
          checkIn: '--',
          checkOut: '--',
          totalHours: 'Holiday',
          note: 'This date is blocked by the holiday calendar.',
        };
      case 'upcoming':
      default:
        return {
          summary: 'Attendance has not been recorded yet because the date is in the future.',
          shift: 'Upcoming',
          checkIn: '--',
          checkOut: '--',
          totalHours: 'Pending',
          note: 'The day has not started yet or is still in progress. Attendance data will appear automatically after punches are recorded.',
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
