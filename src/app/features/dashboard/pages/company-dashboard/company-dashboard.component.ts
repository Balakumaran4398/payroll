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
  selector: 'app-company-dashboard',
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.scss'],
})
export class CompanyDashboardComponent {
  statCards = [
    { title: 'My Employees', value: '156', trend: '+12.3%', icon: 'groups' },
    { title: 'Active Projects', value: '8', trend: '+2', icon: 'work' },
    { title: 'Monthly Attendance', value: '94.2%', trend: '+1.5%', icon: 'check_circle' },
    { title: 'Pending Requests', value: '12', trend: '-3', icon: 'schedule' },
  ];

  lineChartData: ChartDataSets[] = [
    { data: [45, 52, 38, 61, 49, 55, 42], label: 'Employee Attendance' },
    { data: [12, 15, 8, 22, 18, 14, 16], label: 'Leave Requests' },
  ];

  lineChartLabels: Label[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  lineChartType: ChartType = 'line';
  lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  doughnutChartLabels: Label[] = ['Present', 'Absent', 'Leave'];
  doughnutChartData: SingleDataSet = [85, 8, 7];
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  displayedColumns = ['action', 'user', 'module', 'timestamp', 'status'];
  recentActivity: ActivityRow[] = [
    {
      action: 'Employee Check-in',
      user: 'john.doe',
      module: 'Attendance',
      timestamp: '2026-03-13 09:00',
      status: 'Success',
    },
    {
      action: 'Leave Request',
      user: 'jane.smith',
      module: 'Attendance',
      timestamp: '2026-03-13 08:45',
      status: 'Pending',
    },
    {
      action: 'Profile Updated',
      user: 'mike.johnson',
      module: 'Employee',
      timestamp: '2026-03-13 08:30',
      status: 'Success',
    },
    {
      action: 'Report Generated',
      user: 'sarah.wilson',
      module: 'Reports',
      timestamp: '2026-03-13 08:15',
      status: 'Success',
    },
    {
      action: 'Settings Changed',
      user: 'admin',
      module: 'Company',
      timestamp: '2026-03-13 08:00',
      status: 'Success',
    },
  ];
}