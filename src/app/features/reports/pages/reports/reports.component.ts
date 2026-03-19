import { Component } from '@angular/core';

interface ReportMetric {
  label: string;
  value: string;
  trend: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

interface AttendanceReportRow {
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  selectedMonth = 'March 2026';

  readonly reportMetrics: ReportMetric[] = [
    { label: 'Present Days', value: '18', trend: '+2 vs last month', tone: 'success' },
    { label: 'Late Entries', value: '3', trend: '-1 improvement', tone: 'warning' },
    { label: 'Leave Days', value: '2', trend: 'Approved requests', tone: 'primary' },
    { label: 'Missed Punches', value: '1', trend: 'Needs review', tone: 'danger' },
  ];

  readonly weeklyHours = [
    { label: 'Week 1', hours: 38 },
    { label: 'Week 2', hours: 42 },
    { label: 'Week 3', hours: 40 },
    { label: 'Week 4', hours: 44 },
  ];

  readonly reportRows: AttendanceReportRow[] = [
    { date: 'Mar 03, 2026', status: 'Present', checkIn: '09:02 AM', checkOut: '06:04 PM', totalHours: '08h 41m' },
    { date: 'Mar 04, 2026', status: 'Late', checkIn: '09:26 AM', checkOut: '06:11 PM', totalHours: '08h 05m' },
    { date: 'Mar 05, 2026', status: 'Present', checkIn: '08:58 AM', checkOut: '06:00 PM', totalHours: '08h 47m' },
    { date: 'Mar 06, 2026', status: 'Leave', checkIn: '--', checkOut: '--', totalHours: 'Full Day' },
    { date: 'Mar 07, 2026', status: 'Present', checkIn: '09:05 AM', checkOut: '05:52 PM', totalHours: '08h 18m' },
  ];

  get maxWeeklyHours(): number {
    return Math.max(...this.weeklyHours.map((week) => week.hours), 1);
  }

  getWeeklyBarWidth(hours: number): number {
    return Math.max((hours / this.maxWeeklyHours) * 100, 20);
  }
}
