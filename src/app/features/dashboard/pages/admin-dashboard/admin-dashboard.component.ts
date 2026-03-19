import { Component, OnInit } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label, SingleDataSet } from 'ng2-charts';
import { ApiService } from '../../../../core/services/api.service';

interface ActivityRow {
  action: string;
  user: string;
  module: string;
  timestamp: string;
  status: 'Success' | 'Pending' | 'Failed';
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load admin dashboard data from API
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        if (data) {
          // Update stats cards with real data
          if (data.stats) {
            this.statCards = data.stats;
          }
          // Update chart data with real data
          if (data.chartData) {
            this.lineChartData = data.chartData.lineData || this.lineChartData;
            this.doughnutChartData = data.chartData.doughnutData || this.doughnutChartData;
          }
          // Update activity data
          if (data.activities) {
            this.recentActivity = data.activities;
          }
        }
      },
      error: (error) => {
        console.error('Error loading admin dashboard data:', error);
        // Keep default data on error
      }
    });
  }
  statCards = [
    { title: 'Total Users', value: '1,286', trend: '+5.6%', icon: 'groups' },
    { title: 'Active Companies', value: '94', trend: '+2.1%', icon: 'apartment' },
    { title: 'Total Employees', value: '2,450', trend: '+8.4%', icon: 'badge' },
    { title: 'System Health', value: '99.7%', trend: 'Stable', icon: 'monitor_heart' },
  ];

  lineChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 72], label: 'User Registrations' },
    { data: [32, 45, 29, 66, 52, 39, 48], label: 'System Activity' },
  ];

  lineChartLabels: Label[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  lineChartType: ChartType = 'line';
  lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  doughnutChartLabels: Label[] = ['Admins', 'Companies', 'Employees'];
  doughnutChartData: SingleDataSet = [12, 35, 53];
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  displayedColumns = ['action', 'user', 'module', 'timestamp', 'status'];
  recentActivity: ActivityRow[] = [
    {
      action: 'User Created',
      user: 'admin',
      module: 'Users',
      timestamp: '2026-03-13 10:11',
      status: 'Success',
    },
    {
      action: 'Company Added',
      user: 'admin',
      module: 'Company',
      timestamp: '2026-03-13 09:45',
      status: 'Success',
    },
    {
      action: 'Employee Updated',
      user: 'company1',
      module: 'Employee',
      timestamp: '2026-03-13 09:30',
      status: 'Success',
    },
    {
      action: 'Report Generated',
      user: 'employee1',
      module: 'Reports',
      timestamp: '2026-03-13 09:15',
      status: 'Success',
    },
    {
      action: 'Settings Changed',
      user: 'admin',
      module: 'Settings',
      timestamp: '2026-03-13 08:50',
      status: 'Pending',
    },
  ];
}