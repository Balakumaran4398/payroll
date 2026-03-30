import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from 'src/app/core/services/api.service';
import { AppRole, AuthService } from 'src/app/core/services/auth.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { LeaveRequestFormDialogComponent } from '../../components/leave-request-form-dialog/leave-request-form-dialog.component';
import { OnDutyRequestFormDialogComponent } from '../../components/onduty-request-form-dialog/onduty-request-form-dialog.component';
import { PermissionEditDialogComponent } from '../../components/permission-edit-dialog/permission-edit-dialog.component';
import { SwipeRequestEditDialogComponent } from '../../components/swipe-request-edit-dialog/swipe-request-edit-dialog.component';

type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';
type LeaveDashboardTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type LeaveStatusFilter = 'all' | LeaveRequestStatus;
type LeaveTypeTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type AttendanceRequestType = 'leave' | 'onduty' | 'permission' | 'swipe';
type AttendanceRequestTypeFilter = 'all' | AttendanceRequestType;

interface LeaveQuickAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

interface LeaveTypeOption {
  id: number;
  leave_type: string;
  leave_code: string;
  isactive: boolean;
  createddate: string;
}

interface AttendanceAllRequestLeaveItem {
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
  employee_name?: string;
}

interface AttendanceAllRequestOnDutyItem {
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
  approved_by: number | string;
  no_of_days: number;
  approved_status: string;
  created_date: string;
  updated_date: string;
  employee_name?: string;
}

interface AttendanceAllRequestPermissionItem {
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
  createddate: string | null;
  updateddate: string;
  employee_name?: string;
}

interface AttendanceAllRequestSwipeItem {
  id: number;
  empid: number;
  request_date: string;
  mode: string;
  punch_time: string;
  reason: string;
  status: string;
  approved_by: number | string | null;
  isactive: boolean;
  isdelete: boolean;
  manager_approval?: boolean;
  admin_approval?: boolean;
  createddate: string | null;
  updateddate: string;
  employee_name?: string;
}

interface AttendanceAllRequestResponse {
  leave?: {
    approved?: AttendanceAllRequestLeaveItem[];
    rejected?: AttendanceAllRequestLeaveItem[];
    pending?: AttendanceAllRequestLeaveItem[];
  };
  onduty?: {
    approved?: AttendanceAllRequestOnDutyItem[];
    rejected?: AttendanceAllRequestOnDutyItem[];
    pending?: AttendanceAllRequestOnDutyItem[];
  };
  permission?: {
    approved?: AttendanceAllRequestPermissionItem[];
    rejected?: AttendanceAllRequestPermissionItem[];
    pending?: AttendanceAllRequestPermissionItem[];
  };
  swipe?: {
    approved?: AttendanceAllRequestSwipeItem[];
    rejected?: AttendanceAllRequestSwipeItem[];
    pending?: AttendanceAllRequestSwipeItem[];
  };
  data?: AttendanceAllRequestResponse;
  result?: AttendanceAllRequestResponse;
}

interface LeaveRequestCard {
  reference: string;
  employeeName: string;
  employeeCode: string;
  requestCategoryLabel: string;
  title: string;
  leaveType: string;
  detailOneLabel: string;
  detailOneValue: string;
  detailTwoLabel: string;
  detailTwoValue: string;
  detailThreeLabel: string;
  detailThreeValue: string;
  status: LeaveRequestStatus;
  reason: string;
  route: string;
  requestType: AttendanceRequestType;
  rawItem: AttendanceAllRequestLeaveItem | AttendanceAllRequestOnDutyItem | AttendanceAllRequestPermissionItem | AttendanceAllRequestSwipeItem;
  managerApproval: boolean;
  adminApproval: boolean;
}

type AttendanceRequestListItem =
  | { item: AttendanceAllRequestLeaveItem; bucket: LeaveRequestStatus | null; requestType: 'leave'; sortDate: string }
  | { item: AttendanceAllRequestOnDutyItem; bucket: LeaveRequestStatus | null; requestType: 'onduty'; sortDate: string }
  | { item: AttendanceAllRequestPermissionItem; bucket: LeaveRequestStatus | null; requestType: 'permission'; sortDate: string }
  | { item: AttendanceAllRequestSwipeItem; bucket: LeaveRequestStatus | null; requestType: 'swipe'; sortDate: string };

