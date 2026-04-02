import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Employee } from '../../../employee/employee.types';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

type MetricTone = 'primary' | 'success' | 'warning' | 'danger';
type AttendanceTone = 'present' | 'late' | 'absent' | 'leave' | 'half-day' | 'weekend' | 'holiday' | 'neutral';

interface AdminMetricCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: MetricTone;
}

interface DashboardEmployeeRecord extends Employee {
  [key: string]: unknown;
}

interface AdminDirectoryEmployee {
  id: number;
  name: string;
  email: string;
  mobile: string;
  initials: string;
  department: string;
  position: string;
  biometricId: string;
  baseSalary: string;
  joinDate: string;
}

interface DashboardAttendanceApiItem {
  date?: string | null;
  day?: string | null;
  in_time?: string | null;
  out_time?: string | null;
  inTime?: string | null;
  outTime?: string | null;
  thump_status?: string | null;
  thumb_status?: string | null;
  thumbstatus?: string | null;
  thumbStatus?: string | null;
  leave_status?: string | null;
  attendance_status?: string | null;
  attendanceStatus?: string | null;
  day_status?: string | null;
  dayStatus?: string | null;
  status?: string | null;
  working_hours?: string | null;
  workingHours?: string | null;
  total_hours?: string | null;
  totalHours?: string | null;
  shift?: string | null;
  shift_name?: string | null;
  shift_type?: string | null;
  shiftName?: string | null;
  is_holiday?: boolean | string | number | null;
  is_weekoff?: boolean | string | number | null;
}

interface AdminAttendanceItem {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  initials: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  statusLabel: string;
  tone: AttendanceTone;
  note: string;
}

interface DashboardPendingLeaveItem {
  id?: number | string | null;
  empid?: number | string | null;
  leave_type_id?: number | string | null;
  leave_type?: string | null;
  leaveType?: string | null;
  leave_type_label?: string | null;
  fromdate?: string | null;
  todate?: string | null;
  totaldays?: number | string | null;
  reason?: string | null;
  status?: string | null;
  createddate?: string | null;
  employee_name?: string | null;
}

interface DashboardLeaveRequestItem {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  initials: string;
  leaveType: string;
  dateRange: string;
  duration: string;
  reason: string;
}

