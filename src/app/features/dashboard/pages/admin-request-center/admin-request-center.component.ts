import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminRequestCenterService, AdminRequestItem } from '../../../../core/services/admin-request-center.service';
import { ApiService } from '../../../../core/services/api.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';

interface AdminStatCard {
  title: string;
  value: string;
  note: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

interface ActivityRow {
  action: string;
  user: string;
  module: string;
  timestamp: string;
  status: 'Success' | 'Pending' | 'Failed';
}

@Component({
  selector: 'app-admin-request-center',
  templateUrl: './admin-request-center.component.html',
  styleUrls: ['./admin-request-center.component.scss'],
})
export class AdminRequestCenterComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private router: Router,
    private requestCenter: AdminRequestCenterService,
    private feedback: UiFeedbackService
  ) {}

  statCards: AdminStatCard[] = [];
  requestNotifications: AdminRequestItem[] = [];
  displayedColumns = ['action', 'user', 'module', 'timestamp', 'status'];
  recentActivity: ActivityRow[] = [
    {
      action: 'Leave request queued',
      user: 'Ava Johnson',
      module: 'Attendance',
      timestamp: '2026-03-20 09:20',
      status: 'Pending',
    },
    {
      action: 'Manager OD request submitted',
      user: 'Sophia Carter',
      module: 'Attendance',
      timestamp: '2026-03-20 11:10',
      status: 'Pending',
    },
    {
      action: 'Company type sync complete',
      user: 'admin',
      module: 'Auth',
      timestamp: '2026-03-20 08:30',
      status: 'Success',
    },
  ];

  ngOnInit(): void {
    this.requestCenter.requests$.subscribe((requests) => {
      this.requestNotifications = requests;
      this.syncStatCards();
      this.syncActivityRows();
    });

    this.loadDashboardData();
  }

  get pendingRequests(): AdminRequestItem[] {
    return this.requestNotifications.filter((item) => item.status === 'Pending');
  }

  get employeeRequestsCount(): number {
    return this.requestNotifications.filter((item) => item.requesterRole === 'Employee').length;
  }

  get managerRequestsCount(): number {
    return this.requestNotifications.filter((item) => item.requesterRole === 'Manager').length;
  }

  get approvedRequestsCount(): number {
    return this.requestNotifications.filter((item) => item.status === 'Approved').length;
  }

  trackByRequestId(_index: number, item: AdminRequestItem): string {
    return item.id;
  }

  openRequestDetails(item: AdminRequestItem): void {
    this.router.navigateByUrl(
      `${item.route}?requestId=${encodeURIComponent(item.id)}&date=${encodeURIComponent(item.requestDate)}&source=admin`
    );
  }

  approveRequest(event: MouseEvent, item: AdminRequestItem): void {
    event.stopPropagation();
    if (item.status === 'Approved') {
      return;
    }

    this.requestCenter.updateStatus(item.id, 'Approved');
    this.feedback.success(`${item.id} approved successfully.`);
  }

  cancelRequest(event: MouseEvent, item: AdminRequestItem): void {
    event.stopPropagation();
    if (item.status === 'Cancelled') {
      return;
    }

    this.requestCenter.updateStatus(item.id, 'Cancelled');
    this.feedback.warning(`${item.id} cancelled.`);
  }

  private syncStatCards(apiStats?: Array<{ title?: string; value?: string; trend?: string; icon?: string }>): void {
    const defaults: AdminStatCard[] = [
      {
        title: 'Pending Requests',
        value: `${this.pendingRequests.length}`,
        note: 'Needs admin review',
        icon: 'notifications_active',
        tone: 'warning',
      },
      {
        title: 'Employee Requests',
        value: `${this.employeeRequestsCount}`,
        note: 'Raised from employee dashboard',
        icon: 'badge',
        tone: 'primary',
      },
      {
        title: 'Manager Requests',
        value: `${this.managerRequestsCount}`,
        note: 'Raised from manager dashboard',
        icon: 'groups',
        tone: 'success',
      },
      {
        title: 'Approved Today',
        value: `${this.approvedRequestsCount}`,
        note: 'Processed by admin',
        icon: 'verified',
        tone: 'danger',
      },
    ];

    if (!apiStats?.length) {
      this.statCards = defaults;
      return;
    }

    this.statCards = defaults.map((fallback, index) => {
      const apiCard = apiStats[index];
      if (!apiCard) {
        return fallback;
      }

      return {
        ...fallback,
        title: apiCard.title || fallback.title,
        value: apiCard.value || fallback.value,
        note: apiCard.trend || fallback.note,
        icon: apiCard.icon || fallback.icon,
      };
    });
  }

  private syncActivityRows(): void {
    const derivedRows: ActivityRow[] = this.requestNotifications.slice(0, 6).map((item) => ({
      action: item.title,
      user: item.requesterName,
      module: item.department,
      timestamp: item.submittedAt,
      status:
        item.status === 'Approved'
          ? 'Success'
          : item.status === 'Cancelled'
            ? 'Failed'
            : 'Pending',
    }));

    this.recentActivity = derivedRows;
  }

  private loadDashboardData(): void {
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        if (!data) {
          return;
        }

        if (Array.isArray(data.stats)) {
          this.syncStatCards(data.stats);
        }

        if (Array.isArray(data.activities) && data.activities.length) {
          this.recentActivity = data.activities;
        }
      },
      error: (error) => {
        console.error('Error loading admin dashboard data:', error);
      },
    });
  }
}