interface LeaveBalanceCard {
  code: string;
  label: string;
  used: number;
  total: number;
  carry: string;
  note: string;
  tone: LeaveTypeTone;
}

interface LeaveDashboardStat {
  label: string;
  value: string;
  caption: string;
  icon: string;
  tone: LeaveDashboardTone;
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit {
  readonly workflowSourceRoute = '/app/attendance';
  readonly statusFilters: Array<{ label: string; value: LeaveStatusFilter }> = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  readonly requestTypeFilters: Array<{ label: string; value: AttendanceRequestTypeFilter }> = [
    { label: 'All Types', value: 'all' },
    { label: 'Leave', value: 'leave' },
    { label: 'On Duty', value: 'onduty' },
    { label: 'Permission', value: 'permission' },
    { label: 'Swipe', value: 'swipe' },
  ];

  readonly leaveTypeMeta: Record<string, { tone: LeaveTypeTone }> = {
    CL: { tone: 'primary' },
    'Casual Leave': { tone: 'primary' },
    SL: { tone: 'danger' },
    'Sick Leave': { tone: 'danger' },
    CO: { tone: 'warning' },
    'Comp Off': { tone: 'warning' },
    EL: { tone: 'success' },
    'Earned Leave': { tone: 'success' },
    LWP: { tone: 'info' },
    'On Duty': { tone: 'info' },
    Permission: { tone: 'warning' },
    Swipe: { tone: 'danger' },
    Leave: { tone: 'primary' },
  };

  readonly quickActions: LeaveQuickAction[] = [
    {
      title: 'Holiday Calendar',
      subtitle: 'Check holidays and weekly offs before approving longer leave blocks.',
      icon: 'calendar_month',
      route: '/app/company',
    },
    {
      title: 'Reports',
      subtitle: 'Compare leave movement with attendance and payroll reports.',
      icon: 'insights',
      route: '/app/reports',
    },
  ];

  leaveRequests: LeaveRequestCard[] = [];
  requestsLoading = false;
  leaveTypes: LeaveTypeOption[] = [];

  readonly leaveBalances: LeaveBalanceCard[] = [
    {
      code: 'CL',
      label: 'Casual Leave',
      used: 5,
      total: 12,
      carry: '2 carry-forward days',
      note: 'Best used for personal plans and short notice needs.',
      tone: 'primary',
    },
    {
      code: 'SL',
      label: 'Sick Leave',
      used: 2,
      total: 8,
      carry: 'No carry-forward',
      note: 'Attach doctor notes when policy rules require proof.',
      tone: 'success',
    },
    {
      code: 'CO',
      label: 'Comp Off',
      used: 1,
      total: 3,
      carry: 'Valid this quarter',
      note: 'Apply against approved overtime or weekend work.',
      tone: 'warning',
    },
    {
      code: 'EL',
      label: 'Earned Leave',
      used: 6,
      total: 18,
      carry: 'As per policy cycle',
      note: 'Ideal for longer trips and scheduled annual breaks.',
      tone: 'info',
    },
  ];

  statusFilter: LeaveStatusFilter = 'all';
  requestTypeFilter: AttendanceRequestTypeFilter = 'all';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private feedback: UiFeedbackService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.loadAllRequests();
  }

  get filteredLeaveRequests(): LeaveRequestCard[] {
    return this.leaveRequests.filter((request) => {
      const matchesStatus = this.statusFilter === 'all' || request.status === this.statusFilter;
      const matchesType = this.requestTypeFilter === 'all' || request.requestType === this.requestTypeFilter;
      return matchesStatus && matchesType;
    });
  }

