import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AdminRequestWorkflowKey =
  | 'apply-leave'
  | 'regularize-swipe'
  | 'permission-request'
  | 'request-od'
  | 'raise-query';

export type AdminRequestStatus = 'Pending' | 'Approved' | 'Cancelled';
export type AdminRequesterRole = 'Employee' | 'Manager';
export type AdminRequestPriority = 'High' | 'Medium' | 'Low';

export interface AdminRequestItem {
  id: string;
  workflow: AdminRequestWorkflowKey;
  route: string;
  title: string;
  summary: string;
  requesterName: string;
  requesterRole: AdminRequesterRole;
  department: string;
  requestDate: string;
  submittedAt: string;
  priority: AdminRequestPriority;
  status: AdminRequestStatus;
}

@Injectable({
  providedIn: 'root',
})
export class AdminRequestCenterService {
  private readonly requestsSubject = new BehaviorSubject<AdminRequestItem[]>([
    {
      id: 'REQ-2401',
      workflow: 'apply-leave',
      route: '/app/attendance/apply-leave',
      title: 'Leave Request',
      summary: 'Two-day casual leave submitted for project handoff coverage.',
      requesterName: 'Ava Johnson',
      requesterRole: 'Employee',
      department: 'Engineering',
      requestDate: '2026-03-24',
      submittedAt: 'Today, 09:20 AM',
      priority: 'High',
      status: 'Pending',
    },
    {
      id: 'REQ-2402',
      workflow: 'permission-request',
      route: '/app/attendance/permission-request',
      title: 'Permission Request',
      summary: 'Short permission request for medical appointment during shift.',
      requesterName: 'Rahul Menon',
      requesterRole: 'Employee',
      department: 'Finance',
      requestDate: '2026-03-21',
      submittedAt: 'Today, 10:05 AM',
      priority: 'Medium',
      status: 'Pending',
    },
    {
      id: 'REQ-2403',
      workflow: 'request-od',
      route: '/app/attendance/request-od',
      title: 'On Duty Request',
      summary: 'Client-site review planned by manager for deployment signoff.',
      requesterName: 'Sophia Carter',
      requesterRole: 'Manager',
      department: 'Operations',
      requestDate: '2026-03-22',
      submittedAt: 'Today, 11:10 AM',
      priority: 'High',
      status: 'Pending',
    },
    {
      id: 'REQ-2404',
      workflow: 'regularize-swipe',
      route: '/app/attendance/regularize-swipe',
      title: 'Regularize Swipe',
      summary: 'Missed punch correction requested due to biometric outage.',
      requesterName: 'Daniel Reyes',
      requesterRole: 'Employee',
      department: 'Support',
      requestDate: '2026-03-19',
      submittedAt: 'Yesterday, 04:40 PM',
      priority: 'Low',
      status: 'Pending',
    },
    {
      id: 'REQ-2405',
      workflow: 'raise-query',
      route: '/app/attendance/raise-query',
      title: 'Attendance Query',
      summary: 'Manager raised attendance clarification for payroll mismatch.',
      requesterName: 'Mia Thomas',
      requesterRole: 'Manager',
      department: 'HR',
      requestDate: '2026-03-20',
      submittedAt: 'Yesterday, 02:15 PM',
      priority: 'Medium',
      status: 'Pending',
    },
  ]);

  readonly requests$ = this.requestsSubject.asObservable();

  getSnapshot(): AdminRequestItem[] {
    return this.requestsSubject.value;
  }

  getRequestById(id: string): AdminRequestItem | null {
    return this.requestsSubject.value.find((item) => item.id === id) || null;
  }

  updateStatus(id: string, status: AdminRequestStatus): AdminRequestItem | null {
    let updatedRequest: AdminRequestItem | null = null;
    const next = this.requestsSubject.value.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updatedRequest = {
        ...item,
        status,
      };
      return updatedRequest;
    });

    this.requestsSubject.next(next);
    return updatedRequest;
  }
}
