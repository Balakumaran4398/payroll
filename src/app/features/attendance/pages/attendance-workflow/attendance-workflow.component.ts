import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminRequestCenterService, AdminRequestItem } from '../../../../core/services/admin-request-center.service';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';

type WorkflowKey =
  | 'apply-leave'
  | 'regularize-swipe'
  | 'permission-request'
  | 'request-od'
  | 'raise-query';

interface WorkflowConfig {
  key: WorkflowKey;
  breadcrumb: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  helperTitle: string;
  helperDescription: string;
  checklist: string[];
}

interface LeaveBalanceRow {
  type: string;
  currentBalance: number | string;
  alreadyApplied: number | string;
  adjustment: number | string;
  availableBalance: number | string;
  appliedFor: number | string;
  closingBalance: number | string;
}

@Component({
  selector: 'app-attendance-workflow',
  templateUrl: './attendance-workflow.component.html',
  styleUrls: ['./attendance-workflow.component.scss'],
})
export class AttendanceWorkflowComponent implements OnInit {
  readonly workflowConfigs: Record<WorkflowKey, WorkflowConfig> = {
    'apply-leave': {
      key: 'apply-leave',
      breadcrumb: 'Leave',
      title: 'Apply Leave',
      subtitle: 'Plan leave dates, choose leave type, and send the request for approval.',
      primaryAction: 'Submit Leave Request',
      helperTitle: 'Leave Balances',
      helperDescription: 'Current balance snapshot for this month.',
      checklist: [
        'Choose the exact from and to dates before submitting.',
        'Add a clear reason so your approver can review quickly.',
        'Attach supporting documents when the leave policy requires it.',
      ],
    },
    'regularize-swipe': {
      key: 'regularize-swipe',
      breadcrumb: 'Attendance',
      title: 'Regularize Swipe',
      subtitle: 'Correct missing or late punches for a selected day without leaving the attendance workspace.',
      primaryAction: 'Submit Regularization',
      helperTitle: 'Regularization Guide',
      helperDescription: 'What your manager checks before approving swipe corrections.',
      checklist: [
        'Choose the exact attendance date that needs correction.',
        'Enter both expected and actual in/out times if available.',
        'Explain the reason for the missed or delayed swipe clearly.',
      ],
    },
    'permission-request': {
      key: 'permission-request',
      breadcrumb: 'Attendance',
      title: 'Permission Request',
      subtitle: 'Request short-duration permission with date, time, and justification details.',
      primaryAction: 'Send Permission Request',
      helperTitle: 'Permission Checklist',
      helperDescription: 'Keep the request short, specific, and policy-friendly.',
      checklist: [
        'Select the date and exact start and end time.',
        'Mention whether it is personal, medical, or official.',
        'Keep the reason concise and action-oriented.',
      ],
    },
    'request-od': {
      key: 'request-od',
      breadcrumb: 'Attendance',
      title: 'Request On Duty',
      subtitle: 'Submit on-duty movement details for client visits, field work, or official travel.',
      primaryAction: 'Submit OD Request',
      helperTitle: 'OD Approval Notes',
      helperDescription: 'These details help the approver validate official movement quickly.',
      checklist: [
        'Add the OD date and reporting location.',
        'Mention project, client, or business purpose.',
        'Share expected reporting time and completion remarks.',
      ],
    },
    'raise-query': {
      key: 'raise-query',
      breadcrumb: 'Attendance',
      title: 'Raise Query',
      subtitle: 'Create a support query for attendance, leave, payroll, or access clarification.',
      primaryAction: 'Create Query',
      helperTitle: 'Support Notes',
      helperDescription: 'A complete query usually gets the fastest response.',
      checklist: [
        'Choose the right category before submitting.',
        'Use a specific subject line that explains the issue.',
        'Include dates, request IDs, or screenshots in the description.',
      ],
    },
  };

  readonly leaveBalances: LeaveBalanceRow[] = [
    { type: 'CL', currentBalance: 1, alreadyApplied: 0.5, adjustment: 0, availableBalance: 0.5, appliedFor: 1, closingBalance: -0.5 },
    { type: 'SL', currentBalance: 0, alreadyApplied: 0, adjustment: 0, availableBalance: 0, appliedFor: 0, closingBalance: 0 },
    { type: 'LWP', currentBalance: '---', alreadyApplied: '---', adjustment: '---', availableBalance: '---', appliedFor: 0, closingBalance: '---' },
    { type: 'L1/SPL', currentBalance: 0, alreadyApplied: 0, adjustment: 0, availableBalance: 0, appliedFor: 0, closingBalance: 0 },
    { type: 'L5/ML', currentBalance: 0, alreadyApplied: 0, adjustment: 0, availableBalance: 0, appliedFor: 0, closingBalance: 0 },
  ];

  readonly leaveTypes = ['CL', 'SL', 'LWP', 'Permission', 'OD'];
  readonly dayTypes = ['Full', 'First Half', 'Second Half'];
  readonly permissionTypes = ['Personal', 'Medical', 'Official', 'Emergency'];
  readonly queryCategories = ['Attendance', 'Leave', 'Payroll', 'Access'];
  readonly priorities = ['Low', 'Medium', 'High'];

  appDate = '';
  selectedDate = '';
  requestType = '';
  reviewRequest: AdminRequestItem | null = null;
  isAdminReview = false;
  isSubmitting = false;

  leaveForm = {
    fromDate: '',
    toDate: '',
    startDay: 'Full',
    endDay: 'Full',
    leaveType: 'CL',
    reason: '',
  };