  get dashboardStats(): LeaveDashboardStat[] {
    const totalRequests = this.leaveRequests.length;
    const approvedRequests = this.leaveRequests.filter((request) => request.status === 'Approved').length;
    const pendingRequests = this.leaveRequests.filter((request) => request.status === 'Pending').length;
    const rejectedRequests = this.leaveRequests.filter((request) => request.status === 'Rejected').length;
    const uniqueTypes = new Set(this.leaveRequests.map((request) => request.leaveType)).size;

    return [
      {
        label: 'Total Requests',
        value: `${totalRequests}`,
        caption: 'Live request cards in the review queue',
        icon: 'assignment',
        tone: 'primary',
      },
      {
        label: 'Pending',
        value: `${pendingRequests}`,
        caption: 'Still waiting for approval movement',
        icon: 'hourglass_top',
        tone: 'warning',
      },
      {
        label: 'Approved',
        value: `${approvedRequests}`,
        caption: 'Already cleared for this cycle',
        icon: 'task_alt',
        tone: 'success',
      },
      {
        label: 'Request Types',
        value: `${uniqueTypes}`,
        caption: 'Leave and on-duty request categories in the list',
        icon: 'category',
        tone: 'info',
      },
      {
        label: 'Rejected',
        value: `${rejectedRequests}`,
        caption: 'Need correction or supporting proof',
        icon: 'cancel',
        tone: 'danger',
      },
    ];
  }

  get activeStatusLabel(): string {
    return this.statusFilters.find((option) => option.value === this.statusFilter)?.label || 'All Status';
  }

  get activeRequestTypeLabel(): string {
    return this.requestTypeFilters.find((option) => option.value === this.requestTypeFilter)?.label || 'All Types';
  }

  get currentRole(): AppRole | null {
    return this.authService.getRole();
  }

  get canManageLeaveDesk(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_MANAGER' || this.currentRole === 'ROLE_COMPANY';
  }

  buildRouteState(route: string): { from: string } | null {
    return this.isWorkflowRoute(route) ? { from: this.workflowSourceRoute } : null;
  }

  get leaveDeskTitle(): string {
    return this.canManageLeaveDesk ? 'Manager Leave Desk' : 'Leave Desk';
  }

  getLeaveTypeTone(leaveType: string): LeaveTypeTone {
    return this.leaveTypeMeta[leaveType]?.tone || 'primary';
  }

  showDecisionActions(request: LeaveRequestCard): boolean {
    return request.status === 'Pending'
      && ['leave', 'onduty', 'permission', 'swipe'].includes(request.requestType)
      && this.canApproveRequest(request);
  }

  openDecisionDialog(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): void {
    if (!this.canApproveRequest(request)) {
      this.feedback.warning('Only manager or admin roles can review this request.');
      return;
    }

    if (request.requestType === 'onduty') {
      this.openOnDutyDecisionDialog(request, decision);
      return;
    }

    if (request.requestType === 'permission') {
      this.openPermissionDecisionDialog(request, decision);
      return;
    }

    if (request.requestType === 'swipe') {
      this.openSwipeDecisionDialog(request, decision);
      return;
    }

    this.openLeaveDecisionDialog(request, decision);
  }

  getBalanceAvailable(balance: LeaveBalanceCard): number {
    return Math.max(balance.total - balance.used, 0);
  }

  getBalanceUsagePercent(balance: LeaveBalanceCard): number {
    if (!balance.total) {
      return 0;
    }

    return Math.min(Math.round((balance.used / balance.total) * 100), 100);
  }

  private loadAllRequests(): void {
    const employeeId = Number(this.authService.getID() || 0);
    if (!employeeId) {
      this.leaveRequests = [];
      return;
    }

    this.requestsLoading = true;
    this.apiService.getAllrequests(employeeId).subscribe({
      next: (data: any) => {
        this.leaveRequests = this.extractLeaveRequestCards(data);
        this.requestsLoading = false;
      },
      error: () => {
        this.leaveRequests = [];
        this.requestsLoading = false;
        this.feedback.error('Failed to load leave requests.');
      },
    });
  }

