import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppRole, AuthService } from 'src/app/core/services/auth.service';
import { ApiService } from 'src/app/core/services/api.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { Employee } from 'src/app/features/employee/employee.types';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

type AttendanceTone = 'present' | 'late' | 'absent' | 'leave' | 'half-day' | 'weekend' | 'holiday' | 'neutral';

interface AttendanceSummaryCard {
  label: string;
  value: string;
  icon: string;
  tone: AttendanceTone;
}

interface AttendanceInsightCard {
  label: string;
  value: string;
  helper: string;
  tone: AttendanceTone;
}

interface AttendanceBreakdownItem {
  label: string;
  count: number;
  tone: AttendanceTone;
}

interface AttendanceEmployeeOption {
  id: number;
  name: string;
  code: string;
  email: string;
  mobile: string;
  department: string;
  position: string;
  role: string;
  shift: string;
}

interface AttendanceApiItem {
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
  extra_hours?: string | null;
  extraHours?: string | null;
  shift?: string | null;
  shift_name?: string | null;
  shift_type?: string | null;
  shiftName?: string | null;
  shift_in_time?: string | null;
  shift_out_time?: string | null;
  portion?: string | null;
  user_type1?: string | null;
  user_type2?: string | null;
  is_holiday?: boolean | string | number | null;
  is_weekoff?: boolean | string | number | null;
}

