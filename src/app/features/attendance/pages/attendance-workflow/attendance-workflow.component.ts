import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
    odDate: '',
    clientName: '',
    location: '',
    reportingTime: '10:00',
    remarks: '',
  };

  queryForm = {
    category: 'Attendance',
    priority: 'Medium',
    subject: '',
    description: '',
  };

  config: WorkflowConfig = this.workflowConfigs['apply-leave'];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const workflow = (data.workflow as WorkflowKey) || 'apply-leave';
      this.config = this.workflowConfigs[workflow];
      this.requestType = this.config.title;
    });

    this.route.queryParamMap.subscribe((params) => {
      const selectedDate = params.get('date') || this.toIsoDate(new Date());
      this.selectedDate = selectedDate;
      this.appDate = this.formatDisplayDate(new Date());
      this.patchDates(selectedDate);
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

  private patchDates(selectedDate: string): void {
    this.leaveForm.fromDate = selectedDate;
    this.leaveForm.toDate = selectedDate;
    this.swipeForm.attendanceDate = selectedDate;
    this.permissionForm.permissionDate = selectedDate;
    this.odForm.odDate = selectedDate;
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
}