  private extractLeaveRequestCards(data: any): LeaveRequestCard[] {
    const requests: AttendanceRequestListItem[] = [
      ...this.extractGroupedLeaveRequests(data),
      ...this.extractGroupedOnDutyRequests(data),
      ...this.extractGroupedPermissionRequests(data),
      ...this.extractGroupedSwipeRequests(data),
    ];

    return requests
      .filter(({ item }) => !!item && item.isdelete !== true)
      .sort((left, right) => this.getRequestSortValue(right.sortDate) - this.getRequestSortValue(left.sortDate))
      .map((request) =>
        request.requestType === 'onduty'
          ? this.mapOnDutyRequestCard(request.item, request.bucket)
          : request.requestType === 'permission'
            ? this.mapPermissionRequestCard(request.item, request.bucket)
            : request.requestType === 'swipe'
              ? this.mapSwipeRequestCard(request.item, request.bucket)
              : this.mapLeaveRequestCard(request.item, request.bucket)
      );
  }

  private extractGroupedLeaveRequests(data: any): Array<{ item: AttendanceAllRequestLeaveItem; bucket: LeaveRequestStatus | null; requestType: 'leave'; sortDate: string }> {
    const source = (data?.data && !Array.isArray(data.data) ? data.data : data) as AttendanceAllRequestResponse | null | undefined;
    const leaveSource = source?.leave;
    const buckets: Array<{ key: 'pending' | 'approved' | 'rejected'; status: LeaveRequestStatus }> = [
      { key: 'pending', status: 'Pending' },
      { key: 'approved', status: 'Approved' },
      { key: 'rejected', status: 'Rejected' },
    ];

    return buckets.reduce((all, bucket) => {
      const bucketItems = leaveSource?.[bucket.key];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({
        item,
        bucket: bucket.status,
        requestType: 'leave' as const,
        sortDate: item.createddate || item.updateddate || '',
      })));
    }, [] as Array<{ item: AttendanceAllRequestLeaveItem; bucket: LeaveRequestStatus | null; requestType: 'leave'; sortDate: string }>);
  }

  private extractGroupedOnDutyRequests(data: any): Array<{ item: AttendanceAllRequestOnDutyItem; bucket: LeaveRequestStatus | null; requestType: 'onduty'; sortDate: string }> {
    const source = (data?.data && !Array.isArray(data.data) ? data.data : data) as AttendanceAllRequestResponse | null | undefined;
    const onDutySource = source?.onduty;
    const buckets: Array<{ key: 'pending' | 'approved' | 'rejected'; status: LeaveRequestStatus }> = [
      { key: 'pending', status: 'Pending' },
      { key: 'approved', status: 'Approved' },
      { key: 'rejected', status: 'Rejected' },
    ];

    return buckets.reduce((all, bucket) => {
      const bucketItems = onDutySource?.[bucket.key];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({
        item,
        bucket: bucket.status,
        requestType: 'onduty' as const,
        sortDate: item.created_date || item.updated_date || '',
      })));
    }, [] as Array<{ item: AttendanceAllRequestOnDutyItem; bucket: LeaveRequestStatus | null; requestType: 'onduty'; sortDate: string }>);
  }

  private extractGroupedPermissionRequests(data: any): Array<{ item: AttendanceAllRequestPermissionItem; bucket: LeaveRequestStatus | null; requestType: 'permission'; sortDate: string }> {
    const source = (data?.data && !Array.isArray(data.data) ? data.data : data) as AttendanceAllRequestResponse | null | undefined;
    const permissionSource = source?.permission;
    const buckets: Array<{ key: 'pending' | 'approved' | 'rejected'; status: LeaveRequestStatus }> = [
      { key: 'pending', status: 'Pending' },
      { key: 'approved', status: 'Approved' },
      { key: 'rejected', status: 'Rejected' },
    ];

    return buckets.reduce((all, bucket) => {
      const bucketItems = permissionSource?.[bucket.key];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({
        item,
        bucket: bucket.status,
        requestType: 'permission' as const,
        sortDate: item.createddate || item.updateddate || '',
      })));
    }, [] as Array<{ item: AttendanceAllRequestPermissionItem; bucket: LeaveRequestStatus | null; requestType: 'permission'; sortDate: string }>);
  }

  private extractGroupedSwipeRequests(data: any): Array<{ item: AttendanceAllRequestSwipeItem; bucket: LeaveRequestStatus | null; requestType: 'swipe'; sortDate: string }> {
    const source = (data?.data && !Array.isArray(data.data) ? data.data : data) as AttendanceAllRequestResponse | null | undefined;
    const swipeSource = source?.swipe;
    const buckets: Array<{ key: 'pending' | 'approved' | 'rejected'; status: LeaveRequestStatus }> = [
      { key: 'pending', status: 'Pending' },
      { key: 'approved', status: 'Approved' },
      { key: 'rejected', status: 'Rejected' },
    ];

    return buckets.reduce((all, bucket) => {
      const bucketItems = swipeSource?.[bucket.key];
      if (!Array.isArray(bucketItems)) {
        return all;
      }

      return all.concat(bucketItems.map((item) => ({
        item,
        bucket: bucket.status,
        requestType: 'swipe' as const,
        sortDate: item.createddate || item.updateddate || '',
      })));
    }, [] as Array<{ item: AttendanceAllRequestSwipeItem; bucket: LeaveRequestStatus | null; requestType: 'swipe'; sortDate: string }>);
  }

  private mapLeaveRequestCard(item: AttendanceAllRequestLeaveItem, bucket: LeaveRequestStatus | null): LeaveRequestCard {
    const leaveType = this.resolveLeaveTypeLabel(item.leave_type_id);
    const status = this.normalizeLeaveRequestStatus(item.status, item.isactive, item.isdelete, bucket);
    const employeeName = `${item.employee_name || `Employee #${item.empid || ''}`}`.trim();

    return {
      reference: `LR-${item.id}`,
      employeeName,
      employeeCode: this.buildEmployeeCode(item.empid),
      requestCategoryLabel: 'Leave',
      title: `${leaveType} Request`,
      leaveType,
      detailOneLabel: 'Start Date',
      detailOneValue: item.fromdate || '',
      detailTwoLabel: 'End Date',
      detailTwoValue: item.todate || '',
      detailThreeLabel: 'Duration',
      detailThreeValue: this.formatLeaveDuration(item.totaldays),
      status,
      reason: `${item.reason || ''}`.trim() || 'Leave request',
      route: '/app/attendance/apply-leave',
      requestType: 'leave',
      rawItem: item,
      managerApproval: this.toBooleanValue(item.manager_approval, false),
      adminApproval: this.toBooleanValue(item.admin_approval, false),
    };
  }

  private mapOnDutyRequestCard(item: AttendanceAllRequestOnDutyItem, bucket: LeaveRequestStatus | null): LeaveRequestCard {
    const status = this.normalizeLeaveRequestStatus(item.approved_status, item.isactive, item.isdelete, bucket);
    const employeeName = `${item.employee_name || `Employee #${item.empid || ''}`}`.trim();
    const purpose = `${item.purpose_of_visit || ''}`.trim();
    const place = `${item.place_of_visit || ''}`.trim();
    const comments = `${item.comments || ''}`.trim();

    return {
      reference: `OD-${item.id}`,
      employeeName,
      employeeCode: this.buildEmployeeCode(item.empid),
      requestCategoryLabel: 'On Duty',
      title: purpose || 'On Duty Request',
      leaveType: 'On Duty',
      detailOneLabel: 'From Date',
      detailOneValue: item.from_date || '',
      detailTwoLabel: 'To Date',
      detailTwoValue: item.to_date || '',
      detailThreeLabel: 'Duration',
      detailThreeValue: this.formatLeaveDuration(item.no_of_days),
      status,
      reason: [purpose, place, comments].filter(Boolean).join(' | ') || 'On duty request',
      route: '/app/attendance/request-od',
      requestType: 'onduty',
      rawItem: item,
      managerApproval: this.toBooleanValue(item.manager_approval, false),
      adminApproval: this.toBooleanValue(item.admin_approval, false),
    };
  }

  private mapPermissionRequestCard(item: AttendanceAllRequestPermissionItem, bucket: LeaveRequestStatus | null): LeaveRequestCard {
    const status = this.normalizeLeaveRequestStatus(item.status, item.isactive, item.isdelete, bucket);
    const employeeName = `${item.employee_name || `Employee #${item.empid || ''}`}`.trim();
    const mode = `${item.mode || ''}`.trim() || 'Permission';

    return {
      reference: `PR-${item.id}`,
      employeeName,
      employeeCode: this.buildEmployeeCode(item.empid),
      requestCategoryLabel: 'Permission',
      title: 'Permission Request',
      leaveType: mode,
      detailOneLabel: 'Request Date',
      detailOneValue: item.request_date || '',
      detailTwoLabel: 'Start Time',
      detailTwoValue: this.trimTimeSeconds(item.starttime),
      detailThreeLabel: 'End Time',
      detailThreeValue: this.trimTimeSeconds(item.endtime),
      status,
      reason: `${item.reason || ''}`.trim() || 'Permission request',
      route: '/app/attendance/permission-request',
      requestType: 'permission',
      rawItem: item,
      managerApproval: this.toBooleanValue(item.manager_approval, false),
      adminApproval: this.toBooleanValue(item.admin_approval, false),
    };
  }

  private mapSwipeRequestCard(item: AttendanceAllRequestSwipeItem, bucket: LeaveRequestStatus | null): LeaveRequestCard {
    const status = this.normalizeLeaveRequestStatus(item.status, item.isactive, item.isdelete, bucket);
    const employeeName = `${item.employee_name || `Employee #${item.empid || ''}`}`.trim();
    const mode = `${item.mode || ''}`.trim() || 'Swipe';

    return {
      reference: `SW-${item.id}`,
      employeeName,
      employeeCode: this.buildEmployeeCode(item.empid),
      requestCategoryLabel: 'Swipe',
      title: 'Swipe Request',
      leaveType: mode,
      detailOneLabel: 'Request Date',
      detailOneValue: item.request_date || '',
      detailTwoLabel: 'Punch Type',
      detailTwoValue: mode,
      detailThreeLabel: 'Punch Time',
      detailThreeValue: this.trimTimeSeconds(item.punch_time),
      status,
      reason: `${item.reason || ''}`.trim() || 'Swipe request',
      route: '/app/attendance/regularize-swipe',
      requestType: 'swipe',
      rawItem: item,
      managerApproval: this.toBooleanValue(item.manager_approval, false),
      adminApproval: this.toBooleanValue(item.admin_approval, false),
    };
  }

  private normalizeLeaveRequestStatus(statusValue: string, isactive: boolean, isdelete: boolean, bucket: LeaveRequestStatus | null): LeaveRequestStatus {
    if (bucket) {
      return bucket;
    }

    if (isdelete === true || isactive === false) {
      return 'Rejected';
    }

    const normalizedStatus = `${statusValue || ''}`.trim().toLowerCase();
    if (normalizedStatus === 'approved') {
      return 'Approved';
    }

    if (normalizedStatus === 'rejected' || normalizedStatus === 'rejeted') {
      return 'Rejected';
    }

    return 'Pending';
  }

  private loadLeaveTypes(): void {
    if (!this.canManageLeaveDesk) {
      this.leaveTypes = this.getFallbackLeaveTypes();
      return;
    }

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

        if (!this.leaveTypes.length) {
          this.leaveTypes = this.getFallbackLeaveTypes();
        }
      },
      error: () => {
        this.leaveTypes = this.getFallbackLeaveTypes();
      },
    });
  }

  private openLeaveDecisionDialog(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): void {
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
        request: this.buildLeaveDialogRequest(request, decision),
        leaveTypes: this.leaveTypes.length ? this.leaveTypes : this.getFallbackLeaveTypes(),
        canApprove: this.canApproveRequest(request),
        currentRole: this.currentRole,
      },
    });

    dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
      if (!result) {
        return;
      }

      this.loadAllRequests();
      this.feedback.success(result.message || 'Leave request updated successfully.');
    });
  }

  private openOnDutyDecisionDialog(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): void {
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
        request: this.buildOnDutyDialogRequest(request, decision),
        canApprove: this.canApproveRequest(request),
        currentRole: this.currentRole,
      },
    });

    dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
      if (!result) {
        return;
      }

      this.loadAllRequests();
      this.feedback.success(result.message || 'OD request updated successfully.');
    });
  }

  private openPermissionDecisionDialog(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): void {
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
        request: this.buildPermissionDialogRequest(request, decision),
        canApprove: this.canApproveRequest(request),
        currentRole: this.currentRole,
      },
    });

    dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
      if (!result) {
        return;
      }

      this.loadAllRequests();
      this.feedback.success(result.message || 'Permission request updated successfully.');
    });
  }

  private openSwipeDecisionDialog(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): void {
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
        request: this.buildSwipeDialogRequest(request, decision),
        canApprove: this.canApproveRequest(request),
        currentRole: this.currentRole,
      },
    });

    dialogRef.afterClosed().subscribe((result?: { message?: string }) => {
      if (!result) {
        return;
      }

      this.loadAllRequests();
      this.feedback.success(result.message || 'Swipe request updated successfully.');
    });
  }

  private buildLeaveDialogRequest(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): any {
    const item = request.rawItem as AttendanceAllRequestLeaveItem;
    const leaveTypeId = Number(item.leave_type_id || 0);
    const matchedLeaveType = this.leaveTypes.find((type) => Number(type.id || 0) === leaveTypeId);
    const leaveTypeCode = matchedLeaveType?.leave_code || this.resolveLeaveTypeLabel(leaveTypeId);
    const leaveTypeLabel = matchedLeaveType?.leave_type || leaveTypeCode;

    return {
      ...item,
      id: Number(item.id || 0),
      empid: Number(item.empid || 0),
      employee_name: `${item.employee_name || request.employeeName || ''}`.trim(),
      fromDate: item.fromdate || '',
      toDate: item.todate || '',
      startDay: `${item.leave_mode || ''}`.trim().toLowerCase() === 'full' ? 'full' : 'half',
      endDay: `${item.leave_mode || ''}`.trim().toLowerCase() === 'second_half' ? 'second_half' : 'first_half',
      leaveType: leaveTypeCode,
      leave_type_id: leaveTypeId,
      leave_type_label: leaveTypeLabel,
      reason: item.reason || '',
      leave_mode: item.leave_mode || 'full',
      totaldays: Number(item.totaldays || 0),
      doc_url: item.doc_url || '',
      filename: item.filename || '',
      status: item.status || request.status,
      approved_status: decision,
      approved_by: item.approved_by ?? null,
      isapproved: decision === 'Approved',
      isactive: this.toBooleanValue(item.isactive, true),
      isdelete: this.toBooleanValue(item.isdelete, false),
      manager_approval: this.toBooleanValue(item.manager_approval, false),
      admin_approval: this.toBooleanValue(item.admin_approval, false),
      display_id: request.reference,
      request_type: request.title,
    };
  }

  private buildOnDutyDialogRequest(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): any {
    const item = request.rawItem as AttendanceAllRequestOnDutyItem;

    return {
      id: Number(item.id || 0),
      empid: Number(item.empid || 0),
      employee_name: item.employee_name || request.employeeName,
      from_date: item.from_date || '',
      to_date: item.to_date || '',
      place_of_visit: item.place_of_visit || '',
      purpose_of_visit: item.purpose_of_visit || '',
      comments: item.comments || '',
      approved_by: item.approved_by || '',
      manager_approval: this.toBooleanValue(item.manager_approval, false),
      admin_approval: this.toBooleanValue(item.admin_approval, false),
      isactive: this.toBooleanValue(item.isactive, true),
      isdelete: this.toBooleanValue(item.isdelete, false),
      approved_status: decision,
      isapproved: decision === 'Approved',
      no_of_days: Number(item.no_of_days || 0),
      created_date: item.created_date || '',
      updated_date: item.updated_date || '',
      display_id: request.reference,
      display_status: request.status,
      request_type: request.title,
    };
  }

  private buildPermissionDialogRequest(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): any {
    const item = request.rawItem as AttendanceAllRequestPermissionItem;

    return {
      id: Number(item.id || 0),
      empid: Number(item.empid || 0),
      employee_name: item.employee_name || request.employeeName,
      request_date: item.request_date || '',
      mode: `${item.mode || ''}`.trim(),
      starttime: this.trimTimeSeconds(item.starttime),
      endtime: this.trimTimeSeconds(item.endtime),
      reason: `${item.reason || ''}`.trim(),
      status: item.status || request.status,
      approved_status: decision,
      approved_by: item.approved_by ?? null,
      isapproved: decision === 'Approved',
      isactive: this.toBooleanValue(item.isactive, true),
      isdelete: this.toBooleanValue(item.isdelete, false),
      manager_approval: this.toBooleanValue(item.manager_approval, false),
      admin_approval: this.toBooleanValue(item.admin_approval, false),
      request_type: request.title,
    };
  }

  private buildSwipeDialogRequest(request: LeaveRequestCard, decision: 'Approved' | 'Rejected'): any {
    const item = request.rawItem as AttendanceAllRequestSwipeItem;

    return {
      id: Number(item.id || 0),
      empid: Number(item.empid || 0),
      employee_name: item.employee_name || request.employeeName,
      request_date: item.request_date || '',
      mode: `${item.mode || ''}`.trim(),
      punch_time: this.trimTimeSeconds(item.punch_time),
      reason: `${item.reason || ''}`.trim(),
      status: item.status || request.status,
      approved_status: decision,
      approved_by: item.approved_by ?? null,
      isapproved: decision === 'Approved',
      isactive: this.toBooleanValue(item.isactive, true),
      isdelete: this.toBooleanValue(item.isdelete, false),
      manager_approval: this.toBooleanValue(item.manager_approval, false),
      admin_approval: this.toBooleanValue(item.admin_approval, false),
      request_type: request.title,
    };
  }

  private canApproveRequest(request: LeaveRequestCard): boolean {
    if (request.status !== 'Pending') {
      return false;
    }

    if (this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY') {
      return true;
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return !this.isOwnRequest(request);
    }

    return false;
  }

  private isOwnRequest(request: LeaveRequestCard): boolean {
    const currentEmployeeId = Number(this.authService.getID() || 0);
    const requestEmployeeId = Number(request.rawItem?.empid || 0);
    return !!currentEmployeeId && currentEmployeeId === requestEmployeeId;
  }

  private getFallbackLeaveTypes(): LeaveTypeOption[] {
    return [
      { id: 1, leave_type: 'Casual Leave', leave_code: 'CL', isactive: true, createddate: '' },
      { id: 2, leave_type: 'Sick Leave', leave_code: 'SL', isactive: true, createddate: '' },
      { id: 3, leave_type: 'Leave Without Pay', leave_code: 'LWP', isactive: true, createddate: '' },
    ];
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
    return ['true', '1', 'yes', 'y'].includes(normalizedValue);
  }

  private resolveLeaveTypeLabel(leaveTypeId: number): string {
    switch (Number(leaveTypeId || 0)) {
      case 1:
        return 'CL';
      case 2:
        return 'SL';
      case 3:
        return 'LWP';
      case 4:
        return 'CO';
      case 5:
        return 'EL';
      default:
        return 'Leave';
    }
  }

  private formatLeaveDuration(totalDays: number): string {
    const days = Number(totalDays || 0);
    if (!days) {
      return '0 day';
    }

    return `${days} day${days === 1 ? '' : 's'}`;
  }

  private trimTimeSeconds(value: string): string {
    const rawValue = `${value || ''}`.trim();
    if (!rawValue) {
      return '';
    }

    return rawValue.split(':').slice(0, 2).join(':');
  }

  private buildEmployeeCode(empid: number): string {
    const numericId = Number(empid || 0);
    if (!numericId) {
      return 'EMP';
    }

    return `EMP${`${numericId}`.padStart(3, '0')}`;
  }

  private getRequestSortValue(value: string): number {
    const parsedTime = Date.parse(value || '');
    return Number.isNaN(parsedTime) ? 0 : parsedTime;
  }

  private isWorkflowRoute(route: string): boolean {
    return route === '/app/attendance/apply-leave'
      || route === '/app/attendance/request-od'
      || route === '/app/attendance/permission-request'
      || route === '/app/attendance/regularize-swipe';
  }
}
