import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, timer } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { AdminRequestCenterService, AdminRequestItem } from '../../../../core/services/admin-request-center.service';
import { ApiService } from '../../../../core/services/api.service';
import { AppRole, AuthService } from '../../../../core/services/auth.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import { Employee } from '../../../employee/employee.types';
import { LeaveRequestDeleteDialogComponent } from '../../components/leave-request-delete-dialog/leave-request-delete-dialog.component';
import { LeaveRequestFormDialogComponent } from '../../components/leave-request-form-dialog/leave-request-form-dialog.component';
import { LeaveRequestViewDialogComponent } from '../../components/leave-request-view-dialog/leave-request-view-dialog.component';
import { OnDutyRequestViewDialogComponent } from '../../components/onduty-request-view-dialog/onduty-request-view-dialog.component';
import { OnDutyRequestFormDialogComponent } from '../../components/onduty-request-form-dialog/onduty-request-form-dialog.component';
import { OnDutyRequestDeleteDialogComponent } from '../../components/onduty-request-delete-dialog/onduty-request-delete-dialog.component';
import { PermissionViewDialogComponent } from '../../components/permission-view-dialog/permission-view-dialog.component';
import { PermissionEditDialogComponent } from '../../components/permission-edit-dialog/permission-edit-dialog.component';
import { PermissionDeleteDialogComponent } from '../../components/permission-delete-dialog/permission-delete-dialog.component';
import { SwipeRequestViewDialogComponent } from '../../components/swipe-request-view-dialog/swipe-request-view-dialog.component';
import { SwipeRequestEditDialogComponent } from '../../components/swipe-request-edit-dialog/swipe-request-edit-dialog.component';
import { SwipeRequestDeleteDialogComponent } from '../../components/swipe-request-delete-dialog/swipe-request-delete-dialog.component';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { NavigationService } from 'src/app/core/services/navigation.service';

type WorkflowKey =
  | 'apply-leave'
  | 'regularize-swipe'
  | 'permission-request'
  | 'request-od'
  | 'raise-query';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejeted';

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

interface LeaveTypeOption {
  id: number;
  leave_type: string;
  leave_code: string;
  isactive: boolean;
  createddate: string;
}

type RequestTableStatus = 'Approved' | 'Pending' | 'Rejected';
type RequestTableStatusFilter = 'all' | RequestTableStatus;
type OnDutyRequestBucket = 'approved' | 'rejected' | 'pending';
type LeaveRequestBucket = 'approved' | 'rejected' | 'pending';
type SwipeRequestBucket = 'approved' | 'rejected' | 'pending';

interface WorkflowRequestHistoryItem {
  id: string;
  workflow: WorkflowKey;
  requestType: string;
  dateTime: string;
  reason: string;
  status: RequestTableStatus;
  createdAt: string;
  ownerEmpId: number;
  formSnapshot: Record<string, unknown>;
}

interface OnDutyRequestApiItem {
  id: number;
  empid: number;
  from_date: string;
  to_date: string;
  place_of_visit: string;
  purpose_of_visit: string;
  comments: string;
  isactive: boolean;
  isdelete: boolean;
  manager_approval?: boolean;
  admin_approval?: boolean;
  no_of_days: number;
  approved_by: number | string;
  approved_status: string;
  created_date: string;
  updated_date: string;
  employee_name: string;
}

interface OnDutyRequestListResponse {
  approved?: OnDutyRequestApiItem[];
  rejected?: OnDutyRequestApiItem[];
  pending?: OnDutyRequestApiItem[];
  data?: OnDutyRequestListResponse | OnDutyRequestApiItem[];
  result?: OnDutyRequestListResponse | OnDutyRequestApiItem[];
}

interface LeaveRequestApiItem {
  id: number;
  empid: number;
  leave_type_id: number;
  fromdate: string;
  todate: string;
  leave_mode: string;
  totaldays: number;
  reason: string;
  doc_url: string | null;
  status: string;
  approved_by: number | string | null;
  isactive: boolean;
  isdelete: boolean;
  manager_approval?: boolean;
  admin_approval?: boolean;
  createddate: string;
  updateddate: string;
  filename: string | null;
}

interface LeaveRequestListResponse {
  approved?: LeaveRequestApiItem[];
  rejected?: LeaveRequestApiItem[];
  pending?: LeaveRequestApiItem[];
  data?: LeaveRequestListResponse | LeaveRequestApiItem[];
  result?: LeaveRequestListResponse | LeaveRequestApiItem[];
}

type PermissionRequestBucket = 'approved' | 'rejected' | 'pending';

interface PermissionRequestApiItem {
  id: number;
  empid: number;
  request_date: string;
  mode: string;
  starttime: string;
  endtime: string;
  reason: string;
  status: string;
  approved_by: number | string | null;
  isactive: boolean;
  isdelete: boolean;
  manager_approval?: boolean;
  admin_approval?: boolean;
  createddate: string;
  updateddate: string;
  employee_name?: string;
}

interface PermissionRequestListResponse {
  approved?: PermissionRequestApiItem[];
  rejected?: PermissionRequestApiItem[];
  pending?: PermissionRequestApiItem[];
  data?: PermissionRequestListResponse | PermissionRequestApiItem[];
  result?: PermissionRequestListResponse | PermissionRequestApiItem[];
}

interface SwipeRequestApiItem {
  id: number;
  empid: number;
  request_date?: string;
  mode?: string;
  punch_time?: string;
  attendance_date?: string;
  attendanceDate?: string;
  att_date?: string;
  expected_in?: string;
  expectedIn?: string;
  expected_out?: string;
  expectedOut?: string;
  actual_in?: string;
  actualIn?: string;
  actual_out?: string;
  actualOut?: string;
  reason: string;
  status: string;
  approved_by?: number | string | null;
  isactive: boolean;
  isdelete: boolean;
  manager_approval?: boolean;
  admin_approval?: boolean;
  createddate: string;
  updateddate: string;
  employee_name?: string;
}

interface SwipeRequestListResponse {
  approved?: SwipeRequestApiItem[];
  rejected?: SwipeRequestApiItem[];
  pending?: SwipeRequestApiItem[];
  data?: SwipeRequestListResponse | SwipeRequestApiItem[];
  result?: SwipeRequestListResponse | SwipeRequestApiItem[];
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

  leaveBalances: LeaveBalanceRow[] = [];
  leaveBalancesLoading = false;

  leaveTypes: LeaveTypeOption[] = [];
  readonly dayTypes = [
    { value: 'full', label: 'Full Day' },
    { value: 'half', label: 'Half Day' },
  ];
  readonly dayTypes_1 = [
    { value: 'first_half', label: 'First Half' },
    { value: 'second_half', label: 'Second Half' },
  ];
  // readonly permissionTypes = ['Personal', 'Medical', 'Official', 'Emergency'];
  readonly permissionTypes = ['IN', 'OUT'];

  readonly queryCategories = ['Attendance', 'Leave', 'Payroll', 'Access'];
  readonly priorities = ['Low', 'Medium', 'High'];
  readonly approvalStatusOptions = [
    { label: 'Approved', value: 'Approved' as ApprovalStatus },
    { label: 'Rejected', value: 'Rejeted' as ApprovalStatus },
  ];

  appDate = '';
  selectedDate = '';
  requestType = '';
  reviewRequest: AdminRequestItem | null = null;
  isAdminReview = false;
  isSubmitting = false;
  loadingHeadline = '';
  loadingCaption = '';
  private loadingStartedAt = 0;
  private historySequence = 1000;
  private employeeDirectory = new Map<number, Employee>();
  private employeeDirectoryLoaded = false;
  private pendingHistoryReloadAfterDirectory = false;
  readonly deletingHistoryRequestIds = new Set<string>();

  readonly historyStatusFilters: Array<{ label: string; value: RequestTableStatusFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Rejected', value: 'Rejected' },
  ];
  readonly historyPageSizeOptions = [5, 10, 20];
  historySearchTerm = '';
  historyStatusFilter: RequestTableStatusFilter = 'all';
  historyPageSize = 5;
  historyPageIndex = 0;
  selectedHistoryRequestId = '';
  requestHistory: WorkflowRequestHistoryItem[] = this.buildSeedHistory();
  leaveDocumentDataUrl: any = null;
  leaveDocumentName: any = null;

  leaveForm = {
    fromDate: '',
    toDate: '',
    startDay: '',
    endDay: '',
    leaveType: '',
    reason: '',
  };

  swipeForm = {
    request_date: '',
    mode: '',
    punch_time: '',
    reason: '',
  };

  permissionForm = {
    empid: '',
    request_date: '',
    mode: '',
    starttime: '',
    endtime: '',
    reason: '',
  };

  odForm = {
    empid: '',
    from_date: '',
    to_date: '',
    place_of_visit: '',
    purpose_of_visit: '',
    comments: '',
    approved_by: '',
    approved_status: 'Pending' as ApprovalStatus,
    isapproved: false,
    isactive: true,
    isdelete: false,
  };

  queryForm = {
    category: '',
    priority: '',
    subject: '',
    description: '',
  };

