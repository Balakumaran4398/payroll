import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import {
  AttendanceApprovalStatus,
  AttendanceEmployeeDetail,
  AttendanceEventItem,
  AttendanceLeaveBalance,
  AttendanceStatus,
  AttendanceSummaryDay,
  MOCK_ATTENDANCE_DETAILS,
} from '../attendance/attendance.mock';

type AttendanceDetailViewMode = 'calendar' | 'list';

@Component({
  selector: 'app-attendance-detail',
  templateUrl: './attendance-detail.component.html',
  styleUrls: ['./attendance-detail.component.scss'],
})
export class AttendanceDetailComponent implements OnInit {
  viewMode: AttendanceDetailViewMode = 'list';
  employeeDetail: AttendanceEmployeeDetail | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private feedback: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const employeeId = Number(params.get('employeeId') || 0) || this.resolveFallbackEmployeeId();
      this.employeeDetail = this.resolveEmployeeDetail(employeeId);
    });
  }

  get summaryCards(): Array<{ label: string; value: string; tone: AttendanceStatus | 'neutral' }> {
    if (!this.employeeDetail) {
      return [];
    }

    return [
      { label: 'Present Days', value: `${this.employeeDetail.presentDays}`, tone: 'present' },
      { label: 'Late Arrivals', value: `${this.employeeDetail.lateArrivals}`, tone: 'late' },
      { label: 'Absences', value: `${this.employeeDetail.absences}`, tone: 'absent' },
      { label: 'On Leave', value: `${this.employeeDetail.onLeave}`, tone: 'on-leave' },
      { label: 'Overtime Hours', value: this.employeeDetail.overtimeHours, tone: 'half-day' },
      { label: 'Failed Swipes', value: `${this.employeeDetail.failedSwipes}`, tone: 'neutral' },
    ];
  }

  get pageTitle(): string {
    return this.employeeDetail ? `${this.employeeDetail.employeeName}'s Attendance` : 'Employee Attendance';
  }

  get pageSubtitle(): string {
    if (!this.employeeDetail) {
      return 'Attendance details';
    }

    return `${this.employeeDetail.employeeCode} • ${this.employeeDetail.department} • ${this.employeeDetail.designation}`;
  }

  get calendarCards(): AttendanceSummaryDay[] {
    return this.employeeDetail?.dailySummary || [];
  }

  get activityEvents(): AttendanceEventItem[] {
    return this.employeeDetail?.events || [];
  }

  get leaveRequests() {
    return this.employeeDetail?.leaveRequests || [];
  }

  get permissions() {
    return this.employeeDetail?.permissions || [];
  }

  get leaveBalance(): AttendanceLeaveBalance[] {
    return this.employeeDetail?.leaveBalance || [];
  }

  goBack(): void {
    if (this.authService.hasAnyRole(['ROLE_EMPLOYEE'])) {
      void this.router.navigate(['/app/dashboard']);
      return;
    }

    void this.router.navigate(['/app/attendance']);
  }

  exportDetails(): void {
    this.feedback.info('Attendance detail export will be connected after API integration.');
  }

  setViewMode(mode: AttendanceDetailViewMode): void {
    this.viewMode = mode;
  }

  getStatusLabel(status: AttendanceStatus): string {
    switch (status) {
      case 'on-leave':
        return 'On Leave';
      case 'half-day':
        return 'Half Day';
      case 'late':
        return 'Late';
      case 'absent':
        return 'Absent';
      default:
        return 'Present';
    }
  }

  getApprovalLabel(status: AttendanceApprovalStatus): string {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  private resolveEmployeeDetail(employeeId: number): AttendanceEmployeeDetail {
    const matched = MOCK_ATTENDANCE_DETAILS.find((item) => item.id === employeeId);
    if (matched) {
      return matched;
    }

    const fallbackName = `${this.tokenStorage.getEmpname() || this.authService.getEmpname() || 'Employee'}`.trim();
    return {
      ...MOCK_ATTENDANCE_DETAILS[0],
      id: employeeId || MOCK_ATTENDANCE_DETAILS[0].id,
      employeeName: fallbackName || MOCK_ATTENDANCE_DETAILS[0].employeeName,
      employeeCode: `EMP${String(employeeId || 1).padStart(3, '0')}`,
      email: `${(fallbackName || 'employee').toLowerCase().replace(/\s+/g, '.')}@company.com`,
    };
  }

  private resolveFallbackEmployeeId(): number {
    return Number(this.tokenStorage.getID() || this.authService.getID() || 0) || MOCK_ATTENDANCE_DETAILS[0].id;
  }
}
