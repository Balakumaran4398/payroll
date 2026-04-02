export type AttendanceStatus = 'present' | 'late' | 'absent' | 'on-leave' | 'half-day';
export type AttendanceEventTone = 'success' | 'neutral' | 'warning';
export type AttendanceApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface AttendanceHolidayItem {
  id: number;
  title: string;
  dateLabel: string;
  typeLabel: string;
}

export interface AttendanceEventItem {
  id: number;
  title: string;
  timestamp: string;
  tone: AttendanceEventTone;
}

export interface AttendanceSummaryDay {
  dateLabel: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  overtime: string;
  status: AttendanceStatus;
}

export interface AttendanceRequestCard {
  id: number;
  title: string;
  dateLabel: string;
  subtitle: string;
  duration: string;
  status: AttendanceApprovalStatus;
}

export interface AttendanceLeaveBalance {
  label: string;
  value: string;
  tone: 'primary' | 'danger' | 'success' | 'neutral';
}

export interface AttendanceEmployeeDetail {
  id: number;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  biometricId: string;
  email: string;
  joinDate: string;
  baseSalary: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  hours: string;
  overtime: string;
  presentDays: number;
  lateArrivals: number;
  absences: number;
  onLeave: number;
  overtimeHours: string;
  failedSwipes: number;
  events: AttendanceEventItem[];
  dailySummary: AttendanceSummaryDay[];
  leaveRequests: AttendanceRequestCard[];
  permissions: AttendanceRequestCard[];
  leaveBalance: AttendanceLeaveBalance[];
}

export const ATTENDANCE_REPORT_DATE = '2026-03-12';

export const MOCK_UPCOMING_HOLIDAYS: AttendanceHolidayItem[] = [
  { id: 1, title: 'Holi', dateLabel: 'Sat, Mar 14', typeLabel: 'national' },
  { id: 2, title: 'Good Friday', dateLabel: 'Fri, Apr 10', typeLabel: 'national' },
  { id: 3, title: 'Labour Day', dateLabel: 'Fri, May 1', typeLabel: 'national' },
  { id: 4, title: 'Independence Day', dateLabel: 'Sat, Aug 15', typeLabel: 'national' },
  { id: 5, title: 'Gandhi Jayanti', dateLabel: 'Fri, Oct 2', typeLabel: 'national' },
];