interface DashboardAllRequestsResponse {
  leave?: {
    pending?: DashboardPendingLeaveItem[];
  };
  data?: DashboardAllRequestsResponse;
  result?: DashboardAllRequestsResponse;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  readonly today = new Date();
  readonly todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(this.today);
  readonly currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this.today);
  readonly currentYear = `${this.today.getFullYear()}`;
  readonly attendancePreviewLimit = 8;
  readonly leavePreviewLimit = 4;

  adminName = 'Admin';
  directorySearchTerm = '';
  isLoading = false;
  loadError = '';

  directoryEmployees: AdminDirectoryEmployee[] = [];
  todayAttendance: AdminAttendanceItem[] = [];
  pendingLeaveRequests: DashboardLeaveRequestItem[] = [];
  userid: number;
  constructor(
    private apiService: ApiService,
    private authService: AuthService, private tokenStorage: TokenStorageService,
    private router: Router
  ) {
    this.userid = tokenStorage.getID();
  }

  ngOnInit(): void {
    this.adminName = `${this.authService.getEmpname() || 'Admin'}`.trim() || 'Admin';
    this.loadAdminWorkspace();
  }

  get statCards(): AdminMetricCard[] {
    const presentCount = this.todayAttendance.filter((item) => item.tone === 'present' || item.tone === 'late').length;
    const leaveCount = this.todayAttendance.filter((item) => item.tone === 'leave' || item.tone === 'half-day').length;
    const departmentCount = new Set(
      this.directoryEmployees
        .map((item) => item.department)
        .filter((item) => item && item !== 'Not assigned')
    ).size;

    return [
      {
        label: 'Total Employees',
        value: `${this.directoryEmployees.length}`,
        helper: `${departmentCount || 0} departments`,
        icon: 'groups',
        tone: 'primary',
      },
      {
        label: 'Present Today',
        value: `${presentCount}`,
        helper: `${Math.max(this.todayAttendance.length - presentCount, 0)} need review`,
        icon: 'task_alt',
        tone: 'success',
      },
      {
        label: 'Pending Leave Requests',
        value: `${this.pendingLeaveRequests.length}`,
        helper: 'Waiting for review',
        icon: 'event_busy',
        tone: 'warning',
      },
      {
        label: 'On Leave Today',
        value: `${leaveCount}`,
        helper: `${this.currentMonth} ${this.currentYear} snapshot`,
        icon: 'beach_access',
        tone: 'danger',
      },
    ];
  }

  get attendancePreview(): AdminAttendanceItem[] {
    return this.todayAttendance.slice(0, this.attendancePreviewLimit);
  }

  get leavePreview(): DashboardLeaveRequestItem[] {
    return this.pendingLeaveRequests.slice(0, this.leavePreviewLimit);
  }

  get filteredDirectoryEmployees(): AdminDirectoryEmployee[] {
    const searchTerm = this.directorySearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      return this.directoryEmployees;
    }

    return this.directoryEmployees.filter((employee) => [
      employee.name,
      employee.email,
      employee.mobile,
      employee.department,
      employee.position,
      employee.biometricId,
      employee.id,
    ].join(' ').toLowerCase().includes(searchTerm));
  }

  trackByMetricLabel(_index: number, item: AdminMetricCard): string {
    return item.label;
  }

  trackByAttendanceEmployee(_index: number, item: AdminAttendanceItem): number {
    return item.employeeId;
  }

  trackByLeaveId(_index: number, item: DashboardLeaveRequestItem): number {
    return item.id;
  }

  trackByEmployeeId(_index: number, item: AdminDirectoryEmployee): number {
    return item.id;
  }

  openAttendanceDesk(): void {
    this.router.navigate(['/app/attendance']);
  }

  openLeaveManagement(): void {
    this.router.navigate(['/app/attendance/app-leave-management']);
  }

  openEmployeeAttendance(employeeId: number): void {
    if (!employeeId) {
      return;
    }

    this.router.navigate(['/app/attendance'], {
      queryParams: {
        employeeId,
        month: this.currentMonth,
        year: this.currentYear,
      },
    });
  }

  private loadAdminWorkspace(): void {
    const currentEmployeeId = Number(this.authService.getID() || 0) || 0;

    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      employees: this.apiService.getEmployeeList(this.userid).pipe(catchError(() => of([]))),
      requests: currentEmployeeId ? this.apiService.getAllrequests(currentEmployeeId).pipe(catchError(() => of(null))) : of(null),
    }).subscribe({
      next: ({ employees, requests }) => {
        this.directoryEmployees = this.normalizeDirectoryEmployees(employees as DashboardEmployeeRecord[]);
        this.pendingLeaveRequests = this.extractPendingLeaveRequests(requests);

        if (!this.directoryEmployees.length) {
          this.todayAttendance = [];
          this.isLoading = false;
          return;
        }

        this.loadTodayAttendance(this.directoryEmployees);
      },
      error: () => {
        this.loadError = 'Unable to load the admin dashboard right now.';
        this.isLoading = false;
      },
    });
  }

  private loadTodayAttendance(employees: AdminDirectoryEmployee[]): void {
    const attendanceRequests = employees.map((employee) =>
      this.apiService.getAttendanceDetails(employee.id, this.currentMonth, this.currentYear).pipe(
        map((response) => this.mapTodayAttendance(employee, response)),
        catchError(() => of(this.createMissingAttendanceRow(employee)))
      )
    );

    forkJoin(attendanceRequests)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (rows) => {
          this.todayAttendance = rows.sort((left, right) => {
            const tonePriority = this.getAttendanceTonePriority(left.tone) - this.getAttendanceTonePriority(right.tone);
            return tonePriority !== 0
              ? tonePriority
              : left.employeeName.localeCompare(right.employeeName);
          });
        },
        error: () => {
          this.todayAttendance = [];
        },
      });
  }

  private normalizeDirectoryEmployees(employees: DashboardEmployeeRecord[]): AdminDirectoryEmployee[] {
    return (employees || [])
      .filter((employee) => employee && employee.isactive !== false && !employee.isdelete)
      .map((employee) => ({
        id: Number(employee.id || 0) || 0,
        name: this.getEmployeeName(employee),
        email: `${employee.email || employee.alternate_email || 'Not available'}`.trim() || 'Not available',
        mobile: `${employee.mobile || 'Not available'}`.trim() || 'Not available',
        initials: this.getInitials(this.getEmployeeName(employee)),
        department: `${employee.department_name || ''}`.trim() || 'Not assigned',
        position: `${employee.position || ''}`.trim() || 'Not assigned',
        biometricId: `${employee.attendanceid || employee.id || '--'}`,
        baseSalary: this.formatCurrency(this.readRecordValue(employee, ['base_salary', 'baseSalary', 'salary', 'monthly_salary', 'fixed_salary'])),
        joinDate: this.formatDisplayDate(employee.joining_date),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private mapTodayAttendance(employee: AdminDirectoryEmployee, response: unknown): AdminAttendanceItem {
    const todayKey = this.toIsoDate(this.today);
    const todayRecord = this.extractAttendanceList(response)
      .find((item) => this.resolveDateKey(item) === todayKey);

    if (!todayRecord) {
      return this.createMissingAttendanceRow(employee);
    }

    const checkIn = this.formatTimeOnly(todayRecord.in_time ?? todayRecord.inTime);
    const checkOut = this.formatTimeOnly(todayRecord.out_time ?? todayRecord.outTime);
    const statusLabel = this.resolveAttendanceStatusLabel(todayRecord, checkIn, checkOut);
    const tone = this.resolveAttendanceTone(todayRecord, statusLabel, checkIn, checkOut);
    const workingHours = this.resolveWorkingHours(todayRecord.working_hours ?? todayRecord.workingHours ?? todayRecord.total_hours ?? todayRecord.totalHours);

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.biometricId,
      department: employee.department,
      initials: employee.initials,
      checkIn,
      checkOut,
      workingHours,
      statusLabel,
      tone,
      note: this.buildAttendanceNote(tone, checkIn, checkOut),
    };
  }

  private createMissingAttendanceRow(employee: AdminDirectoryEmployee): AdminAttendanceItem {
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.biometricId,
      department: employee.department,
      initials: employee.initials,
      checkIn: '--',
      checkOut: '--',
      workingHours: '0h 0m',
      statusLabel: 'Absent',
      tone: 'absent',
      note: 'No punch recorded for today',
    };
  }

  private extractAttendanceList(response: unknown): DashboardAttendanceApiItem[] {
    if (Array.isArray(response)) {
      return response as DashboardAttendanceApiItem[];
    }

    if (Array.isArray((response as { data?: unknown[] })?.data)) {
      return (response as { data: DashboardAttendanceApiItem[] }).data;
    }

    if (Array.isArray((response as { result?: unknown[] })?.result)) {
      return (response as { result: DashboardAttendanceApiItem[] }).result;
    }

    if (Array.isArray((response as { records?: unknown[] })?.records)) {
      return (response as { records: DashboardAttendanceApiItem[] }).records;
    }

    return [];
  }

  private extractPendingLeaveRequests(response: unknown): DashboardLeaveRequestItem[] {
    const source = (response as DashboardAllRequestsResponse)?.data && !Array.isArray((response as DashboardAllRequestsResponse).data)
      ? (response as DashboardAllRequestsResponse).data
      : (response as DashboardAllRequestsResponse)?.result && !Array.isArray((response as DashboardAllRequestsResponse).result)
        ? (response as DashboardAllRequestsResponse).result
        : response as DashboardAllRequestsResponse | null;

    const pendingItems = Array.isArray(source?.leave?.pending)
      ? source.leave.pending
      : [];

    return pendingItems
      .map((item) => this.mapPendingLeaveRequest(item))
      .sort((left, right) => right.id - left.id);
  }

  private mapPendingLeaveRequest(item: DashboardPendingLeaveItem): DashboardLeaveRequestItem {
    const employeeId = Number(item.empid || 0) || 0;
    const employeeName = `${item.employee_name || `Employee #${employeeId || '--'}`}`.trim();
    const leaveType = this.resolveLeaveTypeLabel(item);

    return {
      id: Number(item.id || 0) || 0,
      employeeId,
      employeeName,
      employeeCode: this.buildEmployeeCode(employeeId),
      initials: this.getInitials(employeeName),
      leaveType,
      dateRange: this.buildLeaveDateRange(item.fromdate, item.todate),
      duration: this.formatLeaveDuration(item.totaldays),
      reason: `${item.reason || ''}`.trim() || `${leaveType} request`,
    };
  }

  private resolveDateKey(item: DashboardAttendanceApiItem): string {
    const rawValue = `${item.date || item.in_time || item.inTime || item.out_time || item.outTime || ''}`.trim();
    if (!rawValue) {
      return '';
    }

    const isoMatch = rawValue.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      return isoMatch[0];
    }

    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? '' : this.toIsoDate(parsed);
  }

  private resolveAttendanceStatusLabel(
    item: DashboardAttendanceApiItem,
    checkIn: string,
    checkOut: string
  ): string {
    const rawStatus = [
      item.attendance_status,
      item.attendanceStatus,
      item.day_status,
      item.dayStatus,
      item.status,
      item.leave_status,
    ].map((value) => `${value || ''}`.trim()).find(Boolean);

    if (rawStatus) {
      return this.formatLabel(rawStatus);
    }

    if (checkIn !== '--' || checkOut !== '--') {
      return 'Present';
    }

    return 'Absent';
  }

  private resolveAttendanceTone(
    item: DashboardAttendanceApiItem,
    statusLabel: string,
    checkIn: string,
    checkOut: string
  ): AttendanceTone {
    if (this.toBooleanValue(item.is_holiday)) {
      return 'holiday';
    }

    if (this.toBooleanValue(item.is_weekoff)) {
      return 'weekend';
    }

    const normalizedStatus = statusLabel.trim().toLowerCase();

    if (normalizedStatus.includes('half')) {
      return 'half-day';
    }

    if (normalizedStatus.includes('leave')) {
      return 'leave';
    }

    if (normalizedStatus.includes('late')) {
      return 'late';
    }

    if (normalizedStatus.includes('present')) {
      return 'present';
    }

    if (normalizedStatus.includes('absent')) {
      return 'absent';
    }

    if (checkIn === '--' && checkOut === '--') {
      return 'absent';
    }

    return 'neutral';
  }

  private resolveWorkingHours(value: string | null | undefined): string {
    return this.formatHourLabel(value) || '0h 0m';
  }

  private buildAttendanceNote(tone: AttendanceTone, checkIn: string, checkOut: string): string {
    switch (tone) {
      case 'present':
        return `Checked in at ${checkIn}`;
      case 'late':
        return 'Late punch needs review';
      case 'leave':
        return 'Marked on approved leave';
      case 'half-day':
        return 'Half day attendance recorded';
      case 'holiday':
        return 'Holiday schedule';
      case 'weekend':
        return 'Weekend off';
      case 'absent':
        return checkIn === '--' && checkOut === '--' ? 'No punch recorded for today' : 'Attendance incomplete';
      default:
        return 'Attendance captured';
    }
  }

  private buildLeaveDateRange(fromDate: string | null | undefined, toDate: string | null | undefined): string {
    const start = this.formatDisplayDate(fromDate);
    const end = this.formatDisplayDate(toDate);

    if (start === '--' && end === '--') {
      return 'Date not available';
    }

    if (start === end) {
      return start;
    }

    return `${start} - ${end}`;
  }

  private formatLeaveDuration(value: number | string | null | undefined): string {
    const totalDays = Number(value);
    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      return 'Duration not available';
    }

    return `${totalDays} day${totalDays === 1 ? '' : 's'}`;
  }

  private resolveLeaveTypeLabel(item: DashboardPendingLeaveItem): string {
    const directLabel = [
      item.leave_type,
      item.leaveType,
      item.leave_type_label,
    ].map((value) => `${value || ''}`.trim()).find(Boolean);

    if (directLabel) {
      return this.formatLabel(directLabel);
    }

    const leaveTypeId = Number(item.leave_type_id || 0);
    switch (leaveTypeId) {
      case 1:
        return 'Casual Leave';
      case 2:
        return 'Sick Leave';
      case 3:
        return 'Comp Off';
      case 4:
        return 'Earned Leave';
      default:
        return 'Leave';
    }
  }

  private getAttendanceTonePriority(tone: AttendanceTone): number {
    switch (tone) {
      case 'present':
        return 0;
      case 'late':
        return 1;
      case 'leave':
        return 2;
      case 'half-day':
        return 3;
      case 'absent':
        return 4;
      case 'weekend':
        return 5;
      case 'holiday':
        return 6;
      default:
        return 7;
    }
  }

  private formatTimeOnly(value: string | null | undefined): string {
    const rawValue = `${value || ''}`.trim();
    if (!rawValue) {
      return '--';
    }

    const timeMatch = rawValue.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = timeMatch[2];
      const normalizedHours = Number.isFinite(hours) ? `${hours}`.padStart(2, '0') : timeMatch[1];
      return `${normalizedHours}:${minutes}`;
    }

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    return rawValue;
  }

  private formatHourLabel(value: string | null | undefined): string {
    const rawValue = `${value || ''}`.trim();
    if (!rawValue) {
      return '';
    }

    if (/^\d+(\.\d+)?$/.test(rawValue)) {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        return '';
      }

      const totalMinutes = Math.round(numericValue * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    const parts = rawValue.split(':').map((item) => Number(item) || 0);
    if (parts.length >= 2) {
      const hours = parts[0];
      const minutes = parts[1];
      return `${hours}h ${minutes}m`;
    }

    return rawValue;
  }

  private formatDisplayDate(value: string | null | undefined): string {
    const rawValue = `${value || ''}`.trim();
    if (!rawValue) {
      return '--';
    }

    const isoMatch = rawValue.match(/\d{4}-\d{2}-\d{2}/);
    const parsed = new Date(isoMatch ? isoMatch[0] : rawValue);
    if (Number.isNaN(parsed.getTime())) {
      return rawValue;
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatCurrency(value: unknown): string {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Not set';
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private getEmployeeName(employee: DashboardEmployeeRecord): string {
    return `${employee.firstname || ''} ${employee.lastname || ''}`.trim()
      || `${employee.username || ''}`.trim()
      || `${employee.email || ''}`.trim()
      || `Employee ${employee.id || ''}`.trim();
  }

  private buildEmployeeCode(employeeId: number): string {
    return employeeId ? `EMP${`${employeeId}`.padStart(3, '0')}` : 'EMP---';
  }

  private getInitials(value: string): string {
    const segments = `${value || ''}`.trim().split(/\s+/).filter(Boolean);
    if (!segments.length) {
      return 'EM';
    }

    return segments.slice(0, 2).map((segment) => segment[0]?.toUpperCase() || '').join('') || 'EM';
  }

  private readRecordValue(record: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && `${value}`.trim() !== '') {
        return value;
      }
    }

    return null;
  }

  private formatLabel(value: string): string {
    return `${value || ''}`
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private toBooleanValue(value: boolean | string | number | null | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    const normalizedValue = `${value || ''}`.trim().toLowerCase();
    return normalizedValue === 'true' || normalizedValue === 'yes' || normalizedValue === '1';
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