interface AttendanceRecordRow {
  dateKey: string;
  dateLabel: string;
  dayLabel: string;
  shift: string;
  shiftTime: string;
  shiftStart: string;
  shiftEnd: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  extraHours: string;
  statusLabel: string;
  statusTone: AttendanceTone;
  thumbStatus: string;
  thumbTone: AttendanceTone;
  leaveLabel: string;
  leaveDescription: string;
  portionLabel: string;
  note: string;
}
@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit, OnDestroy {
  readonly todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  readonly monthOptions = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  readonly yearOptions = this.buildYearOptions();

  selectedEmployeeId = 0;
  selectedMonth = this.monthOptions[new Date().getMonth()];
  selectedYear = `${new Date().getFullYear()}`;
  employeeSearchTerm = '';

  isLoading = false;
  loadError = '';
  lastUpdatedLabel = '';

  employeeOptions: AttendanceEmployeeOption[] = [];
  attendanceRecords: AttendanceRecordRow[] = [];
  selectedAttendanceRecord: AttendanceRecordRow | null = null;

  private fallbackEmployeeName = '';
  private currentEmployeeId = 0;
  private routeSubscription?: Subscription;
  private pendingRequestedEmployeeId = 0;
  userid: number;
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private feedback: UiFeedbackService, private tokenService: TokenStorageService,
    private route: ActivatedRoute
  ) {
    this.userid = tokenService.getID();

  }

  ngOnInit(): void {
    this.currentEmployeeId = Number(this.authService.getID() || 0) || 0;
    if (!this.canSelectEmployee) {
      this.selectedEmployeeId = this.currentEmployeeId;
    }
    this.fallbackEmployeeName = `${this.authService.getEmpname() || 'Employee'}`.trim() || 'Employee';
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const requestedEmployeeId = Number(params.get('employeeId') || 0) || 0;
      const requestedMonth = this.normalizeRequestedMonth(params.get('month'));
      const requestedYear = this.normalizeRequestedYear(params.get('year'));
      let shouldReload = false;

      this.pendingRequestedEmployeeId = requestedEmployeeId;

      if (requestedMonth && requestedMonth !== this.selectedMonth) {
        this.selectedMonth = requestedMonth;
        shouldReload = true;
      }

      if (requestedYear && requestedYear !== this.selectedYear) {
        this.selectedYear = requestedYear;
        shouldReload = true;
      }

      if (this.applyRequestedEmployeeSelection()) {
        shouldReload = true;
      }

      if (this.employeeOptions.length && shouldReload) {
        this.loadAttendance();
      }
    });
    this.loadEmployeeContext();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.selectedAttendanceRecord) {
      this.closeAttendanceDialog();
    }
  }

  get currentRole(): AppRole | null {
    return this.authService.getRole();
  }

  get canSelectEmployee(): boolean {
    return !this.authService.hasAnyRole(['ROLE_EMPLOYEE']);
  }

  get selectedEmployee(): AttendanceEmployeeOption | null {
    return this.employeeOptions.find((item) => item.id === this.selectedEmployeeId) || null;
  }

  get activeEmployeeDetails(): AttendanceEmployeeOption | null {
    return this.selectedEmployee || this.resolveEmployeeFromSearchTerm();
  }

  get filteredEmployeeOptions(): AttendanceEmployeeOption[] {
    const searchTerm = this.employeeSearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      return this.employeeOptions;
    }

    return this.employeeOptions.filter((item) => {
      const searchableText = [
        item.name,
        item.code,
        item.department,
        item.position,
        item.role,
        item.id,
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  get pageTitle(): string {
    return this.canSelectEmployee ? 'Attendance Workspace' : 'My Attendance';
  }

  // get pageSubtitle(): string {
  //   return this.canSelectEmployee
  //     ? 'Review biometric punches, leave statuses, and shift adherence for the selected employee.'
  //     : 'Track your monthly biometric attendance, work hours, and extra hours in one modern view.';
  // }

  get activeEmployeeName(): string {
    return this.activeEmployeeDetails?.name || this.fallbackEmployeeName;
  }

  get activeEmployeeCode(): string {
    return this.activeEmployeeDetails?.code || `${this.selectedEmployeeId || '--'}`;
  }

  get selectedPeriodLabel(): string {
    return `${this.selectedMonth} ${this.selectedYear}`;
  }

  get headerRoleLabel(): string {
    return this.canSelectEmployee ? this.formatRoleLabel(this.currentRole) : 'Self Service';
  }

  get summaryCards(): AttendanceSummaryCard[] {
    const presentCount = this.attendanceRecords.filter((item) => item.statusTone === 'present' || item.statusTone === 'late').length;
    const lateCount = this.attendanceRecords.filter((item) => item.statusTone === 'late').length;
    const absentCount = this.attendanceRecords.filter((item) => item.statusTone === 'absent').length;
    const leaveCount = this.attendanceRecords.filter((item) => item.statusTone === 'leave' || item.statusTone === 'half-day').length;
    const offCount = this.attendanceRecords.filter((item) => item.statusTone === 'weekend' || item.statusTone === 'holiday').length;
    const extraHours = this.formatDuration(this.attendanceRecords.reduce((total, item) => total + this.durationToSeconds(item.extraHours), 0));

    return [
      { label: 'Present Days', value: `${presentCount}`, icon: 'task_alt', tone: 'present' },
      { label: 'Late Marks', value: `${lateCount}`, icon: 'schedule', tone: 'late' },
      { label: 'Leave / Half Day', value: `${leaveCount}`, icon: 'event_busy', tone: 'leave' },
      { label: 'Week Off / Holiday', value: `${offCount}`, icon: 'beach_access', tone: 'holiday' },
      { label: 'Absent Days', value: `${absentCount}`, icon: 'person_off', tone: 'absent' },
      { label: 'Extra Hours', value: extraHours, icon: 'timer', tone: 'neutral' },
    ];
  }

  get attendanceInsights(): AttendanceInsightCard[] {
    const workingDurations = this.attendanceRecords
      .map((item) => this.durationToSeconds(item.workingHours))
      .filter((item) => item > 0);
    const averageDuration = workingDurations.length
      ? this.formatDuration(Math.round(workingDurations.reduce((total, item) => total + item, 0) / workingDurations.length))
      : '--';
    const extraDuration = this.formatDuration(this.attendanceRecords.reduce((total, item) => total + this.durationToSeconds(item.extraHours), 0));
    const properSwipes = this.attendanceRecords.filter((item) => item.thumbTone === 'present').length;
    const improperSwipes = this.attendanceRecords.filter((item) => item.thumbTone === 'late').length;

    return [
      {
        label: 'Average Work Day',
        value: averageDuration,
        helper: workingDurations.length ? 'Calculated from recorded working hours' : 'No working hour records yet',
        tone: 'present',
      },
      {
        label: 'Monthly Extra Time',
        value: extraDuration,
        helper: 'Total extra hours recorded for this period',
        tone: 'neutral',
      },
      {
        label: 'Thumb Quality',
        value: `${properSwipes} proper / ${improperSwipes} alerts`,
        helper: 'Proper versus irregular thumb punch marks',
        tone: improperSwipes ? 'late' : 'present',
      },
    ];
  }

  get statusBreakdown(): AttendanceBreakdownItem[] {
    return [
      { label: 'Present', count: this.getToneCount('present') + this.getToneCount('late'), tone: 'present' },
      { label: 'Late', count: this.getToneCount('late'), tone: 'late' },
      { label: 'Leave', count: this.getToneCount('leave') + this.getToneCount('half-day'), tone: 'leave' },
      { label: 'Absent', count: this.getToneCount('absent'), tone: 'absent' },
      { label: 'Week Off / Holiday', count: this.getToneCount('weekend') + this.getToneCount('holiday'), tone: 'holiday' },
    ];
  }

  get hasAttendanceRecords(): boolean {
    return this.attendanceRecords.length > 0;
  }

  get selectedDialogTitle(): string {
    if (!this.selectedAttendanceRecord) {
      return '';
    }

    return `${this.selectedAttendanceRecord.dateLabel} • ${this.selectedAttendanceRecord.dayLabel}`;
  }
  onEmployeeSelectOpened(isOpen: boolean): void {
    if (!isOpen) {
      this.employeeSearchTerm = '';
    }
  }

  get selectedDialogSubtitle(): string {
    if (!this.selectedAttendanceRecord) {
      return '';
    }

    return `${this.selectedAttendanceRecord.shift} • ${this.selectedAttendanceRecord.statusLabel}`;
  }

  trackBySummaryLabel(_index: number, item: AttendanceSummaryCard): string {
    return item.label;
  }

  trackByInsightLabel(_index: number, item: AttendanceInsightCard): string {
    return item.label;
  }

  trackByEmployeeId(_index: number, item: AttendanceEmployeeOption): number {
    return item.id;
  }

  trackByDateKey(_index: number, item: AttendanceRecordRow): string {
    return item.dateKey;
  }

  refreshAttendance(): void {
    this.loadAttendance();
  }

  exportReport(): void {
    this.feedback.info('Attendance export will be connected after the report format is finalized.');
  }

  openAttendanceDialog(record: AttendanceRecordRow): void {
    this.selectedAttendanceRecord = record;
  }

  closeAttendanceDialog(): void {
    this.selectedAttendanceRecord = null;
  }

  onDialogContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onEmployeeInputChange(value: string): void {
    this.employeeSearchTerm = value;
  }

  onEmployeeOptionSelected(employee: AttendanceEmployeeOption): void {
    this.selectedEmployeeId = employee.id;
    this.employeeSearchTerm = this.getEmployeeOptionLabel(employee);
    this.loadAttendance();
  }

  private loadEmployeeContext(): void {
    this.apiService.getEmployeeList(this.userid).subscribe({
      next: (employees: Employee[] = []) => {
        this.employeeOptions = this.normalizeEmployeeOptions(employees);
        this.ensureSelectedEmployee();
        this.syncEmployeeSearchTerm();
        this.loadAttendance();
      },
      error: () => {
        this.ensureSelectedEmployee();
        this.syncEmployeeSearchTerm();
        this.loadAttendance();
      },
    });
  }

  private ensureSelectedEmployee(): void {
    if (!this.canSelectEmployee) {
      this.selectedEmployeeId = this.currentEmployeeId;
      return;
    }

    const requestedEmployee = this.pendingRequestedEmployeeId
      ? this.employeeOptions.find((employee) => employee.id === this.pendingRequestedEmployeeId)
      : null;
    if (requestedEmployee) {
      this.selectedEmployeeId = requestedEmployee.id;
      return;
    }

    if (this.selectedEmployee) {
      return;
    }

    const ownEmployeeOption = this.employeeOptions.find((employee) => employee.id === this.currentEmployeeId);
    if (ownEmployeeOption) {
      this.selectedEmployeeId = ownEmployeeOption.id;
      return;
    }

    this.selectedEmployeeId = this.employeeOptions[0]?.id || 0;
  }

  private loadAttendance(): void {
    const employeeId = this.resolveAttendanceEmployeeId();
    if (!employeeId) {
      this.attendanceRecords = [];
      this.loadError = 'Unable to identify the employee for attendance loading.';
      return;
    }

    this.selectedEmployeeId = employeeId;
    this.isLoading = true;
    this.loadError = '';
    this.selectedAttendanceRecord = null;

    this.apiService.getAttendanceDetails(employeeId, this.selectedMonth, this.selectedYear).subscribe({
      next: (response: unknown) => {
        this.attendanceRecords = this.extractAttendanceList(response)
          .map((item) => this.mapAttendanceRecord(item))
          .filter((item): item is AttendanceRecordRow => !!item)
          .sort((left, right) => left.dateKey.localeCompare(right.dateKey));
        this.lastUpdatedLabel = this.formatLastUpdated(new Date());
      },
      error: () => {
        this.attendanceRecords = [];
        this.loadError = 'Unable to load attendance details for the selected period.';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private normalizeEmployeeOptions(employees: Employee[]): AttendanceEmployeeOption[] {
    return this.filterEmployeesByRole((employees || [])
      .filter((item) => item && item.isactive !== false && !item.isdelete))
      .map((item) => ({
        id: item.id,
        name: `${item.firstname || ''} ${item.lastname || ''}`.trim() || item.username || item.email || `Employee ${item.id}`,
        code: `${item.attendanceid || item.id}`,
        email: `${item.email || item.alternate_email || ''}`.trim() || 'Not available',
        mobile: `${item.mobile || ''}`.trim() || 'Not available',
        department: `${item.department_name || ''}`.trim() || 'Department not assigned',
        position: `${item.position || ''}`.trim() || 'Position not assigned',
        role: this.resolveEmployeeRoleLabel(item.role),
        shift: `${item.shift_type || ''}`.trim() || 'General Shift',
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private filterEmployeesByRole(employees: Employee[]): Employee[] {
    if (this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY') {
      return employees;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return employees.filter((employee) => this.isOwnEmployeeRecord(employee) || this.isTeamMember(employee));
    }

    return employees.filter((employee) => this.isOwnEmployeeRecord(employee));
  }

  private isOwnEmployeeRecord(employee: Employee): boolean {
    return !!this.currentEmployeeId && Number(employee.id || 0) === this.currentEmployeeId;
  }

  private isTeamMember(employee: Employee): boolean {
    if (!this.currentEmployeeId) {
      return false;
    }

    return Number(employee.managerid || 0) === this.currentEmployeeId || Number(employee.sub_manager_id || 0) === this.currentEmployeeId;
  }

  private syncEmployeeSearchTerm(): void {
    if (this.activeEmployeeDetails) {
      this.employeeSearchTerm = this.canSelectEmployee
        ? this.getEmployeeOptionLabel(this.activeEmployeeDetails)
        : this.activeEmployeeDetails.name;
    }
  }

  getEmployeeOptionLabel(employee: AttendanceEmployeeOption | null): string {
    if (!employee) {
      return '';
    }

    return `${employee.name} • ${employee.code}`;
  }

  private resolveEmployeeRoleLabel(role: string | null | undefined): string {
    const normalizedRole = `${role || ''}`.trim();
    if (!normalizedRole) {
      return 'Employee';
    }

    if (normalizedRole.startsWith('ROLE_')) {
      return this.formatRoleLabel(normalizedRole as AppRole);
    }

    return this.formatLabel(normalizedRole);
  }

  private resolveAttendanceEmployeeId(): number {
    if (!this.canSelectEmployee) {
      return this.currentEmployeeId;
    }

    return this.activeEmployeeDetails?.id || this.selectedEmployeeId || 0;
  }

  private resolveEmployeeFromSearchTerm(): AttendanceEmployeeOption | null {
    const searchTerm = this.employeeSearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      return null;
    }

    return this.employeeOptions.find((employee) => {
      const optionLabel = this.getEmployeeOptionLabel(employee).toLowerCase();
      return optionLabel === searchTerm || employee.name.toLowerCase() === searchTerm;
    }) || null;
  }

  private applyRequestedEmployeeSelection(): boolean {
    if (!this.canSelectEmployee || !this.pendingRequestedEmployeeId || !this.employeeOptions.length) {
      return false;
    }

    const requestedEmployee = this.employeeOptions.find((employee) => employee.id === this.pendingRequestedEmployeeId);
    if (!requestedEmployee || this.selectedEmployeeId === requestedEmployee.id) {
      return false;
    }

    this.selectedEmployeeId = requestedEmployee.id;
    this.employeeSearchTerm = this.getEmployeeOptionLabel(requestedEmployee);
    return true;
  }

  private normalizeRequestedMonth(value: string | null): string | null {
    const requestedValue = `${value || ''}`.trim().toLowerCase();
    if (!requestedValue) {
      return null;
    }

    return this.monthOptions.find((month) => month.toLowerCase() === requestedValue) || null;
  }

  private normalizeRequestedYear(value: string | null): string | null {
    const requestedValue = `${value || ''}`.trim();
    if (!requestedValue) {
      return null;
    }

    return this.yearOptions.find((year) => year === requestedValue) || null;
  }

  private extractAttendanceList(response: unknown): AttendanceApiItem[] {
    if (Array.isArray(response)) {
      return response as AttendanceApiItem[];
    }

    if (Array.isArray((response as { data?: unknown[] })?.data)) {
      return (response as { data: AttendanceApiItem[] }).data;
    }

    if (Array.isArray((response as { result?: unknown[] })?.result)) {
      return (response as { result: AttendanceApiItem[] }).result;
    }

    if (Array.isArray((response as { records?: unknown[] })?.records)) {
      return (response as { records: AttendanceApiItem[] }).records;
    }

    const singleItem = response as AttendanceApiItem | null;
    return singleItem && typeof singleItem === 'object' && this.resolveDateKey(singleItem)
      ? [singleItem]
      : [];
  }

  private mapAttendanceRecord(item: AttendanceApiItem): AttendanceRecordRow | null {
    const dateKey = this.resolveDateKey(item);
    if (!dateKey) {
      return null;
    }

    const parsedDate = new Date(dateKey);
    const dateLabel = Number.isNaN(parsedDate.getTime())
      ? dateKey
      : parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    const dayLabel = `${item.day || ''}`.trim() || (Number.isNaN(parsedDate.getTime())
      ? '--'
      : parsedDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
    const shift = [
      item.shift,
      item.shift_name,
      item.shift_type,
      item.shiftName,
    ].map((value) => `${value || ''}`.trim()).find(Boolean) || 'General Shift';
    const shiftStart = this.formatTimeOnly(item.shift_in_time);
    const shiftEnd = this.formatTimeOnly(item.shift_out_time);
    const shiftTime = this.buildShiftTime(item.shift_in_time, item.shift_out_time);
    const checkIn = this.formatTimeOnly(item.in_time ?? item.inTime);
    const checkOut = this.formatTimeOnly(item.out_time ?? item.outTime);
    const statusLabel = this.resolveStatusLabel(item);
    const statusTone = this.resolveStatusTone(item, checkIn, checkOut, statusLabel);
    const thumbStatus = this.resolveThumbStatus(item);
    const thumbTone = this.resolveThumbTone(thumbStatus);
    const leaveLabel = this.resolveLeaveLabel(item);
    const workingHours = this.resolveDurationLabel(
      item.working_hours ?? item.workingHours ?? item.total_hours ?? item.totalHours,
      checkIn,
      checkOut
    );
    const extraHours = this.resolveDurationLabel(item.extra_hours ?? item.extraHours);

    return {
      dateKey,
      dateLabel,
      dayLabel,
      shift,
      shiftTime,
      shiftStart,
      shiftEnd,
      checkIn,
      checkOut,
      workingHours,
      extraHours,
      statusLabel,
      statusTone,
      thumbStatus,
      thumbTone,
      leaveLabel,
      leaveDescription: this.buildLeaveDescription(statusTone, leaveLabel),
      portionLabel: this.formatLabel(`${item.portion || ''}`) || 'Full Day',
      note: this.buildRowNote(item, shiftTime, workingHours, extraHours, leaveLabel),
    };
  }

  private resolveDateKey(item: AttendanceApiItem): string {
    const rawValue = `${item.date || item.in_time || item.inTime || item.out_time || item.outTime || ''}`.trim();
    if (!rawValue) {
      return '';
    }

    const isoMatch = rawValue.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      return isoMatch[0];
    }

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return this.toIsoDate(parsed);
    }

    return '';
  }

  private resolveStatusLabel(item: AttendanceApiItem): string {
    const rawStatus = [
      item.leave_status,
      item.attendance_status,
      item.attendanceStatus,
      item.day_status,
      item.dayStatus,
      item.status,
      item.user_type1,
      item.user_type2,
    ]
      .map((value) => `${value || ''}`.trim())
      .find(Boolean);

    if (!rawStatus) {
      return 'Pending';
    }

    const compactValue = rawStatus.toLowerCase().replace(/\s+/g, '');
    return this.mapStatusCodeToLabel(compactValue, rawStatus);
  }

  private resolveStatusTone(
    item: AttendanceApiItem,
    checkIn: string,
    checkOut: string,
    statusLabel: string
  ): AttendanceTone {
    const normalized = statusLabel.toLowerCase().replace(/[_-]+/g, ' ');

    if (this.isTruthyFlag(item.is_holiday) || normalized.includes('holiday')) {
      return 'holiday';
    }

    if (this.isTruthyFlag(item.is_weekoff) || normalized.includes('week off') || normalized === 'wo') {
      return 'weekend';
    }

    if (normalized.includes('half')) {
      return 'half-day';
    }

    if (this.isLeaveCode(normalized) || normalized.includes('leave')) {
      return 'leave';
    }

    if (normalized.includes('late')) {
      return 'late';
    }

    if (normalized.includes('absent') || normalized === 'abs') {
      return 'absent';
    }

    if (normalized.includes('present') || normalized === 'dp') {
      return 'present';
    }

    return checkIn !== '--' || checkOut !== '--' ? 'present' : 'neutral';
  }

  private resolveThumbStatus(item: AttendanceApiItem): string {
    const rawStatus = [
      item.thump_status,
      item.thumb_status,
      item.thumbstatus,
      item.thumbStatus,
    ]
      .map((value) => `${value || ''}`.trim())
      .find(Boolean);

    return rawStatus ? this.formatLabel(rawStatus) : 'Not Available';
  }

  private resolveLeaveLabel(item: AttendanceApiItem): string {
    const rawLeave = `${item.leave_status || ''}`.trim();
    if (!rawLeave) {
      return '';
    }

    return this.mapStatusCodeToLabel(rawLeave.toLowerCase().replace(/\s+/g, ''), rawLeave);
  }

  private resolveThumbTone(thumbStatus: string): AttendanceTone {
    const normalized = thumbStatus.toLowerCase();
    if (normalized.includes('proper')) {
      return 'present';
    }

    if (normalized.includes('improper') || normalized.includes('miss') || normalized.includes('late')) {
      return 'late';
    }

    return 'neutral';
  }

  private buildShiftTime(start: string | null | undefined, end: string | null | undefined): string {
    const shiftStart = this.formatTimeOnly(start);
    const shiftEnd = this.formatTimeOnly(end);

    if (shiftStart === '--' && shiftEnd === '--') {
      return '--';
    }

    return `${shiftStart} - ${shiftEnd}`;
  }

  private resolveDurationLabel(value: unknown, checkIn?: string, checkOut?: string): string {
    const candidate = `${value || ''}`.trim();
    if (candidate) {
      return this.formatDurationLabel(candidate);
    }

    if (checkIn && checkOut) {
      const derived = this.calculateDuration(checkIn, checkOut);
      if (derived) {
        return derived;
      }
    }

    return '--';
  }

  private formatDurationLabel(value: string): string {
    const normalized = value.trim();
    if (!normalized) {
      return '--';
    }

    const durationMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!durationMatch) {
      return normalized;
    }

    const hours = Number(durationMatch[1]);
    const minutes = Number(durationMatch[2]);
    const seconds = Number(durationMatch[3] || 0);

    if (!hours && !minutes && !seconds) {
      return '0h 00m';
    }

    return `${hours}h ${`${minutes}`.padStart(2, '0')}m`;
  }

  private calculateDuration(startValue: string, endValue: string): string {
    const start = this.parseDisplayTime(startValue);
    const end = this.parseDisplayTime(endValue);
    if (!start || !end) {
      return '';
    }

    let diffMinutes = end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    return `${Math.floor(diffMinutes / 60)}h ${`${diffMinutes % 60}`.padStart(2, '0')}m`;
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

  private formatTimeOnly(value: unknown): string {
    const candidate = `${value || ''}`.trim();
    if (!candidate) {
      return '--';
    }

    const timeMatch = candidate.match(/(\d{2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      const period = hours >= 12 ? 'PM' : 'AM';
      const normalizedHours = hours % 12 || 12;
      return `${normalizedHours}:${`${minutes}`.padStart(2, '0')} ${period}`;
    }

    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return candidate;
  }

  private buildRowNote(
    item: AttendanceApiItem,
    shiftTime: string,
    workingHours: string,
    extraHours: string,
    leaveLabel: string
  ): string {
    const noteParts = [
      shiftTime !== '--' ? `Shift ${shiftTime}` : '',
      item.portion ? `${this.formatLabel(item.portion)} portion` : '',
      leaveLabel ? leaveLabel : '',
      workingHours !== '--' ? `Working ${workingHours}` : '',
      extraHours !== '--' && extraHours !== '0h 00m' ? `Extra ${extraHours}` : '',
    ].filter(Boolean);

    return noteParts.join(' • ') || 'Attendance log available for this day.';
  }

  private buildLeaveDescription(statusTone: AttendanceTone, leaveLabel: string): string {
    if (leaveLabel) {
      return `${leaveLabel} is recorded for this date.`;
    }

    if (statusTone === 'half-day') {
      return 'Half-day attendance is recorded for this date.';
    }

    if (statusTone === 'leave') {
      return 'Leave is recorded for this date.';
    }

    return 'No leave request is recorded for this date.';
  }

  private getToneCount(tone: AttendanceTone): number {
    return this.attendanceRecords.filter((item) => item.statusTone === tone).length;
  }

  private isLeaveCode(value: string): boolean {
    const compactValue = value.replace(/\s+/g, '');
    return ['cl', 'sl', 'pl', 'el', 'lop', 'ml', 'od'].includes(compactValue);
  }

  private mapStatusCodeToLabel(compactValue: string, rawValue: string): string {
    switch (compactValue) {
      case 'dp':
        return 'Present';
      case 'wo':
        return 'Week Off';
      case 'abs':
        return 'Absent';
      case 'cl':
        return 'Casual Leave';
      case 'sl':
        return 'Sick Leave';
      case 'pl':
        return 'Privilege Leave';
      case 'el':
        return 'Earned Leave';
      case 'lop':
        return 'Loss Of Pay';
      case 'ml':
        return 'Maternity Leave';
      case 'od':
        return 'On Duty';
      default:
        return this.formatLabel(rawValue);
    }
  }

  private isTruthyFlag(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['1', 'true', 'yes', 'y'].includes(`${value || ''}`.trim().toLowerCase());
  }

  private durationToSeconds(value: string): number {
    const match = `${value || ''}`.trim().match(/^(\d+)h\s+(\d{2})m$/);
    if (!match) {
      return 0;
    }

    return Number(match[1]) * 3600 + Number(match[2]) * 60;
  }

  private formatDuration(seconds: number): string {
    if (!seconds) {
      return '0h 00m';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${`${minutes}`.padStart(2, '0')}m`;
  }

  private formatLabel(value: string): string {
    return `${value || ''}`
      .trim()
      .replace(/[_-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => (part === part.toUpperCase()
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
      .join(' ');
  }

  private formatRoleLabel(role: AppRole | null): string {
    if (!role) {
      return 'Attendance';
    }

    return role
      .replace(/^ROLE_/, '')
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatLastUpdated(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildYearOptions(): string[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => `${currentYear - 3 + index}`);
  }
}