  config: WorkflowConfig = this.workflowConfigs['apply-leave'];
  empid: any;
  currentRole: AppRole | null = null;
  currentEmployeeId = 0;
  username: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private navigationService: NavigationService,
    private requestCenter: AdminRequestCenterService,
    private apiService: ApiService,
    private authService: AuthService,
    private tokenService: TokenStorageService,
    private feedback: UiFeedbackService,
    private dialog: MatDialog
  ) {
    this.username = tokenService.getUsername();
  }

  ngOnInit(): void {
    this.currentRole = this.authService.getRole();
    this.currentEmployeeId = Number(this.resolveEmployeeId() || 0) || 0;
    this.empid = this.currentEmployeeId;
    console.log(this.empid);

    this.loadEmployeeDirectory();
    this.loadLeaveTypes();
    this.route.data.subscribe((data) => {
      const workflow = (data.workflow as WorkflowKey) || 'apply-leave';
      this.config = this.workflowConfigs[workflow];
      this.requestType = this.config.title;
      this.loadWorkflowHistory();
      this.syncOdApprovalState();
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
      this.syncOdApprovalState();
    });

    if (!this.selectedHistoryRequestId && this.requestHistory.length) {
      this.selectedHistoryRequestId = this.requestHistory[0].id;
    }
  }

  get totalLeaveDays(): number {
    const normalizedStartDay = `${this.leaveForm.startDay || 'full'}`.trim().toLowerCase();
    if (!this.leaveForm.fromDate || !this.leaveForm.toDate) {
      return 0;
    }

    const from = this.parseDateOnly(this.leaveForm.fromDate);
    const to = this.parseDateOnly(this.leaveForm.toDate);
    if (!from || !to) {
      return 0;
    }

    const diff = Math.floor((to.getTime() - from.getTime()) / 86400000);
    if (diff < 0) {
      return 0;
    }

    if (normalizedStartDay === 'half') {
      return diff === 0 ? 0.5 : diff;
    }

    return diff + 1;
  }

  get currentDateLabel(): string {
    return this.formatReadableDate(this.selectedDate);
  }

  get showWorkflowBackButton(): boolean {
    return this.config.key === 'apply-leave'
      || this.config.key === 'regularize-swipe'
      || this.config.key === 'permission-request'
      || this.config.key === 'request-od';
  }

  get isLeaveEndDayDisabled(): boolean {
    return `${this.leaveForm.startDay || 'full'}`.trim().toLowerCase() === 'full';
  }

  navigateBack(): void {
    const previousUrl = this.navigationService.getPreviousUrl();

    if (this.navigationService.isDashboardRoute(previousUrl)) {
      this.router.navigateByUrl(this.navigationService.getDashboardUrl());
      return;
    }

    this.location.back();
  }

  get leaveToDateMin(): Date | null {
    return this.parseDateOnly(this.leaveForm.fromDate);
  }

  get submitStatusLabel(): string {
    return this.loadingHeadline || 'Loading...';
  }

  get showOdApprovalPanel(): boolean {
    if (this.config.key !== 'request-od') {
      return false;
    }

    if (this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY') {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isManagerReviewingTeamOdRequest();
    }

    return false;
  }

  get showManagerSelfOdNotice(): boolean {
    return this.currentRole === 'ROLE_MANAGER' && this.config.key === 'request-od' && !this.showOdApprovalPanel;
  }

  get showPageApiLoading(): boolean {
    return this.isSubmitting && this.config.key === 'request-od';
  }

  get approvedStatusLabel(): string {
    return this.odForm.approved_status === 'Rejeted' ? 'Rejected' : this.odForm.approved_status;
  }

  get approvalFlagLabel(): string {
    return this.odForm.isapproved ? 'True' : 'False';
  }

  get filteredHistoryRequests(): WorkflowRequestHistoryItem[] {
    const search = this.historySearchTerm.trim().toLowerCase();

    return this.requestHistory.filter((item) => {
      const matchesStatus = this.historyStatusFilter === 'all' || item.status === this.historyStatusFilter;
      const matchesSearch =
        !search ||
        item.requestType.toLowerCase().includes(search) ||
        item.dateTime.toLowerCase().includes(search) ||
        item.reason.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  get pagedHistoryRequests(): WorkflowRequestHistoryItem[] {
    const startIndex = this.historyPageIndex * this.historyPageSize;
    return this.filteredHistoryRequests.slice(startIndex, startIndex + this.historyPageSize);
  }

  get totalHistoryItems(): number {
    return this.filteredHistoryRequests.length;
  }

  get totalHistoryPages(): number {
    return Math.max(Math.ceil(this.totalHistoryItems / this.historyPageSize), 1);
  }

  get historyRangeStart(): number {
    return this.totalHistoryItems ? this.historyPageIndex * this.historyPageSize + 1 : 0;
  }

  get historyRangeEnd(): number {
    return Math.min((this.historyPageIndex + 1) * this.historyPageSize, this.totalHistoryItems);
  }

  get selectedHistoryRequest(): WorkflowRequestHistoryItem | null {
    return this.requestHistory.find((item) => item.id === this.selectedHistoryRequestId) || null;
  }

  canEditHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (item.workflow === 'request-od') {
      return this.canEditOnDutyHistoryRequest(item);
    }

    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isOwnHistoryRequest(item) || this.isTeamHistoryRequest(item);
    }

    if (this.currentRole === 'ROLE_EMPLOYEE') {
      return this.isOwnHistoryRequest(item);
    }

    return false;
  }

  canDeleteHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER' || this.currentRole === 'ROLE_EMPLOYEE') {
      return this.isOwnHistoryRequest(item) || this.isTeamHistoryRequest(item);
    }

    return false;
  }

  getHistoryEditDisabledReason(item: WorkflowRequestHistoryItem): string {
    if (this.canEditHistoryRequest(item)) {
      return '';
    }

    if (item.workflow === 'request-od') {
      if (this.currentRole === 'ROLE_MANAGER') {
        return "Managers can edit only their own requests or their team members' OD requests.";
      }

      if (this.currentRole === 'ROLE_EMPLOYEE') {
        return 'Employees can only view OD requests.';
      }

      return 'Only manager or admin roles can edit OD requests.';
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return "Managers can edit only their own requests or their team members' requests.";
    }

    if (this.currentRole === 'ROLE_EMPLOYEE') {
      return 'Employees can edit only their own requests.';
    }

    return 'You do not have permission to edit this request.';
  }

  shouldShowHistoryEditAction(item: WorkflowRequestHistoryItem): boolean {
    if (item.workflow !== 'request-od') {
      return true;
    }

    return this.canEditHistoryRequest(item);
  }

  getHistoryDeleteDisabledReason(item: WorkflowRequestHistoryItem): string {
    if (this.canDeleteHistoryRequest(item)) {
      return '';
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return "Managers can delete only their own requests or their team members' requests.";
    }

    if (this.currentRole === 'ROLE_EMPLOYEE') {
      return 'Employees are not allowed to delete requests.';
    }

    return 'You do not have permission to delete this request.';
  }

  get approvedHistoryCount(): number {
    return this.requestHistory.filter((item) => item.status === 'Approved').length;
  }

  get pendingHistoryCount(): number {
    return this.requestHistory.filter((item) => item.status === 'Pending').length;
  }

  get rejectedHistoryCount(): number {
    return this.requestHistory.filter((item) => item.status === 'Rejected').length;
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

  onHistorySearchChange(): void {
    this.updateHistoryPageIndex(true);
  }

  setHistoryStatusFilter(filter: RequestTableStatusFilter): void {
    this.historyStatusFilter = filter;
    this.updateHistoryPageIndex(true);
  }

  setHistoryPageSize(pageSize: number | string): void {
    this.historyPageSize = Number(pageSize) || this.historyPageSizeOptions[0];
    this.updateHistoryPageIndex(true);
  }

  changeHistoryPage(direction: number): void {
    const nextPage = this.historyPageIndex + direction;
    const maxPageIndex = this.totalHistoryPages - 1;
    this.historyPageIndex = Math.min(Math.max(nextPage, 0), maxPageIndex);
  }

  viewHistoryRequest(item: WorkflowRequestHistoryItem): void {
    this.selectedHistoryRequestId = item.id;

    if (item.workflow === 'apply-leave') {
      this.dialog.open(LeaveRequestViewDialogComponent, {
        width: '680px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-profile-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: { request: this.buildLeaveDialogRequest(item) },
      });
      return;
    }

    if (item.workflow === 'permission-request') {
      this.dialog.open(PermissionViewDialogComponent, {
        width: '680px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-profile-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: { request: this.buildPermissionDialogRequest(item) },
      });
      return;
    }

    if (item.workflow === 'regularize-swipe') {
      this.dialog.open(SwipeRequestViewDialogComponent, {
        width: '680px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-profile-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: {
          request: this.buildSwipeDialogRequest(item),
          canApprove: this.canApproveSwipeHistoryRequest(item),
          currentRole: this.currentRole,
        },
      });
      return;
    }

    if (item.workflow !== 'request-od') {
      return;
    }

    this.dialog.open(OnDutyRequestViewDialogComponent, {
      width: '680px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-profile-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      data: {
        request: this.buildOnDutyDialogRequest(item),
        canApprove: this.canApproveOnDutyHistoryRequest(item),
        currentRole: this.currentRole,
      },
    });


  }

  editHistoryRequest(item: WorkflowRequestHistoryItem): void {
    this.selectedHistoryRequestId = item.id;

    const reason = this.getHistoryEditDisabledReason(item);
    if (reason) {
      this.feedback.warning(reason);
      return;
    }

    if (item.workflow === 'apply-leave') {
      const dialogRef = this.dialog.open(LeaveRequestFormDialogComponent, {
        width: '580px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: {
          request: this.buildLeaveDialogRequest(item),
          leaveTypes: this.leaveTypes,
          canApprove: this.canApproveLeaveHistoryRequest(item),
          currentRole: this.currentRole,
        },
      });

      dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
        if (!result) {
          return;
        }

        this.getLeaveDetails();
        this.loadLeaveBalances();
        this.feedback.success(result.message || 'Leave request updated successfully.');
      });
      return;
    }

    if (item.workflow === 'permission-request') {
      const dialogRef = this.dialog.open(PermissionEditDialogComponent, {
        width: '580px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: {
          request: this.buildPermissionDialogRequest(item),
          canApprove: this.canApprovePermissionHistoryRequest(item),
          currentRole: this.currentRole,
        },
      });

      dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
        if (!result) {
          return;
        }

        this.getPermissionHistory();
        this.feedback.success(result.message || 'Permission request updated successfully.');
      });
      return;
    }

    if (item.workflow === 'regularize-swipe') {
      const dialogRef = this.dialog.open(SwipeRequestEditDialogComponent, {
        width: '580px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: {
          request: this.buildSwipeDialogRequest(item),
          canApprove: this.canApproveSwipeHistoryRequest(item),
          currentRole: this.currentRole,
        },
      });

      dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
        if (!result) {
          return;
        }

        this.getSwipeHistory();
        this.feedback.success(result.message || 'Swipe request updated successfully.');
      });
      return;
    }

    if (item.workflow !== 'request-od') {
      if (item.workflow !== this.config.key) {
        this.feedback.info(`Open the ${item.requestType} page to edit this request.`);
        return;
      }

      this.applyHistorySnapshot(item);
      this.feedback.info(`${item.requestType} details loaded into the form.`);
      return;
    }

    const dialogRef = this.dialog.open(OnDutyRequestFormDialogComponent, {
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      data: {
        request: this.buildOnDutyDialogRequest(item),
        canApprove: this.canApproveOnDutyHistoryRequest(item),
        currentRole: this.currentRole,
      },
    });

    dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
      if (!result) {
        return;
      }

      this.getondutylist();
      this.feedback.success(result.message || 'OD request updated successfully.');
    });
  }

  cancelHistoryRequest(item: WorkflowRequestHistoryItem): void {
    this.selectedHistoryRequestId = item.id;

    const reason = this.getHistoryDeleteDisabledReason(item);
    if (reason) {
      this.feedback.warning(reason);
      return;
    }

    if (item.workflow === 'apply-leave') {
      const dialogRef = this.dialog.open(LeaveRequestDeleteDialogComponent, {
        width: '460px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-delete-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: { request: this.buildLeaveDialogRequest(item) },
      });

      dialogRef.afterClosed().subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }
        this.runDeleteLeaveRequest(item);
      });
      return;
    }

    if (item.workflow === 'permission-request') {
      const dialogRef = this.dialog.open(PermissionDeleteDialogComponent, {
        width: '460px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-delete-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: { request: this.buildPermissionDialogRequest(item) },
      });

      dialogRef.afterClosed().subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }

        this.runDeletePermissionRequest(item);
      });
      return;
    }
    if (item.workflow === 'regularize-swipe') {
      const dialogRef = this.dialog.open(SwipeRequestDeleteDialogComponent, {
        width: '460px',
        height: 'calc(100vh - 64px)',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 64px)',
        panelClass: ['employee-dialog-panel', 'employee-delete-modal-panel'],
        position: {
          top: '64px',
          right: '0',
        },
        hasBackdrop: true,
        backdropClass: 'employee-dialog-backdrop',
        autoFocus: false,
        restoreFocus: false,
        disableClose: false,
        data: { request: this.buildSwipeDialogRequest(item) },
      });

      dialogRef.afterClosed().subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }

        this.runDeleteSwipeRequest(item);
      });
      return;
    }

    if (item.workflow !== 'request-od') {
      if (item.status === 'Rejected') {
        this.feedback.warning('This request is already rejected.');
        return;
      }

      this.requestHistory = this.requestHistory.map((request) =>
        request.id === item.id ? { ...request, status: 'Rejected' as RequestTableStatus } : request
      );
      this.feedback.warning(`${item.requestType} request marked as rejected.`);
      this.updateHistoryPageIndex();
      return;
    }

    const dialogRef = this.dialog.open(OnDutyRequestDeleteDialogComponent, {
      width: '460px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-delete-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      data: {
        request: this.buildOnDutyDialogRequest(item),
        canApprove: this.canApproveOnDutyHistoryRequest(item),
        currentRole: this.currentRole,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed?: boolean) => {
      if (!confirmed) {
        return;
      }

      this.runDeleteOndutyRequest(item);
    });
  }

  resetActiveWorkflowForm(): void {
    switch (this.config.key) {
      case 'apply-leave':
        this.leaveForm = {
          fromDate: this.selectedDate,
          toDate: this.selectedDate,
          startDay: 'full',
          endDay: 'first_half',
          leaveType: this.leaveTypes[0]?.leave_code || '',
          reason: '',
        };
        this.leaveDocumentDataUrl = '';
        this.leaveDocumentName = '';
        break;
      case 'regularize-swipe':
        this.swipeForm = {
          request_date: this.selectedDate,
          mode: '',
          punch_time: '',
          reason: '',
        };
        break;
      case 'permission-request':
        this.permissionForm = {
          empid: '',
          request_date: this.selectedDate,
          mode: '',
          starttime: '',
          endtime: '',
          reason: '',
        };
        break;
      case 'request-od':
        this.odForm = {
          empid: this.resolveEmployeeId(),
          from_date: this.selectedDate,
          to_date: this.selectedDate,
          place_of_visit: '',
          purpose_of_visit: '',
          comments: '',
          approved_by: '',
          approved_status: 'Pending',
          isapproved: false,
          isactive: true,
          isdelete: false,
        };
        break;
      default:
        this.queryForm = {
          category: 'Attendance',
          priority: 'Medium',
          subject: '',
          description: '',
        };
        break;
    }
  }

  submitWorkflow(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.config.key === 'request-od') {
      this.submitOdRequest();
      return;
    }
    if (this.config.key === 'apply-leave') {
      this.submitLeaveRequest();
      return;
    }
    if (this.config.key === 'permission-request') {
      this.submitPermissionRequest();
      return;
    }
    if (this.config.key === 'regularize-swipe') {
      this.submitSwipeRequest();
      return;
    }

    this.submitLocalWorkflow();
  }

  setApprovedStatus(status: ApprovalStatus): void {
    if (!this.showOdApprovalPanel) {
      this.syncOdApprovalState();
      return;
    }

    this.odForm.approved_status = status;
    this.odForm.isapproved = status === 'Approved';
  }

  setApprovalFlag(isApproved: boolean): void {
    if (!this.showOdApprovalPanel) {
      this.syncOdApprovalState();
      return;
    }

    this.odForm.isapproved = isApproved;
    this.odForm.approved_status = isApproved ? 'Approved' : 'Rejeted';
  }

  private patchDates(selectedDate: string): void {
    const normalizedDate = this.normalizeDateValue(selectedDate);
    this.leaveForm.fromDate = normalizedDate;
    this.leaveForm.toDate = normalizedDate;
    this.swipeForm.request_date = selectedDate;
    this.permissionForm.request_date = selectedDate;
    this.odForm.from_date = selectedDate;
    this.odForm.to_date = selectedDate;
    this.syncLeaveDateRange();
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

  private loadEmployeeDirectory(): void {
    this.apiService.getEmployeeList().subscribe({
      next: (data: any) => {
        const employees = this.extractRequestList<Employee>(data)
          .map((item: any) => item as Employee)
          .filter((item: Employee) => Number(item?.id || 0) > 0);

        this.employeeDirectory = new Map(
          employees.map((employee) => [Number(employee.id), employee])
        );
        this.employeeDirectoryLoaded = true;
        this.flushPendingHistoryReload();
      },
      error: () => {
        this.employeeDirectory.clear();
        this.employeeDirectoryLoaded = true;
        this.flushPendingHistoryReload();
      },
    });
  }

  private flushPendingHistoryReload(): void {
    if (!this.pendingHistoryReloadAfterDirectory) {
      return;
    }

    this.pendingHistoryReloadAfterDirectory = false;
    this.loadWorkflowHistory();
  }

  private loadLeaveTypes(): void {
    this.apiService.getleavetype().subscribe({
      next: (data: any) => {
        const source = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        this.leaveTypes = source
          .filter((item: any) => item?.isactive !== false)
          .map((item: any) => ({
            id: Number(item?.id || 0),
            leave_type: `${item?.leave_type || item?.leaveType || item?.name || item?.leave_code || ''}`.trim(),
            leave_code: `${item?.leave_code || item?.leaveCode || item?.code || ''}`.trim(),
            isactive: item?.isactive !== false,
            createddate: `${item?.createddate || item?.created_date || ''}`,
          }))
          .filter((item: LeaveTypeOption) => !!item.leave_code);

        this.ensureLeaveTypeSelection();
      },
      error: () => {
        this.leaveTypes = [
          { id: 1, leave_type: 'Casual Leave', leave_code: 'CL', isactive: true, createddate: '' },
          { id: 2, leave_type: 'Sick Leave', leave_code: 'SL', isactive: true, createddate: '' },
          { id: 3, leave_type: 'Leave Without Pay', leave_code: 'LWP', isactive: true, createddate: '' },
        ];
        this.ensureLeaveTypeSelection();
      },
    });
  }

  private ensureLeaveTypeSelection(): void {
    const currentLeaveType = `${this.leaveForm.leaveType || ''}`.trim();
    if (currentLeaveType && this.leaveTypes.some((item) => item.leave_code === currentLeaveType)) {
      return;
    }

    this.leaveForm.leaveType = this.leaveTypes[0]?.leave_code || '';
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

  private submitLocalWorkflow(): void {
    const isPayrollQuery = this.config.key === 'raise-query' && this.queryForm.category === 'Payroll';

    if (!this.validateCurrentWorkflow()) {
      this.feedback.warning('Fill all required fields before submitting.');
      return;
    }

    const historyItem = this.buildHistoryItemFromCurrentWorkflow('Pending');
    this.startLocalLoading(isPayrollQuery ? 'Creating...' : 'Loading...');

    timer(1200)
      .pipe(finalize(() => this.stopLocalLoading()))
      .subscribe(() => {
        if (historyItem) {
          this.addHistoryItem(historyItem);
        }

        if (isPayrollQuery) {
          this.feedback.success('Payroll request prepared successfully.');
          return;
        }

        this.feedback.success(`${this.config.title} submitted successfully.`);
      });
  }

  private submitOdRequest(): void {
    const canSetApprovalDecision = this.showOdApprovalPanel;
    const isManagerApproved = canSetApprovalDecision && this.odForm.isapproved;
    const requiresAdminReview = this.currentRole === 'ROLE_MANAGER' && !canSetApprovalDecision;

    const payload = {
      empid: this.empid,
      from_date: this.normalizeDateValue(this.odForm.from_date),
      to_date: this.normalizeDateValue(this.odForm.to_date),
      place_of_visit: `${this.odForm.place_of_visit}`.trim(),
      purpose_of_visit: `${this.odForm.purpose_of_visit}`.trim(),
      comments: `${this.odForm.comments}`.trim(),
      approved_status: "Pending",
    };

    if (!payload.from_date || !payload.to_date || !payload.place_of_visit || !payload.purpose_of_visit) {
      this.feedback.warning('Fill All Input Feild');
      return;
    }

    this.startLocalLoading('Loading...');
    this.apiService.getRequestforonduty(payload)
      .pipe(finalize(() => this.stopLocalLoading()))
      .subscribe({
        next: () => {
          this.resetActiveWorkflowForm();
          this.getondutylist();
          this.feedback.success(requiresAdminReview ? 'OD request submitted successfully. It is pending admin approval.' : 'OD request submitted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err.error?.message || 'Failed to submit OD request. Please try again.');
        },
      });
  }
  onLeaveStartDayChange(value: string): void {
    const normalizedValue = `${value || 'full'}`.trim().toLowerCase();
    if (normalizedValue === 'full') {
      this.leaveForm.endDay = 'first_half';
      this.syncLeaveDateRange();
      return;
    }

    if (`${this.leaveForm.endDay || ''}`.trim().toLowerCase() !== 'second_half') {
      this.leaveForm.endDay = 'first_half';
    }

    this.syncLeaveDateRange();
  }

  onLeaveFromDateChange(value: string | Date): void {
    this.leaveForm.fromDate = this.normalizeDateValue(value);
    this.syncLeaveDateRange();
  }

  onLeaveToDateChange(value: string | Date): void {
    this.leaveForm.toDate = this.normalizeDateValue(value);
    this.syncLeaveDateRange();
  }

  onLeaveDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;

    if (!file) {
      this.leaveDocumentDataUrl = '';
      this.leaveDocumentName = '';
      return;
    }

    this.leaveDocumentName = file.name || '';

    const reader = new FileReader();
    reader.onload = () => {
      this.leaveDocumentDataUrl = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.onerror = () => {
      this.leaveDocumentDataUrl = '';
      this.leaveDocumentName = '';
      this.feedback.error('Failed to read the selected document. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  private submitLeaveRequest(): void {
    const leaveTypeId = this.getSelectedLeaveTypeId();
    const fromDate = this.normalizeDateValue(this.leaveForm.fromDate);
    const toDate = this.normalizeDateValue(this.leaveForm.toDate);
    const reason = `${this.leaveForm.reason}`.trim();

    if (!fromDate || !toDate || !leaveTypeId || !reason) {
      this.feedback.warning('Fill All Input Feild');
      return;
    }

    if (this.leaveDocumentName && !this.leaveDocumentDataUrl) {
      this.feedback.warning('Document is still loading. Please wait.');
      return;
    }

    const payload = {
      empid: this.empid,
      leave_type_id: leaveTypeId,
      fromdate: fromDate,
      todate: toDate,
      leave_mode: this.resolveLeaveMode(),
      reason,
      status: "pending",
      doc_url: this.leaveDocumentDataUrl,
      filename: this.leaveDocumentName,
    };

    this.startLocalLoading('Loading...');
    this.apiService.createLeave(payload)
      .pipe(finalize(() => this.stopLocalLoading()))
      .subscribe({
        next: () => {
          this.resetActiveWorkflowForm();
          this.getLeaveDetails();
          this.loadLeaveBalances();
          this.feedback.success('Leave request submitted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err.error?.message || 'Failed to submit leave request. Please try again.');
        },
      });

  }
  formatToSeconds(time: string): string {
    return time ? `${time}:00` : '';
  }
  private submitPermissionRequest(): void {
    const reason = `${this.permissionForm.reason}`.trim();
    const request_date = this.normalizeDateValue(this.permissionForm.request_date);
    const mode = `${this.permissionForm.mode}`.trim();
    const starttime = `${this.permissionForm.starttime}`.trim();
    const endtime = `${this.permissionForm.endtime}`.trim();

    if (!mode || !starttime || !endtime || !reason) {
      this.feedback.warning('Fill All Input Feild');
      return;
    }

    const payload = {
      empid: this.empid,
      request_date: request_date,
      mode: mode,
      starttime: this.formatToSeconds(starttime),
      endtime: this.formatToSeconds(endtime),
      reason: reason,
      status: "pending"
    };

    this.startLocalLoading('Loading...');
    this.apiService.createPermission(payload)
      .pipe(finalize(() => this.stopLocalLoading()))
      .subscribe({
        next: () => {
          this.resetActiveWorkflowForm();
          this.getPermissionHistory();
          this.feedback.success('Permission request submitted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err.error?.message || 'Failed to submit permission request. Please try again.');
        },
      });
  }

  private submitSwipeRequest(): void {
    const request_date = this.normalizeDateValue(this.swipeForm.request_date);
    const mode = `${this.swipeForm.mode}`;
    const punch_time = `${this.swipeForm.punch_time}`.trim();
    const reason = `${this.swipeForm.reason}`.trim();

    if (!request_date || !mode || !punch_time || !reason) {
      this.feedback.warning('Fill All Input Feild');
      return;
    }

    const payload = {
      empid: this.empid,
      request_date: request_date,
      punch_time,
      mode: this.swipeForm.mode,
      reason,
      status: 'Pending',
    };

    this.startLocalLoading('Loading...');
    this.apiService.createSwipeRequest(payload)
      .pipe(finalize(() => this.stopLocalLoading()))
      .subscribe({
        next: () => {
          this.resetActiveWorkflowForm();
          this.getSwipeHistory();
          this.feedback.success('Swipe request submitted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err.error?.message || 'Failed to submit swipe request. Please try again.');
        },
      });
  }

  private getSelectedLeaveTypeId(): number {
    const selectedLeaveType = this.leaveTypes.find((item) => item.leave_code === `${this.leaveForm.leaveType}`.trim());
    return selectedLeaveType?.id || 0;
  }

  private resolveLeaveMode(): string {
    const normalizedStartDay = `${this.leaveForm.startDay || 'full'}`.trim().toLowerCase();
    if (normalizedStartDay === 'half') {
      return `${this.leaveForm.endDay || 'first_half'}`.trim().toLowerCase() === 'second_half' ? 'second_half' : 'first_half';
    }

    return 'full';
  }

  private startLocalLoading(headline: string, caption = ''): void {
    this.loadingStartedAt = Date.now();
    this.loadingHeadline = headline;
    this.loadingCaption = caption;
    this.isSubmitting = true;
  }

  private addHistoryItem(item: WorkflowRequestHistoryItem): void {
    this.requestHistory = [item, ...this.requestHistory];
    this.selectedHistoryRequestId = item.id;
    this.updateHistoryPageIndex(true);
  }

  private updateHistoryPageIndex(reset = false): void {
    if (reset) {
      this.historyPageIndex = 0;
      return;
    }

    const maxPageIndex = Math.max(Math.ceil(this.totalHistoryItems / this.historyPageSize) - 1, 0);
    this.historyPageIndex = Math.min(this.historyPageIndex, maxPageIndex);
  }

  private validateCurrentWorkflow(): boolean {
    switch (this.config.key) {
      case 'apply-leave':
        return !!this.leaveForm.fromDate && !!this.leaveForm.toDate && !!`${this.leaveForm.reason}`.trim();
      case 'regularize-swipe':
        return !!this.swipeForm.request_date
          && !!this.swipeForm.mode
          && !!this.swipeForm.punch_time
          && !!`${this.swipeForm.reason}`.trim();
      case 'permission-request':
        return !!this.permissionForm.empid && !!this.permissionForm.request_date && !!this.permissionForm.starttime && !!this.permissionForm.endtime && !!`${this.permissionForm.reason}`.trim();
      case 'raise-query':
        return !!this.queryForm.category && !!`${this.queryForm.subject}`.trim() && !!`${this.queryForm.description}`.trim();
      default:
        return true;
    }
  }

  private applyHistorySnapshot(item: WorkflowRequestHistoryItem): void {
    switch (item.workflow) {
      case 'apply-leave':
        this.leaveForm = { ...this.leaveForm, ...(item.formSnapshot as typeof this.leaveForm) };
        this.syncLeaveDateRange();
        break;
      case 'regularize-swipe':
        this.swipeForm = { ...this.swipeForm, ...(item.formSnapshot as typeof this.swipeForm) };
        break;
      case 'permission-request':
        this.permissionForm = { ...this.permissionForm, ...(item.formSnapshot as typeof this.permissionForm) };
        break;
      case 'request-od':
        this.odForm = { ...this.odForm, ...(item.formSnapshot as typeof this.odForm) };
        this.syncOdApprovalState();
        break;
      case 'raise-query':
        this.queryForm = { ...this.queryForm, ...(item.formSnapshot as typeof this.queryForm) };
        break;
    }
  }

  private buildHistoryItemFromCurrentWorkflow(status: RequestTableStatus): WorkflowRequestHistoryItem | null {
    switch (this.config.key) {
      case 'apply-leave':
        return this.createHistoryItem(
          'apply-leave',
          this.buildDateRangeLabel(this.leaveForm.fromDate, this.leaveForm.toDate),
          `${this.leaveForm.reason}`.trim() || `${this.leaveForm.leaveType} leave request`,
          status,
          { ...this.leaveForm }
        );
      case 'regularize-swipe':
        return this.createHistoryItem(
          'regularize-swipe',
          `${this.formatShortDate(this.swipeForm.request_date)} | ${this.swipeForm.punch_time}`,
          `${this.swipeForm.reason}`.trim() || 'Swipe regularization request',
          status,
          { ...this.swipeForm }
        );
      case 'permission-request':
        return this.createHistoryItem(
          'permission-request',
          `${this.formatShortDate(this.permissionForm.request_date)} | ${this.permissionForm.starttime} - ${this.permissionForm.endtime}`,
          `${this.permissionForm.reason}`.trim() || `${this.permissionForm.request_date} permission request`,
          status,
          { ...this.permissionForm }
        );
      case 'request-od':
        return this.createHistoryItem(
          'request-od',
          this.buildDateRangeLabel(this.odForm.from_date, this.odForm.to_date),
          `${this.odForm.purpose_of_visit}`.trim() || `${this.odForm.comments}`.trim() || 'On duty movement request',
          status,
          { ...this.odForm }
        );
      case 'raise-query':
        return this.createHistoryItem(
          'raise-query',
          this.formatShortDate(this.selectedDate),
          `${this.queryForm.subject}`.trim() || `${this.queryForm.description}`.trim() || 'Support query',
          status,
          { ...this.queryForm }
        );
      default:
        return null;
    }
  }

  private createHistoryItem(
    workflow: WorkflowKey,
    dateTime: string,
    reason: string,
    status: RequestTableStatus,
    formSnapshot: Record<string, unknown>
  ): WorkflowRequestHistoryItem {
    return {
      id: `REQ-${++this.historySequence}`,
      workflow,
      requestType: this.workflowConfigs[workflow].title,
      dateTime,
      reason,
      status,
      createdAt: this.formatHistoryTimestamp(new Date()),
      ownerEmpId: Number(formSnapshot['empid'] || this.currentEmployeeId || 0),
      formSnapshot,
    };
  }
  getondutylist(): void {
    this.apiService.getondutylist(this.empid).subscribe({
      next: (data: any) => {
        const requests = this.extractOnDutyRequestList(data)
          .filter(({ item }) => !!item && item.isdelete !== true)
          .sort((left, right) => this.getRequestSortValue(right.item.created_date || right.item.updated_date) - this.getRequestSortValue(left.item.created_date || left.item.updated_date));

        this.requestHistory = requests.map(({ item, bucket }) => this.mapOnDutyRequestToHistoryItem(item, bucket));
        this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
        this.updateHistoryPageIndex(true);
      },
      error: () => {
        this.requestHistory = [];
        this.selectedHistoryRequestId = '';
        this.updateHistoryPageIndex(true);
        this.feedback.error('Failed to load OD request history.');
      },
    });
  }

  private loadLeaveBalances(): void {
    const employeeId = Number(this.empid || this.currentEmployeeId || 0);
    if (!employeeId) {
      this.leaveBalances = [];
      this.leaveBalancesLoading = false;
      return;
    }

    this.leaveBalancesLoading = true;
    this.apiService.getemployeeleaveinfo(employeeId)
      .pipe(finalize(() => this.leaveBalancesLoading = false))
      .subscribe({
        next: (data: any) => {
          this.leaveBalances = this.extractLeaveBalanceRows(data);
        },
        error: () => {
          this.leaveBalances = [];
          this.feedback.error('Failed to load leave balances.');
        },
      });
  }

  private extractLeaveBalanceRows(data: any): LeaveBalanceRow[] {
    return this.extractLeaveBalanceSource(data)
      .map((item) => this.mapLeaveBalanceRow(item))
      .filter((item) => !!item.type);
  }

  private extractLeaveBalanceSource(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.result)) {
      return data.result;
    }

    const source = data?.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : data;
    const collectionKeys = ['balances', 'leave_balances', 'leaveBalances', 'leave_info', 'leaveInfo', 'employee_leave_info'];

    for (const key of collectionKeys) {
      if (Array.isArray(source?.[key])) {
        return source[key];
      }
    }

    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return [];
    }

    return Object.entries(source)
      .filter(([, value]) => !!value && typeof value === 'object' && !Array.isArray(value))
      .map(([key, value]) => ({ type: key, ...(value as Record<string, unknown>) }));
  }

  private mapLeaveBalanceRow(item: any): LeaveBalanceRow {
    const type = `${this.readLeaveBalanceValue(item, ['type', 'leave_code', 'leaveCode', 'leave_type', 'leaveType', 'leave_name', 'leaveName'], '')}`.trim();
    const currentBalance = this.readLeaveBalanceValue(item, ['total_allowed', 'currentBalance', 'current_balance', 'current', 'currentbalance', 'opening_balance', 'openingBalance']);
    const alreadyApplied = this.readLeaveBalanceValue(item, ['used_leaves', 'alreadyApplied', 'already_applied', 'applied', 'applied_balance', 'appliedBalance', 'used_balance', 'usedBalance'], 0);
    const availableBalance = this.readLeaveBalanceValue(item, ['remaining_leaves', 'availableBalance', 'available_balance', 'available', 'balance_available', 'balanceAvailable'], currentBalance);

    return {
      type,
      currentBalance,
      alreadyApplied,
      adjustment: this.readLeaveBalanceValue(item, ['adjustment', 'adjustment_balance', 'adjustmentBalance', 'adjust', 'adj'], 0),
      availableBalance,
      appliedFor: this.readLeaveBalanceValue(item, ['appliedFor', 'applied_for', 'for_days', 'forDays', 'request_days', 'requestDays'], 0),
      closingBalance: this.readLeaveBalanceValue(item, ['closingBalance', 'closing_balance', 'closing', 'closingbalance'], availableBalance),
    };
  }

  private readLeaveBalanceValue(item: any, keys: string[], fallback: number | string = '---'): number | string {
    for (const key of keys) {
      const value = item?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return fallback;
  }

  getLeaveDetails(): void {
    const employeeId = this.getHistoryRequestEmployeeId();
    if (!employeeId) {
      this.requestHistory = [];
      this.selectedHistoryRequestId = '';
      this.updateHistoryPageIndex(true);
      return;
    }

    this.apiService.getLeaveDetails(employeeId)
      .pipe(
        map((data: any) => this.extractLeaveRequestList(data)),
        catchError(() => of([] as Array<{ item: LeaveRequestApiItem; bucket: LeaveRequestBucket | null }>))
      )
      .subscribe({
        next: (requests: Array<{ item: LeaveRequestApiItem; bucket: LeaveRequestBucket | null }>) => {
          const sortedRequests = requests
            .filter(({ item }) => !!item && item.isdelete !== true)
            .sort((left, right) => this.getRequestSortValue(right.item.createddate || right.item.updateddate) - this.getRequestSortValue(left.item.createddate || left.item.updateddate));

          this.requestHistory = sortedRequests.map(({ item, bucket }) => this.mapLeaveRequestToHistoryItem(item, bucket));
          this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
          this.updateHistoryPageIndex(true);
        },
        error: () => {
          this.requestHistory = [];
          this.selectedHistoryRequestId = '';
          this.updateHistoryPageIndex(true);
          this.feedback.error('Failed to load leave request history.');
        },
      });
  }

  getPermissionHistory(): void {
    const employeeId = this.getHistoryRequestEmployeeId();
    if (!employeeId) {
      this.requestHistory = [];
      this.selectedHistoryRequestId = '';
      this.updateHistoryPageIndex(true);
      return;
    }

    this.apiService.getPermissionDetails(employeeId)
      .pipe(
        map((data: any) => this.extractPermissionRequestList(data)),
        catchError(() => of([] as Array<{ item: PermissionRequestApiItem; bucket: PermissionRequestBucket | null }>))
      )
      .subscribe({
        next: (requests: Array<{ item: PermissionRequestApiItem; bucket: PermissionRequestBucket | null }>) => {
          const sortedRequests = requests
            .filter(({ item }) => !!item && item.isdelete !== true)
            .sort((left, right) => this.getRequestSortValue(right.item.createddate || right.item.updateddate) - this.getRequestSortValue(left.item.createddate || left.item.updateddate));

          this.requestHistory = sortedRequests.map(({ item, bucket }) => this.mapPermissionRequestToHistoryItem(item, bucket));
          this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
          this.updateHistoryPageIndex(true);
        },
        error: () => {
          this.requestHistory = [];
          this.selectedHistoryRequestId = '';
          this.updateHistoryPageIndex(true);
          this.feedback.error('Failed to load permission request history.');
        },
      });
  }

  getSwipeHistory(): void {
    const employeeId = this.getHistoryRequestEmployeeId();
    if (!employeeId) {
      this.requestHistory = [];
      this.selectedHistoryRequestId = '';
      this.updateHistoryPageIndex(true);
      return;
    }

    this.apiService.getSwipeDetails(employeeId)
      .pipe(
        map((data: any) => this.extractSwipeRequestList(data)),
        catchError(() => of([] as Array<{ item: SwipeRequestApiItem; bucket: SwipeRequestBucket | null }>))
      )
      .subscribe({
        next: (requests: Array<{ item: SwipeRequestApiItem; bucket: SwipeRequestBucket | null }>) => {
          const sortedRequests = requests
            .filter(({ item }) => !!item && item.isdelete !== true)
            .sort((left, right) => this.getRequestSortValue(right.item.createddate || right.item.updateddate) - this.getRequestSortValue(left.item.createddate || left.item.updateddate));

          this.requestHistory = sortedRequests.map(({ item, bucket }) => this.mapSwipeRequestToHistoryItem(item, bucket));
          this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
          this.updateHistoryPageIndex(true);
        },
        error: () => {
          this.requestHistory = [];
          this.selectedHistoryRequestId = '';
          this.updateHistoryPageIndex(true);
          this.feedback.error('Failed to load swipe request history.');
        },
      });
  }

  private loadWorkflowHistory(): void {
    if (this.config.key === 'request-od') {
      this.getondutylist();
      return;
    }

    if (this.config.key === 'apply-leave') {
      this.loadLeaveBalances();
      this.getLeaveDetails();
      return;
    }

    if (this.config.key === 'permission-request') {
      this.getPermissionHistory();
      return;
    }

    if (this.config.key === 'regularize-swipe') {
      this.getSwipeHistory();
      return;
    }

    this.requestHistory = this.buildSeedHistory();
    this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
    this.updateHistoryPageIndex(true);
  }

  private extractRequestList<T>(data: any): T[] {
    if (Array.isArray(data)) {
      return data as T[];
    }

    if (Array.isArray(data?.data)) {
      return data.data as T[];
    }

    if (Array.isArray(data?.result)) {
      return data.result as T[];
    }

    return [];
  }

  private extractLeaveRequestList(data: any): Array<{ item: LeaveRequestApiItem; bucket: LeaveRequestBucket | null }> {
    const flatRequests = this.extractRequestList<LeaveRequestApiItem>(data);
    if (flatRequests.length) {
      return flatRequests.map((item) => ({ item, bucket: null }));
    }

    const groupedSource = (data?.data && !Array.isArray(data.data) ? data.data : data) as LeaveRequestListResponse | null | undefined;
    const buckets: LeaveRequestBucket[] = ['pending', 'approved', 'rejected'];

    return buckets.reduce((all, bucket) => {
      const bucketItems = groupedSource?.[bucket];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({ item, bucket })));
    }, [] as Array<{ item: LeaveRequestApiItem; bucket: LeaveRequestBucket | null }>);
  }

  private extractPermissionRequestList(data: any): Array<{ item: PermissionRequestApiItem; bucket: PermissionRequestBucket | null }> {
    const flatRequests = this.extractRequestList<PermissionRequestApiItem>(data);
    if (flatRequests.length) {
      return flatRequests.map((item) => ({ item, bucket: null }));
    }

    const groupedSource = (data?.data && !Array.isArray(data.data) ? data.data : data) as PermissionRequestListResponse | null | undefined;
    const buckets: PermissionRequestBucket[] = ['pending', 'approved', 'rejected'];

    return buckets.reduce((all, bucket) => {
      const bucketItems = groupedSource?.[bucket];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({ item, bucket })));
    }, [] as Array<{ item: PermissionRequestApiItem; bucket: PermissionRequestBucket | null }>);
  }

  private extractSwipeRequestList(data: any): Array<{ item: SwipeRequestApiItem; bucket: SwipeRequestBucket | null }> {
    const flatRequests = this.extractRequestList<SwipeRequestApiItem>(data);
    if (flatRequests.length) {
      return flatRequests.map((item) => ({ item, bucket: null }));
    }

    const groupedSource = (data?.data && !Array.isArray(data.data) ? data.data : data) as SwipeRequestListResponse | null | undefined;
    const buckets: SwipeRequestBucket[] = ['pending', 'approved', 'rejected'];

    return buckets.reduce((all, bucket) => {
      const bucketItems = groupedSource?.[bucket];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({ item, bucket })));
    }, [] as Array<{ item: SwipeRequestApiItem; bucket: SwipeRequestBucket | null }>);
  }

  private extractOnDutyRequestList(data: any): Array<{ item: OnDutyRequestApiItem; bucket: OnDutyRequestBucket | null }> {
    const flatRequests = this.extractRequestList<OnDutyRequestApiItem>(data);
    if (flatRequests.length) {
      return flatRequests.map((item) => ({ item, bucket: null }));
    }

    const groupedSource = (data?.data && !Array.isArray(data.data) ? data.data : data) as OnDutyRequestListResponse | null | undefined;
    const buckets: OnDutyRequestBucket[] = ['pending', 'approved', 'rejected'];

    return buckets.reduce((all, bucket) => {
      const bucketItems = groupedSource?.[bucket];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({ item, bucket })));
    }, [] as Array<{ item: OnDutyRequestApiItem; bucket: OnDutyRequestBucket | null }>);
  }

  private mapOnDutyRequestToHistoryItem(
    item: OnDutyRequestApiItem,
    bucket: OnDutyRequestBucket | null = null
  ): WorkflowRequestHistoryItem {
    const normalizedStatus = this.normalizeOnDutyRequestStatus(item, bucket);
    const reasonParts = [`${item.place_of_visit || ''}`.trim(), `${item.purpose_of_visit || ''}`.trim()].filter(Boolean);
    const reason = reasonParts.join(' | ') || `${item.comments || ''}`.trim() || 'On duty request';

    return {
      id: `OD-${item.id}`,
      workflow: 'request-od',
      requestType: this.workflowConfigs['request-od'].title,
      dateTime: this.buildDateRangeLabel(item.from_date, item.to_date),
      reason,
      status: normalizedStatus,
      createdAt: this.formatApiTimestamp(item.created_date || item.updated_date),
      ownerEmpId: Number(item.empid || 0),
      formSnapshot: {
        id: item.id,
        empid: `${item.empid ?? this.empid}`,
        from_date: item.from_date,
        to_date: item.to_date,
        place_of_visit: item.place_of_visit || '',
        purpose_of_visit: item.purpose_of_visit || '',
        comments: item.comments || '',
        manager_approval: item.manager_approval ?? false,
        admin_approval: item.admin_approval ?? false,
        isactive: item.isactive !== false,
        isdelete: item.isdelete === true,
        isapproved: normalizedStatus === 'Approved',
        no_of_days: Number(item.no_of_days || 0),
        approved_by: item.approved_by ?? '',
        approved_status: this.toApprovalDecisionStatus(normalizedStatus),
        created_date: item.created_date || '',
        updated_date: item.updated_date || '',
        employee_name: item.employee_name || '',
      },
    };
  }

  private normalizeOnDutyRequestStatus(
    item: OnDutyRequestApiItem,
    bucket: OnDutyRequestBucket | null
  ): RequestTableStatus {
    if (bucket === 'approved') {
      return 'Approved';
    }

    if (bucket === 'rejected') {
      return 'Rejected';
    }

    if (bucket === 'pending') {
      return 'Pending';
    }

    if (item.isdelete === true || item.isactive === false) {
      return 'Rejected';
    }

    if (item.manager_approval && item.admin_approval) {
      return 'Approved';
    }

    return this.normalizeRequestStatus(item.approved_status);
  }

  private mapPermissionRequestToHistoryItem(
    item: PermissionRequestApiItem,
    bucket: PermissionRequestBucket | null = null
  ): WorkflowRequestHistoryItem {
    const normalizedStatus = this.normalizePermissionRequestStatus(item, bucket);

    return {
      id: `PR-${item.id}`,
      workflow: 'permission-request',
      requestType: this.workflowConfigs['permission-request'].title,
      dateTime: `${this.formatShortDate(item.request_date)} | ${this.formatDisplayTimeRange(item.starttime, item.endtime)}`,
      reason: `${item.reason || ''}`.trim() || 'Permission request',
      status: normalizedStatus,
      createdAt: this.formatApiTimestamp(item.createddate || item.updateddate),
      ownerEmpId: Number(item.empid || 0),
      formSnapshot: {
        id: item.id,
        empid: Number(item.empid || 0),
        request_date: this.normalizeDateValue(item.request_date),
        mode: `${item.mode || ''}`.trim(),
        starttime: this.trimTimeSeconds(item.starttime),
        endtime: this.trimTimeSeconds(item.endtime),
        reason: `${item.reason || ''}`.trim(),
        status: item.status || normalizedStatus,
        approved_status: this.toApprovalDecisionStatus(normalizedStatus),
        approved_by: item.approved_by ?? null,
        manager_approval: item.manager_approval ?? false,
        admin_approval: item.admin_approval ?? false,
        isapproved: normalizedStatus === 'Approved',
        isactive: item.isactive !== false,
        isdelete: item.isdelete === true,
        createddate: item.createddate || '',
        updateddate: item.updateddate || '',
        employee_name: item.employee_name || '',
      },
    };
  }

  private normalizePermissionRequestStatus(
    item: PermissionRequestApiItem,
    bucket: PermissionRequestBucket | null
  ): RequestTableStatus {
    if (bucket === 'approved') {
      return 'Approved';
    }

    if (bucket === 'rejected') {
      return 'Rejected';
    }

    if (bucket === 'pending') {
      return 'Pending';
    }

    if (item.isdelete === true || item.isactive === false) {
      return 'Rejected';
    }

    if (item.manager_approval && item.admin_approval) {
      return 'Approved';
    }

    return this.normalizeRequestStatus(item.status);
  }

  private mapSwipeRequestToHistoryItem(
    item: SwipeRequestApiItem,
    bucket: SwipeRequestBucket | null = null
  ): WorkflowRequestHistoryItem {
    const normalizedStatus = this.normalizeSwipeRequestStatus(item, bucket);
    const requestDate = this.getSwipeRequestDate(item);
    const punchTime = this.getSwipePunchTime(item);
    const mode = `${item.mode || ''}`.trim();

    return {
      id: `SW-${item.id}`,
      workflow: 'regularize-swipe',
      requestType: this.workflowConfigs['regularize-swipe'].title,
      dateTime: `${this.formatShortDate(requestDate)} | ${mode || 'Swipe'} | ${punchTime || 'Time not set'}`,
      reason: `${item.reason || ''}`.trim() || 'Swipe regularization request',
      status: normalizedStatus,
      createdAt: this.formatApiTimestamp(item.createddate || item.updateddate),
      ownerEmpId: Number(item.empid || 0),
      formSnapshot: {
        id: item.id,
        empid: Number(item.empid || 0),
        request_date: requestDate,
        punch_time: punchTime,
        mode: mode,
        reason: `${item.reason || ''}`.trim(),
        status: item.status || normalizedStatus,
        approved_by: item.approved_by ?? null,
        isactive: item.isactive !== false,
        isdelete: item.isdelete === true,
        manager_approval: item.manager_approval ?? false,
        admin_approval: item.admin_approval ?? false,
        createddate: item.createddate || '',
        updateddate: item.updateddate || '',
        employee_name: item.employee_name || '',
      },
    };
  }

  private normalizeSwipeRequestStatus(
    item: SwipeRequestApiItem,
    bucket: SwipeRequestBucket | null
  ): RequestTableStatus {
    if (bucket === 'approved') {
      return 'Approved';
    }

    if (bucket === 'rejected') {
      return 'Rejected';
    }

    if (bucket === 'pending') {
      return 'Pending';
    }

    if (item.isdelete === true || item.isactive === false) {
      return 'Rejected';
    }

    return this.normalizeRequestStatus(item.status);
  }

  private toApprovalDecisionStatus(status: RequestTableStatus | string): ApprovalStatus {
    const normalizedStatus = `${status || ''}`.trim().toLowerCase();

    if (normalizedStatus === 'approved') {
      return 'Approved';
    }

    if (normalizedStatus === 'rejected' || normalizedStatus === 'rejeted') {
      return 'Rejeted';
    }

    return 'Pending';
  }

  private toBooleanValue(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    const normalizedValue = `${value}`.trim().toLowerCase();
    if (!normalizedValue) {
      return fallback;
    }

    return ['true', '1', 'yes', 'y'].includes(normalizedValue);
  }

  private mapLeaveRequestToHistoryItem(
    item: LeaveRequestApiItem,
    bucket: LeaveRequestBucket | null = null
  ): WorkflowRequestHistoryItem {
    const normalizedStatus = this.normalizeLeaveRequestStatus(item, bucket);
    const leaveModeSnapshot = this.mapLeaveModeToFormSnapshot(item.leave_mode);
    const leaveTypeCode = this.resolveLeaveTypeCode(Number(item.leave_type_id || 0));

    return {
      id: `LV-${item.id}`,
      workflow: 'apply-leave',
      requestType: this.workflowConfigs['apply-leave'].title,
      dateTime: this.buildDateRangeLabel(item.fromdate, item.todate),
      reason: `${item.reason || ''}`.trim() || 'Leave request',
      status: normalizedStatus,
      createdAt: this.formatApiTimestamp(item.createddate || item.updateddate),
      ownerEmpId: Number(item.empid || 0),
      formSnapshot: {
        ...item,
        id: item.id,
        empid: Number(item.empid || 0),
        employee_name: `${(item as LeaveRequestApiItem & { employee_name?: string }).employee_name || ''}`.trim(),
        leave_type_id: Number(item.leave_type_id || 0),
        fromDate: this.normalizeDateValue(item.fromdate),
        toDate: this.normalizeDateValue(item.todate),
        startDay: leaveModeSnapshot.startDay,
        endDay: leaveModeSnapshot.endDay,
        leaveType: leaveTypeCode,
        reason: `${item.reason || ''}`.trim(),
        leave_mode: item.leave_mode || 'full',
        totaldays: Number(item.totaldays || 0),
        doc_url: item.doc_url || '',
        filename: item.filename || '',
        status: item.status || normalizedStatus,
        approved_status: this.toApprovalDecisionStatus(normalizedStatus),
        approved_by: item.approved_by ?? null,
        manager_approval: item.manager_approval ?? false,
        admin_approval: item.admin_approval ?? false,
        isapproved: normalizedStatus === 'Approved',
        isactive: item.isactive !== false,
        isdelete: item.isdelete === true,
        createddate: item.createddate || '',
        updateddate: item.updateddate || '',
      },
    };
  }

  private normalizeLeaveRequestStatus(
    item: LeaveRequestApiItem,
    bucket: LeaveRequestBucket | null
  ): RequestTableStatus {
    if (bucket === 'approved') {
      return 'Approved';
    }

    if (bucket === 'rejected') {
      return 'Rejected';
    }

    if (bucket === 'pending') {
      return 'Pending';
    }

    if (item.isdelete === true || item.isactive === false) {
      return 'Rejected';
    }

    if (item.manager_approval && item.admin_approval) {
      return 'Approved';
    }

    return this.normalizeRequestStatus(item.status);
  }

  private mapLeaveModeToFormSnapshot(leaveMode: string): { startDay: string; endDay: string } {
    const normalizedMode = `${leaveMode || 'full'}`.trim().toLowerCase();

    if (normalizedMode === 'first_half' || normalizedMode === 'second_half') {
      return {
        startDay: 'half',
        endDay: normalizedMode,
      };
    }

    return {
      startDay: 'full',
      endDay: 'first_half',
    };
  }

  private resolveLeaveTypeCode(leaveTypeId: number): string {
    const matchedType = this.leaveTypes.find((item) => Number(item.id || 0) === leaveTypeId);
    if (matchedType?.leave_code) {
      return matchedType.leave_code;
    }

    switch (leaveTypeId) {
      case 1:
        return 'CL';
      case 2:
        return 'SL';
      case 3:
        return 'LWP';
      default:
        return '';
    }
  }

  private buildOnDutyDialogRequest(item: WorkflowRequestHistoryItem): any {
    const snapshot = item.formSnapshot as Record<string, any>;
    const approvedStatus = this.toApprovalDecisionStatus(snapshot.approved_status || item.status);

    return {
      id: Number(snapshot.id || this.extractOnDutyRequestId(item)),
      empid: Number(snapshot.empid || item.ownerEmpId || 0),
      employee_name: snapshot.employee_name || '',
      from_date: snapshot.from_date || '',
      to_date: snapshot.to_date || '',
      place_of_visit: snapshot.place_of_visit || '',
      purpose_of_visit: snapshot.purpose_of_visit || '',
      comments: snapshot.comments || '',
      approved_by: snapshot.approved_by || '',
      manager_approval: this.toBooleanValue(snapshot.manager_approval, false),
      admin_approval: this.toBooleanValue(snapshot.admin_approval, false),
      isactive: this.toBooleanValue(snapshot.isactive, true),
      isdelete: this.toBooleanValue(snapshot.isdelete, false),
      approved_status: approvedStatus,
      isapproved: approvedStatus === 'Approved',
      no_of_days: Number(snapshot.no_of_days || 0),
      created_date: snapshot.created_date || item.createdAt,
      updated_date: snapshot.updated_date || '',
      display_id: item.id,
      display_status: item.status,
      request_type: item.requestType,
    };
  }

  private buildPermissionDialogRequest(item: WorkflowRequestHistoryItem): any {
    const snapshot = item.formSnapshot as Record<string, any>;
    const approvedStatus = this.toApprovalDecisionStatus(snapshot.approved_status || snapshot.status || item.status);

    return {
      id: this.extractPermissionRequestId(item),
      empid: Number(snapshot.empid || item.ownerEmpId || 0),
      employee_name: snapshot.employee_name || '',
      request_date: snapshot.request_date || '',
      mode: `${snapshot.mode || ''}`.trim(),
      starttime: this.trimTimeSeconds(snapshot.starttime || ''),
      endtime: this.trimTimeSeconds(snapshot.endtime || ''),
      reason: snapshot.reason || '',
      status: snapshot.status || item.status,
      approved_status: approvedStatus,
      approved_by: snapshot.approved_by ?? null,
      isactive: this.toBooleanValue(snapshot.isactive, true),
      isdelete: this.toBooleanValue(snapshot.isdelete, false),
      manager_approval: this.toBooleanValue(snapshot.manager_approval, false),
      admin_approval: this.toBooleanValue(snapshot.admin_approval, false),
    };
  }

  private buildSwipeDialogRequest(item: WorkflowRequestHistoryItem): any {
    const snapshot = item.formSnapshot as Record<string, any>;
    const request_date = this.normalizeDateValue(snapshot.request_date || '');
    const mode = `${snapshot.mode || ''}`.trim();
    const punch_time = this.trimTimeSeconds(snapshot.punch_time || '');

    return {
      id: this.extractSwipeRequestId(item),
      empid: Number(snapshot.empid || item.ownerEmpId || 0),
      employee_name: snapshot.employee_name || '',
      request_date,
      punch_time,
      mode,
      reason: snapshot.reason || '',
      status: snapshot.status || item.status,
      approved_status: this.toApprovalDecisionStatus(snapshot.status || item.status),
      approved_by: snapshot.approved_by ?? null,
      isactive: this.toBooleanValue(snapshot.isactive, true),
      isdelete: this.toBooleanValue(snapshot.isdelete, false),
      manager_approval: this.toBooleanValue(snapshot.manager_approval, false),
      admin_approval: this.toBooleanValue(snapshot.admin_approval, false),
    };
  }

  private extractOnDutyRequestId(item: WorkflowRequestHistoryItem): number {
    const snapshot = item.formSnapshot as Record<string, any>;
    const rawId = snapshot.id || `${item.id}`.replace(/^OD-/, '');
    const requestId = Number(rawId);
    return Number.isFinite(requestId) && requestId > 0 ? requestId : 0;
  }

  private extractPermissionRequestId(item: WorkflowRequestHistoryItem): number {
    const snapshot = item.formSnapshot as Record<string, any>;
    const rawId = snapshot.id || `${item.id}`.replace(/^PR-/, '');
    const requestId = Number(rawId);
    return Number.isFinite(requestId) && requestId > 0 ? requestId : 0;
  }

  private extractSwipeRequestId(item: WorkflowRequestHistoryItem): number {
    const snapshot = item.formSnapshot as Record<string, any>;
    const rawId = snapshot.id || `${item.id}`.replace(/^SW-/, '');
    const requestId = Number(rawId);
    return Number.isFinite(requestId) && requestId > 0 ? requestId : 0;
  }

  private canEditOnDutyHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isOwnHistoryRequest(item) || this.isTeamHistoryRequest(item);
    }

    if (this.currentRole === 'ROLE_EMPLOYEE') {
      return this.isOwnHistoryRequest(item);
    }

    return false;
  }


  private canApproveLeaveHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isTeamHistoryRequest(item);
    }

    return false;
  }

  private canApproveOnDutyHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isTeamHistoryRequest(item);
    }

    return false;
  }

  private canApprovePermissionHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isTeamHistoryRequest(item);
    }

    return false;
  }

  private canApproveSwipeHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    if (this.hasFullHistoryAccess()) {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return this.isTeamHistoryRequest(item);
    }

    return false;
  }

  private hasFullHistoryAccess(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY';
  }

  private isOwnHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    return !!this.currentEmployeeId && Number(item.ownerEmpId || 0) === this.currentEmployeeId;
  }

  private isTeamHistoryRequest(item: WorkflowRequestHistoryItem): boolean {
    const ownerEmpId = Number(item.ownerEmpId || 0);
    if (!ownerEmpId || !this.currentEmployeeId || ownerEmpId === this.currentEmployeeId) {
      return false;
    }

    const employee = this.employeeDirectory.get(ownerEmpId);
    if (!employee) {
      return false;
    }

    return Number(employee.managerid || 0) === this.currentEmployeeId || Number(employee.sub_manager_id || 0) === this.currentEmployeeId;
  }

  private isManagerReviewingTeamOdRequest(): boolean {
    if (this.currentRole !== 'ROLE_MANAGER') {
      return false;
    }

    if (this.reviewRequest?.workflow === 'request-od') {
      return this.reviewRequest.requesterRole === 'Employee';
    }

    const requestOwnerEmpId = Number(this.odForm.empid || this.empid || 0);
    return !!requestOwnerEmpId && !!this.currentEmployeeId && requestOwnerEmpId !== this.currentEmployeeId;
  }

  private syncOdApprovalState(): void {
    if (this.config.key !== 'request-od' || this.showOdApprovalPanel) {
      return;
    }

    this.odForm.approved_by = '';
    this.odForm.approved_status = 'Pending';
    this.odForm.isapproved = false;
  }

  private runDeleteOndutyRequest(item: WorkflowRequestHistoryItem): void {
    const requestId = this.extractOnDutyRequestId(item);
    if (!requestId) {
      this.feedback.error('OD request id is not available.');
      return;
    }

    this.deletingHistoryRequestIds.add(item.id);
    this.apiService.getDeleteOndutyRequest(requestId, this.username)
      .pipe(finalize(() => this.deletingHistoryRequestIds.delete(item.id)))
      .subscribe({
        next: () => {
          this.getondutylist();
          this.feedback.success('OD request deleted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err?.error?.message || 'Failed to delete OD request. Please try again.');
        },
      });
  }
  private runDeleteLeaveRequest(item: WorkflowRequestHistoryItem): void {
    const requestId = this.extractOnDutyRequestId(item);
    if (!requestId) {
      this.feedback.error('Leave request id is not available.');
      return;
    }

    this.deletingHistoryRequestIds.add(item.id);
    this.apiService.getDeleteLeaveDetails(requestId, this.username)
      .pipe(finalize(() => this.deletingHistoryRequestIds.delete(item.id)))
      .subscribe({
        next: () => {
          this.getondutylist();
          this.feedback.success('Leave request deleted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err?.error?.message || 'Failed to delete Leave request. Please try again.');
        },
      });
  }
  private runDeletePermissionRequest(item: WorkflowRequestHistoryItem): void {
    const requestId = this.extractPermissionRequestId(item);
    if (!requestId) {
      this.feedback.error('Permission request id is not available.');
      return;
    }

    this.deletingHistoryRequestIds.add(item.id);
    this.apiService.getDeletePermissionDetails(requestId, this.username)
      .pipe(finalize(() => this.deletingHistoryRequestIds.delete(item.id)))
      .subscribe({
        next: () => {
          this.getPermissionHistory();
          this.feedback.success('Permission request deleted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err?.error?.message || 'Failed to delete Permission request. Please try again.');
        },
      });
  }
  private runDeleteSwipeRequest(item: WorkflowRequestHistoryItem): void {
    const requestId = this.extractSwipeRequestId(item);
    if (!requestId) {
      this.feedback.error('Swipe request id is not available.');
      return;
    }

    this.deletingHistoryRequestIds.add(item.id);
    this.apiService.getDeleteSwipeDetails(requestId, this.username)
      .pipe(finalize(() => this.deletingHistoryRequestIds.delete(item.id)))
      .subscribe({
        next: () => {
          this.getSwipeHistory();
          this.feedback.success('Swipe request deleted successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err?.error?.message || 'Failed to delete Swipe request. Please try again.');
        },
      });
  }

  private buildLeaveDialogRequest(item: WorkflowRequestHistoryItem): any {
    const snapshot = item.formSnapshot as Record<string, any>;
    const leaveTypeId = Number(snapshot.leave_type_id || 0);
    const leaveTypeCode = `${snapshot.leaveType || this.resolveLeaveTypeCode(leaveTypeId) || ''}`.trim();
    const approvedStatus = this.toApprovalDecisionStatus(snapshot.approved_status || snapshot.status || item.status);

    return {
      ...snapshot,
      id: this.extractLeaveRequestId(item),
      empid: Number(snapshot.empid || item.ownerEmpId || 0),
      employee_name: `${snapshot.employee_name || ''}`.trim(),
      fromDate: snapshot.fromDate || this.normalizeDateValue(snapshot.fromdate || ''),
      toDate: snapshot.toDate || this.normalizeDateValue(snapshot.todate || ''),
      startDay: snapshot.startDay || 'full',
      endDay: snapshot.endDay || 'first_half',
      leaveType: leaveTypeCode,
      leave_type_id: leaveTypeId || this.getLeaveTypeIdFromCode(leaveTypeCode),
      leave_type_label: this.resolveLeaveTypeLabel(leaveTypeId, leaveTypeCode),
      reason: snapshot.reason || '',
      leave_mode: snapshot.leave_mode || 'full',
      totaldays: Number(snapshot.totaldays || 0),
      doc_url: snapshot.doc_url || '',
      filename: snapshot.filename || '',
      status: snapshot.status || item.status,
      approved_status: approvedStatus,
      approved_by: snapshot.approved_by ?? null,
      isapproved: approvedStatus === 'Approved',
      isactive: this.toBooleanValue(snapshot.isactive, true),
      isdelete: this.toBooleanValue(snapshot.isdelete, false),
      manager_approval: this.toBooleanValue(snapshot.manager_approval, false),
      admin_approval: this.toBooleanValue(snapshot.admin_approval, false),
      display_id: item.id,
      request_type: item.requestType,
    };
  }

  private extractLeaveRequestId(item: WorkflowRequestHistoryItem): number {
    const snapshot = item.formSnapshot as Record<string, any>;
    const rawId = snapshot.id || `${item.id}`.replace(/^LV-/, '');
    const requestId = Number(rawId);
    return Number.isFinite(requestId) && requestId > 0 ? requestId : 0;
  }

  private getLeaveTypeIdFromCode(leaveCode: string): number {
    const matchedType = this.leaveTypes.find((item) => item.leave_code === `${leaveCode || ''}`.trim());
    return matchedType?.id || 0;
  }

  private resolveLeaveTypeLabel(leaveTypeId: number, leaveTypeCode: string): string {
    const matchedType =
      this.leaveTypes.find((item) => Number(item.id || 0) === leaveTypeId) ||
      this.leaveTypes.find((item) => item.leave_code === `${leaveTypeCode || ''}`.trim());

    if (matchedType?.leave_type) {
      return matchedType.leave_type;
    }

    switch (`${leaveTypeCode || ''}`.trim().toUpperCase()) {
      case 'CL':
        return 'Casual Leave';
      case 'SL':
        return 'Sick Leave';
      case 'LWP':
        return 'Leave Without Pay';
      default:
        return leaveTypeCode || 'Leave';
    }
  }

  getHistoryDeleteButtonLabel(item: WorkflowRequestHistoryItem): string {
    return item.workflow === 'request-od'
      || item.workflow === 'apply-leave'
      || item.workflow === 'permission-request'
      || item.workflow === 'regularize-swipe'
      ? 'Delete'
      : 'Cancel';
  }

  private getRequestSortValue(value: string): number {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
  }

  private getHistoryRequestEmployeeId(): number {
    const employeeId = Number(this.empid || this.currentEmployeeId || 0);
    return employeeId > 0 ? employeeId : 0;
  }

  private removeLeaveRequestFromHistory(item: WorkflowRequestHistoryItem): void {
    this.requestHistory = this.requestHistory.filter((request) => request.id !== item.id);
    this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
    this.updateHistoryPageIndex();
    this.feedback.success('Leave request removed from the table.');
  }

  private removePermissionRequestFromHistory(item: WorkflowRequestHistoryItem): void {
    this.requestHistory = this.requestHistory.filter((request) => request.id !== item.id);
    this.selectedHistoryRequestId = this.requestHistory[0]?.id || '';
    this.updateHistoryPageIndex();
    this.feedback.success('Permission request removed from the table.');
  }
  private buildSeedHistory(): WorkflowRequestHistoryItem[] {
    return [
      this.createHistoryItem('apply-leave', '18 Mar 2026 to 20 Mar 2026', 'Family function leave request', 'Approved', {
        fromDate: '2026-03-18',
        toDate: '2026-03-20',
        startDay: 'full',
        endDay: 'first_half',
        leaveType: 'CL',
        reason: 'Family function leave request',
      }),
      this.createHistoryItem('request-od', '17 Mar 2026 to 17 Mar 2026', 'Client visit at Chennai branch', 'Pending', {
        empid: this.resolveEmployeeId(),
        from_date: '2026-03-17',
        to_date: '2026-03-17',
        place_of_visit: 'Chennai Branch',
        purpose_of_visit: 'Client visit at Chennai branch',
        comments: 'Meeting with the implementation team.',
        approved_by: '',
        approved_status: 'Pending',
        isapproved: false,
        isactive: true,
        isdelete: false,
      }),
      this.createHistoryItem('regularize-swipe', '16 Mar 2026 | 09:20 - 18:24', 'Swipe missed due to biometric downtime', 'Rejected', {
        attendanceDate: '2026-03-16',
        expectedIn: '09:00',
        expectedOut: '18:00',
        actualIn: '09:20',
        actualOut: '18:24',
        reason: 'Swipe missed due to biometric downtime',
      }),
      this.createHistoryItem('permission-request', '15 Mar 2026 | 14:00 - 16:00', 'Medical consultation permission', 'Approved', {
        permissionDate: '2026-03-15',
        permissionType: 'Medical',
        startTime: '14:00',
        endTime: '16:00',
        reason: 'Medical consultation permission',
      }),
      this.createHistoryItem('apply-leave', '11 Mar 2026 to 11 Mar 2026', 'Personal work for one day', 'Pending', {
        fromDate: '2026-03-11',
        toDate: '2026-03-11',
        startDay: 'full',
        endDay: 'first_half',
        leaveType: 'Permission',
        reason: 'Personal work for one day',
      }),
    ];
  }

  private buildDateRangeLabel(fromDate: string | Date, toDate: string | Date): string {
    return `${this.formatShortDate(fromDate)} to ${this.formatShortDate(toDate)}`;
  }

  private formatDisplayTimeRange(startTime: string, endTime: string): string {
    return `${this.trimTimeSeconds(startTime)} - ${this.trimTimeSeconds(endTime)}`;
  }

  private getSwipeRequestDate(item: SwipeRequestApiItem): string {
    return this.normalizeDateValue(item.request_date || item.attendance_date || item.attendanceDate || item.att_date || '');
  }

  private getSwipePunchTime(item: SwipeRequestApiItem): string {
    return this.trimTimeSeconds(`${item.punch_time || item.actual_in || item.actualIn || ''}`);
  }

  private formatShortDate(value: string | Date): string {
    const normalizedValue = this.normalizeDateValue(value);
    if (!normalizedValue) {
      return 'Date not set';
    }

    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) {
      return normalizedValue;
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatHistoryTimestamp(date: Date): string {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatApiTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || 'Date not available';
    }

    return this.formatHistoryTimestamp(date);
  }

  private normalizeRequestStatus(status: string): RequestTableStatus {
    const normalizedStatus = `${status || ''}`.trim().toLowerCase();

    if (normalizedStatus === 'approved') {
      return 'Approved';
    }

    if (normalizedStatus === 'rejected' || normalizedStatus === 'rejeted') {
      return 'Rejected';
    }

    return 'Pending';
  }

  private trimTimeSeconds(value: string): string {
    const rawValue = `${value || ''}`.trim();
    if (!rawValue) {
      return '';
    }

    return rawValue.split(':').slice(0, 2).join(':');
  }

  private stopLocalLoading(): void {
    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = Math.max(0, 900 - elapsed);

    window.setTimeout(() => {
      this.isSubmitting = false;
      this.loadingHeadline = '';
      this.loadingCaption = '';
      this.loadingStartedAt = 0;
    }, remaining);
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

  private syncLeaveDateRange(): void {
    const normalizedFromDate = this.normalizeDateValue(this.leaveForm.fromDate);
    const normalizedToDate = this.normalizeDateValue(this.leaveForm.toDate);

    this.leaveForm.fromDate = normalizedFromDate;

    if (!normalizedFromDate) {
      this.leaveForm.toDate = normalizedToDate;
      return;
    }

    if (!normalizedToDate || normalizedToDate < normalizedFromDate) {
      this.leaveForm.toDate = normalizedFromDate;
      return;
    }

    this.leaveForm.toDate = normalizedToDate;
  }

  private parseDateOnly(value: string | Date): Date | null {
    const normalizedValue = this.normalizeDateValue(value);
    if (!normalizedValue) {
      return null;
    }

    const parsedDate = new Date(`${normalizedValue}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private resolveEmployeeId(): any {
    return this.authService.getID() || '';
  }
}