export const MOCK_ATTENDANCE_DETAILS: AttendanceEmployeeDetail[] = [
  {
    id: 1,
    employeeName: 'John Smith',
    employeeCode: 'EMP001',
    designation: 'Senior Developer',
    department: 'Engineering',
    biometricId: 'BI0001',
    email: 'john.smith@company.com',
    joinDate: '15/01/2023',
    baseSalary: '$85,000',
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:15',
    hours: '9.3h',
    overtime: '+0.3h',
    presentDays: 3,
    lateArrivals: 1,
    absences: 1,
    onLeave: 0,
    overtimeHours: '1.3h',
    failedSwipes: 2,
    events: [
      { id: 1, title: 'Check Out', timestamp: 'Thu, Mar 12, 2026 at 18:15', tone: 'neutral' },
      { id: 2, title: 'Check In', timestamp: 'Thu, Mar 12, 2026 at 09:00', tone: 'success' },
      { id: 3, title: 'Check Out', timestamp: 'Wed, Mar 11, 2026 at 18:00', tone: 'neutral' },
      { id: 4, title: 'Check In', timestamp: 'Wed, Mar 11, 2026 at 08:50', tone: 'success' },
      { id: 5, title: 'Check Out', timestamp: 'Tue, Mar 10, 2026 at 18:10', tone: 'neutral' },
      { id: 6, title: 'Check In', timestamp: 'Tue, Mar 10, 2026 at 09:20', tone: 'success' },
    ],
    dailySummary: [
      { dateLabel: 'Mar 12', checkIn: '09:00', checkOut: '18:15', hours: '9.3h', overtime: '+0.3h', status: 'present' },
      { dateLabel: 'Mar 11', checkIn: '08:50', checkOut: '18:00', hours: '9.2h', overtime: '+0.2h', status: 'present' },
      { dateLabel: 'Mar 10', checkIn: '09:20', checkOut: '18:10', hours: '8.8h', overtime: '--', status: 'late' },
    ],
    leaveRequests: [
      { id: 1, title: 'Casual Leave', dateLabel: '2026-03-18 to 2026-03-19', subtitle: 'Wedding ceremony', duration: '2 days', status: 'pending' },
    ],
    permissions: [
      { id: 1, title: 'Early Leave', dateLabel: '2026-03-05 at 16:30', subtitle: 'Medical appointment', duration: '1.5 hours', status: 'approved' },
      { id: 2, title: 'Late Arrival', dateLabel: '2026-03-15 at 10:00', subtitle: 'Car breakdown', duration: '1 hour', status: 'pending' },
    ],
    leaveBalance: [
      { label: 'Casual Leave', value: '10 days', tone: 'primary' },
      { label: 'Sick Leave', value: '7 days', tone: 'danger' },
      { label: 'Paid Leave', value: '15 days', tone: 'success' },
      { label: 'Total Used', value: '8 days', tone: 'neutral' },
    ],
  },
  {
    id: 2,
    employeeName: 'Sarah Johnson',
    employeeCode: 'EMP002',
    designation: 'QA Analyst',
    department: 'Quality',
    biometricId: 'BI0002',
    email: 'sarah.johnson@company.com',
    joinDate: '22/06/2022',
    baseSalary: '$58,000',
    status: 'late',
    checkIn: '09:30',
    checkOut: '18:00',
    hours: '8.5h',
    overtime: '--',
    presentDays: 4,
    lateArrivals: 3,
    absences: 0,
    onLeave: 0,
    overtimeHours: '0.4h',
    failedSwipes: 1,
    events: [
      { id: 1, title: 'Check Out', timestamp: 'Thu, Mar 12, 2026 at 18:00', tone: 'neutral' },
      { id: 2, title: 'Check In', timestamp: 'Thu, Mar 12, 2026 at 09:30', tone: 'warning' },
      { id: 3, title: 'Check Out', timestamp: 'Wed, Mar 11, 2026 at 17:45', tone: 'neutral' },
      { id: 4, title: 'Check In', timestamp: 'Wed, Mar 11, 2026 at 09:18', tone: 'warning' },
    ],
    dailySummary: [
      { dateLabel: 'Mar 12', checkIn: '09:30', checkOut: '18:00', hours: '8.5h', overtime: '--', status: 'late' },
      { dateLabel: 'Mar 11', checkIn: '09:18', checkOut: '17:45', hours: '8.3h', overtime: '--', status: 'late' },
      { dateLabel: 'Mar 10', checkIn: '09:05', checkOut: '18:10', hours: '9.1h', overtime: '+0.1h', status: 'present' },
    ],
    leaveRequests: [],
    permissions: [
      { id: 1, title: 'Late Arrival', dateLabel: '2026-03-12 at 09:30', subtitle: 'School drop', duration: '30 mins', status: 'approved' },
    ],
    leaveBalance: [
      { label: 'Casual Leave', value: '8 days', tone: 'primary' },
      { label: 'Sick Leave', value: '5 days', tone: 'danger' },
      { label: 'Paid Leave', value: '12 days', tone: 'success' },
      { label: 'Total Used', value: '6 days', tone: 'neutral' },
    ],
  },
  {
    id: 3,
    employeeName: 'Michael Chen',
    employeeCode: 'EMP003',
    designation: 'Product Designer',
    department: 'Design',
    biometricId: 'BI0003',
    email: 'michael.chen@company.com',
    joinDate: '11/09/2021',
    baseSalary: '$62,000',
    status: 'on-leave',
    checkIn: '--',
    checkOut: '--',
    hours: '0.0h',
    overtime: '--',
    presentDays: 2,
    lateArrivals: 0,
    absences: 0,
    onLeave: 1,
    overtimeHours: '0.0h',
    failedSwipes: 0,
    events: [
      { id: 1, title: 'Approved Leave', timestamp: 'Thu, Mar 12, 2026 full day', tone: 'warning' },
      { id: 2, title: 'Check Out', timestamp: 'Wed, Mar 11, 2026 at 18:05', tone: 'neutral' },
      { id: 3, title: 'Check In', timestamp: 'Wed, Mar 11, 2026 at 09:02', tone: 'success' },
    ],
    dailySummary: [
      { dateLabel: 'Mar 12', checkIn: '--', checkOut: '--', hours: '0.0h', overtime: '--', status: 'on-leave' },
      { dateLabel: 'Mar 11', checkIn: '09:02', checkOut: '18:05', hours: '9.0h', overtime: '--', status: 'present' },
      { dateLabel: 'Mar 10', checkIn: '08:58', checkOut: '18:00', hours: '9.0h', overtime: '--', status: 'present' },
    ],
    leaveRequests: [
      { id: 1, title: 'Paid Leave', dateLabel: '2026-03-12', subtitle: 'Personal work', duration: '1 day', status: 'approved' },
    ],
    permissions: [],
    leaveBalance: [
      { label: 'Casual Leave', value: '6 days', tone: 'primary' },
      { label: 'Sick Leave', value: '8 days', tone: 'danger' },
      { label: 'Paid Leave', value: '11 days', tone: 'success' },
      { label: 'Total Used', value: '4 days', tone: 'neutral' },
    ],
  },
  {
    id: 4,
    employeeName: 'Emily Davis',
    employeeCode: 'EMP004',
    designation: 'HR Executive',
    department: 'People Operations',
    biometricId: 'BI0004',
    email: 'emily.davis@company.com',
    joinDate: '08/02/2024',
    baseSalary: '$46,000',
    status: 'present',
    checkIn: '08:55',
    checkOut: '17:50',
    hours: '8.9h',
    overtime: '--',
    presentDays: 5,
    lateArrivals: 0,
    absences: 0,
    onLeave: 0,
    overtimeHours: '0.2h',
    failedSwipes: 0,
    events: [
      { id: 1, title: 'Check Out', timestamp: 'Thu, Mar 12, 2026 at 17:50', tone: 'neutral' },
      { id: 2, title: 'Check In', timestamp: 'Thu, Mar 12, 2026 at 08:55', tone: 'success' },
      { id: 3, title: 'Check Out', timestamp: 'Wed, Mar 11, 2026 at 17:58', tone: 'neutral' },
      { id: 4, title: 'Check In', timestamp: 'Wed, Mar 11, 2026 at 08:57', tone: 'success' },
    ],
    dailySummary: [
      { dateLabel: 'Mar 12', checkIn: '08:55', checkOut: '17:50', hours: '8.9h', overtime: '--', status: 'present' },
      { dateLabel: 'Mar 11', checkIn: '08:57', checkOut: '17:58', hours: '9.0h', overtime: '--', status: 'present' },
      { dateLabel: 'Mar 10', checkIn: '08:50', checkOut: '17:40', hours: '8.8h', overtime: '--', status: 'present' },
    ],
    leaveRequests: [],
    permissions: [],
    leaveBalance: [
      { label: 'Casual Leave', value: '12 days', tone: 'primary' },
      { label: 'Sick Leave', value: '8 days', tone: 'danger' },
      { label: 'Paid Leave', value: '16 days', tone: 'success' },
      { label: 'Total Used', value: '2 days', tone: 'neutral' },
    ],
  },
  {
    id: 5,
    employeeName: 'David Martinez',
    employeeCode: 'EMP005',
    designation: 'Sales Manager',
    department: 'Sales',
    biometricId: 'BI0005',
    email: 'david.martinez@company.com',
    joinDate: '19/10/2020',
    baseSalary: '$74,000',
    status: 'absent',
    checkIn: '--',
    checkOut: '--',
    hours: '0.0h',
    overtime: '--',
    presentDays: 3,
    lateArrivals: 2,
    absences: 1,
    onLeave: 0,
    overtimeHours: '0.9h',
    failedSwipes: 1,
    events: [
      { id: 1, title: 'Absent', timestamp: 'Thu, Mar 12, 2026 no biometric punch', tone: 'warning' },
      { id: 2, title: 'Check Out', timestamp: 'Wed, Mar 11, 2026 at 18:30', tone: 'neutral' },
      { id: 3, title: 'Check In', timestamp: 'Wed, Mar 11, 2026 at 09:15', tone: 'success' },
    ],
    dailySummary: [
      { dateLabel: 'Mar 12', checkIn: '--', checkOut: '--', hours: '0.0h', overtime: '--', status: 'absent' },
      { dateLabel: 'Mar 11', checkIn: '09:15', checkOut: '18:30', hours: '9.3h', overtime: '+0.3h', status: 'late' },
      { dateLabel: 'Mar 10', checkIn: '09:05', checkOut: '19:00', hours: '9.9h', overtime: '+0.9h', status: 'present' },
    ],
    leaveRequests: [],
    permissions: [
      { id: 1, title: 'Swipe Regularization', dateLabel: '2026-03-12', subtitle: 'Missed morning punch', duration: 'Pending review', status: 'pending' },
    ],
    leaveBalance: [
      { label: 'Casual Leave', value: '9 days', tone: 'primary' },
      { label: 'Sick Leave', value: '6 days', tone: 'danger' },
      { label: 'Paid Leave', value: '13 days', tone: 'success' },
      { label: 'Total Used', value: '9 days', tone: 'neutral' },
    ],
  },
];
