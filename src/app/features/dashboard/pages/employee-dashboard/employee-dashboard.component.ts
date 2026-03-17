import { Component } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label, SingleDataSet } from 'ng2-charts';

interface ActivityRow {
  action: string;
  user: string;
  module: string;
  timestamp: string;
  status: 'Success' | 'Pending' | 'Failed';
}

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss'],
})
export class EmployeeDashboardComponent {
  statCards = [
    { title: 'My Attendance', value: '94.2%', trend: '+2.1%', icon: 'check_circle' },
    { title: 'Working Hours', value: '168h', trend: 'This Month', icon: 'schedule' },
    { title: 'Leave Balance', value: '12 days', trend: 'Available', icon: 'beach_access' },
    { title: 'Pending Tasks', value: '3', trend: 'Due Today', icon: 'assignment' },
  ];

  lineChartData: ChartDataSets[] = [
    { data: [8, 8, 7.5, 8, 8, 0, 0], label: 'Daily Hours' },
  ];

  lineChartLabels: Label[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  lineChartType: ChartType = 'line';
  lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  doughnutChartLabels: Label[] = ['Present', 'Late', 'Absent'];
  doughnutChartData: SingleDataSet = [18, 2, 0];
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  displayedColumns = ['action', 'module', 'timestamp', 'status'];
  recentActivity: ActivityRow[] = [
    {
      action: 'Checked In',
      user: 'You',
      module: 'Attendance',
      timestamp: '2026-03-13 09:00',
      status: 'Success',
    },
    {
      action: 'Profile Updated',
      user: 'You',
      module: 'Employee',
      timestamp: '2026-03-13 08:45',
      status: 'Success',
    },
    {
      action: 'Leave Request Submitted',
      user: 'You',
      module: 'Attendance',
      timestamp: '2026-03-12 17:30',
      status: 'Pending',
    },
    {
      action: 'Report Viewed',
      user: 'You',
      module: 'Reports',
      timestamp: '2026-03-12 14:15',
      status: 'Success',
    },
    {
      action: 'Settings Updated',
      user: 'You',
      module: 'Settings',
      timestamp: '2026-03-12 10:00',
      status: 'Success',
    },
  ];
}