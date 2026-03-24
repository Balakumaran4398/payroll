import { Component } from '@angular/core';

type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';
type LeaveDashboardTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type LeaveStatusFilter = 'all' | LeaveRequestStatus;
type LeaveTypeTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface LeaveQuickAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

interface LeaveRequestCard {
  reference: string;
  employeeName: string;
  employeeCode: string;
  title: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: LeaveRequestStatus;
  reason: string;
  route: string;
}

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
export class AttendanceComponent {
  readonly statusFilters: Array<{ label: string; value: LeaveStatusFilter }> = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  readonly leaveTypeMeta: Record<string, { tone: LeaveTypeTone }> = {
    'Casual Leave': { tone: 'primary' },
    'Sick Leave': { tone: 'danger' },
    'Comp Off': { tone: 'warning' },
    'Earned Leave': { tone: 'success' },
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

  readonly leaveRequests: LeaveRequestCard[] = [
    {
      reference: 'LR-2031',
      employeeName: 'Michael Chen',
      employeeCode: 'EMP003',
      title: 'Family Function Travel',
      leaveType: 'Casual Leave',
      startDate: '2026-03-12',
      endDate: '2026-03-14',
      duration: '3 days',
      status: 'Approved',
      reason: 'Personal matters',
      route: '/app/attendance/apply-leave',
    },
    {
      reference: 'LR-2032',
      employeeName: 'Sarah Johnson',
      employeeCode: 'EMP002',
      title: 'Medical Consultation',
      leaveType: 'Sick Leave',
      startDate: '2026-03-10',
      endDate: '2026-03-10',
      duration: '1 day',
      status: 'Approved',
      reason: 'Medical appointment',
      route: '/app/attendance/apply-leave',
    },
    {
      reference: 'LR-2033',
      employeeName: 'David Martinez',
      employeeCode: 'EMP005',
      title: 'Family Vacation',
      leaveType: 'Earned Leave',
      startDate: '2026-03-20',
      endDate: '2026-03-25',
      duration: '4 days',
      status: 'Pending',
      reason: 'Family vacation',
      route: '/app/attendance/apply-leave',
    },
    {
      reference: 'LR-2034',
      employeeName: 'Meena S',
      employeeCode: 'EMP014',
      title: 'Weekend Support Offset',
      leaveType: 'Comp Off',
      startDate: '2026-03-22',
      endDate: '2026-03-22',
      duration: '1 day',
      status: 'Pending',
      reason: 'Comp off against Sunday production support',
      route: '/app/attendance/apply-leave',
    },
    {
      reference: 'LR-2035',
      employeeName: 'Naveen P',
      employeeCode: 'EMP021',
      title: 'Medical Leave Recheck',
      leaveType: 'Sick Leave',
      startDate: '2026-03-04',
      endDate: '2026-03-04',
      duration: '1 day',
      status: 'Rejected',
      reason: 'Doctor note required for approval',
      route: '/app/attendance/apply-leave',
    },
  ];

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

  get filteredLeaveRequests(): LeaveRequestCard[] {
    return this.leaveRequests.filter((request) => this.statusFilter === 'all' || request.status === this.statusFilter);
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
        label: 'Leave Types',
        value: `${uniqueTypes}`,
        caption: 'Casual, sick, comp off, earned and more',
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

  getLeaveTypeTone(leaveType: string): LeaveTypeTone {
    return this.leaveTypeMeta[leaveType]?.tone || 'primary';
  }

  showDecisionActions(request: LeaveRequestCard): boolean {
    return request.status === 'Pending';
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
}
