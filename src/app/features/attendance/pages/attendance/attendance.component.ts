import { Component } from '@angular/core';

interface AttendanceWorkspaceAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent {
  readonly actions: AttendanceWorkspaceAction[] = [
    {
      title: 'Apply Leave',
      subtitle: 'Create planned leave requests with date, reason, and balance visibility.',
      icon: 'event_available',
      route: '/app/attendance/apply-leave',
    },
    {
      title: 'Regularize Swipe',
      subtitle: 'Correct missed punches or late swipe entries from a clean form page.',
      icon: 'fingerprint',
      route: '/app/attendance/regularize-swipe',
    },
    {
      title: 'Permission Request',
      subtitle: 'Request short-time permission with exact start and end time details.',
      icon: 'verified_user',
      route: '/app/attendance/permission-request',
    },
    {
      title: 'Request OD',
      subtitle: 'Submit on-duty movement for field visits, client meetings, or travel work.',
      icon: 'work_history',
      route: '/app/attendance/request-od',
    },
    {
      title: 'Raise Query',
      subtitle: 'Create attendance or payroll support queries with priority and category.',
      icon: 'support_agent',
      route: '/app/attendance/raise-query',
    },
  ];
}