  swipeForm = {
    attendanceDate: '',
    expectedIn: '09:00',
    expectedOut: '18:00',
    actualIn: '09:18',
    actualOut: '18:22',
    reason: '',
  };

  permissionForm = {
    permissionDate: '',
    permissionType: 'Personal',
    startTime: '14:00',
    endTime: '16:00',
    reason: '',
  };

  odForm = {
    empid: '',
    from_date: '',
    to_date: '',
    place_of_visit: '',
    purpose_of_visit: '10:00',
    comments: '',
    approved_by: '',
    isapproved: '',
  };

  queryForm = {
    category: 'Attendance',
    priority: 'Medium',
    subject: '',
    description: '',
  };

  config: WorkflowConfig = this.workflowConfigs['apply-leave'];

  constructor(
    private route: ActivatedRoute,
    private requestCenter: AdminRequestCenterService,
    private apiService: ApiService,
    private authService: AuthService,
    private feedback: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.odForm.empid = this.resolveEmployeeId();

    this.route.data.subscribe((data) => {
      const workflow = (data.workflow as WorkflowKey) || 'apply-leave';
      this.config = this.workflowConfigs[workflow];
      this.requestType = this.config.title;
    });

    this.route.queryParamMap.subscribe((params) => {
      const selectedDate = params.get('date') || this.toIsoDate(new Date());
      const requestId = params.get('requestId') || '';
      this.isAdminReview = params.get('source') === 'admin';
      this.reviewRequest = requestId ? this.requestCenter.getRequestById(requestId) : null;
      this.selectedDate = selectedDate;
      this.appDate = this.formatDisplayDate(new Date());
      this.patchDates(selectedDate);
      this.patchReviewContext();
    });
  }

  get totalLeaveDays(): number {
    if (!this.leaveForm.fromDate || !this.leaveForm.toDate) {
      return 0;
    }

    const from = new Date(this.leaveForm.fromDate);
    const to = new Date(this.leaveForm.toDate);
    const diff = Math.floor((to.getTime() - from.getTime()) / 86400000);
    return Math.max(diff + 1, 1);
  }

  get currentDateLabel(): string {
    return this.formatReadableDate(this.selectedDate);
  }

  openTimePicker(input: HTMLInputElement): void {
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  approveRequest(): void {
    if (!this.reviewRequest) {
      return;
    }

    const updated = this.requestCenter.updateStatus(this.reviewRequest.id, 'Approved');
    if (updated) {
      this.reviewRequest = updated;
      this.feedback.success(`${updated.id} approved successfully.`);
    }
  }

  cancelRequest(): void {
    if (!this.reviewRequest) {
      return;
    }

    const updated = this.requestCenter.updateStatus(this.reviewRequest.id, 'Cancelled');
    if (updated) {
      this.reviewRequest = updated;
      this.feedback.warning(`${updated.id} cancelled.`);
    }
  }

  submitWorkflow(): void {
    if (this.config.key !== 'request-od') {
      this.feedback.info(`${this.config.title} submission is not connected to an API yet.`);
      return;
    }

    this.submitOdRequest();
  }

  private patchDates(selectedDate: string): void {
    this.leaveForm.fromDate = selectedDate;
    this.leaveForm.toDate = selectedDate;
    this.swipeForm.attendanceDate = selectedDate;
    this.permissionForm.permissionDate = selectedDate;
    this.odForm.from_date = selectedDate;
    this.odForm.to_date = selectedDate;
  }

  private patchReviewContext(): void {
    if (!this.reviewRequest) {
      return;
    }

    switch (this.reviewRequest.workflow) {
      case 'apply-leave':
        this.leaveForm.reason = this.reviewRequest.summary;
        break;
      case 'regularize-swipe':
        this.swipeForm.reason = this.reviewRequest.summary;
        break;
      case 'permission-request':
        this.permissionForm.reason = this.reviewRequest.summary;
        break;
      case 'request-od':
        this.odForm.comments = this.reviewRequest.summary;
        this.odForm.place_of_visit = this.reviewRequest.department;
        break;
      case 'raise-query':
        this.queryForm.subject = `${this.reviewRequest.title} - ${this.reviewRequest.requesterName}`;
        this.queryForm.description = this.reviewRequest.summary;
        break;
    }
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatReadableDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private submitOdRequest(): void {
    const payload = {
      ...this.odForm,
      empid: this.odForm.empid || this.resolveEmployeeId(),
      from_date: this.normalizeDateValue(this.odForm.from_date),
      to_date: this.normalizeDateValue(this.odForm.to_date),
      place_of_visit: `${this.odForm.place_of_visit}`.trim(),
      purpose_of_visit: `${this.odForm.purpose_of_visit}`.trim(),
      comments: `${this.odForm.comments}`.trim(),
      approved_by: `${this.odForm.approved_by}`.trim(),
      isapproved: `${this.odForm.isapproved}`.trim(),
    };

    if (!payload.empid || !payload.from_date || !payload.to_date || !payload.place_of_visit || !payload.purpose_of_visit) {
      this.feedback.warning('Fill Employee ID, from/to dates, place of visit, and purpose of visit.');
      return;
    }

    this.isSubmitting = true;
    this.apiService.getRequestforonduty(payload)
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.feedback.success('OD request submitted successfully.');
        },
        error: () => {
          this.feedback.error('Failed to submit OD request. Please try again.');
        },
      });
  }

  private normalizeDateValue(value: string | Date): string {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      return this.toIsoDate(value);
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value) === false) {
      return this.toIsoDate(parsedDate);
    }

    return `${value}`;
  }

  private resolveEmployeeId(): string {
    return this.authService.getUsername() || '';
  }
}
