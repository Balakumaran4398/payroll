import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ThemeService } from '../../../../core/services/theme.service';

interface ActivityRow {
  action: string;
  user: string;
  module: string;
  timestamp: string;
  status: 'Success' | 'Pending' | 'Failed';
}

interface RoleBreakdownItem {
  label: string;
  value: number;
  share: string;
  color: string;
}

interface ChartPalette {
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  surfaceStrong: string;
  borderSoft: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly defaultLineChartSource: ChartConfiguration<'line'>['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { data: [65, 59, 80, 81, 56, 55, 72], label: 'User Registrations' },
      { data: [32, 45, 29, 66, 52, 39, 48], label: 'System Activity' },
    ],
  };

  private readonly defaultDoughnutChartSource: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Admins', 'Companies', 'Employees'],
    datasets: [{ data: [12, 35, 53] }],
  };

  private themeSubscription?: Subscription;
  private lineChartSource = this.cloneLineChartSource(this.defaultLineChartSource);
  private doughnutChartSource = this.cloneDoughnutChartSource(this.defaultDoughnutChartSource);

  chartPalette: ChartPalette = {
    primary: '#2e4fae',
    secondary: '#33b4b2',
    accent: '#59dee7',
    textPrimary: '#122a4d',
    textSecondary: '#445f86',
    textMuted: '#5d7499',
    surface: '#ffffff',
    surfaceStrong: '#f8fbff',
    borderSoft: 'rgba(18, 57, 110, 0.16)',
  };

  statCards = [
    { title: 'Total Users', value: '1,286', trend: '+5.6%', icon: 'groups' },
    { title: 'Active Companies', value: '94', trend: '+2.1%', icon: 'apartment' },
    { title: 'Total Employees', value: '2,450', trend: '+8.4%', icon: 'badge' },
    { title: 'System Health', value: '99.7%', trend: 'Stable', icon: 'monitor_heart' },
  ];

  lineChartData: ChartConfiguration<'line'>['data'] = this.cloneLineChartSource(this.defaultLineChartSource);
  lineChartType: 'line' = 'line';
  lineChartOptions: ChartOptions<'line'> = {};

  doughnutChartData: ChartConfiguration<'doughnut'>['data'] = this.cloneDoughnutChartSource(this.defaultDoughnutChartSource);
  doughnutChartType: 'doughnut' = 'doughnut';
  doughnutChartOptions: ChartOptions<'doughnut'> = {};

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

  constructor(
    private apiService: ApiService,
    private themeService: ThemeService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.applyChartTheme();
    this.themeSubscription = this.themeService.preset$.subscribe(() => {
      this.applyChartTheme();
    });
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  get weeklyPeakDay(): string {
    const labels = this.lineChartSource.labels || [];
    const totals = this.getWeeklyTotals();
    if (!labels.length || !totals.length) {
      return 'No Data';
    }

    let peakIndex = 0;
    totals.forEach((value, index) => {
      if (value > totals[peakIndex]) {
        peakIndex = index;
      }
    });

    return `${labels[peakIndex] || 'Day'}`;
  }

  get weeklyPeakTotal(): string {
    const totals = this.getWeeklyTotals();
    return totals.length ? `${Math.max(...totals)}` : '0';
  }

  get weeklyAverageTotal(): string {
    const totals = this.getWeeklyTotals();
    if (!totals.length) {
      return '0';
    }

    const average = totals.reduce((sum, value) => sum + value, 0) / totals.length;
    return average.toFixed(1);
  }

  get weeklyMomentum(): string {
    const totals = this.getWeeklyTotals();
    if (totals.length < 2 || totals[0] === 0) {
      return '0%';
    }

    const momentum = ((totals[totals.length - 1] - totals[0]) / totals[0]) * 100;
    return `${momentum >= 0 ? '+' : ''}${momentum.toFixed(1)}%`;
  }

  get totalRoleCount(): string {
    const values = this.getDoughnutValues();
    return `${values.reduce((sum, value) => sum + value, 0)}`;
  }

  get leadingRoleLabel(): string {
    const labels = this.doughnutChartSource.labels || [];
    const values = this.getDoughnutValues();
    if (!labels.length || !values.length) {
      return 'No Data';
    }

    let leadingIndex = 0;
    values.forEach((value, index) => {
      if (value > values[leadingIndex]) {
        leadingIndex = index;
      }
    });

    return `${labels[leadingIndex] || 'Role'}`;
  }

  get leadingRoleShare(): string {
    const values = this.getDoughnutValues();
    const total = values.reduce((sum, value) => sum + value, 0);
    if (!values.length || total === 0) {
      return '0%';
    }

    const share = (Math.max(...values) / total) * 100;
    return `${share.toFixed(1)}%`;
  }

  get roleBreakdown(): RoleBreakdownItem[] {
    const labels = (this.doughnutChartSource.labels || []).map((label) => `${label}`);
    const values = this.getDoughnutValues();
    const total = values.reduce((sum, value) => sum + value, 0);
    const colors = [
      this.chartPalette.primary,
      this.chartPalette.secondary,
      this.chartPalette.accent,
      this.withAlpha(this.chartPalette.primary, 0.45),
    ];

    return labels.map((label, index) => {
      const value = values[index] || 0;
      return {
        label,
        value,
        share: total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%',
        color: colors[index % colors.length],
      };
    });
  }

  private loadDashboardData(): void {
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        if (!data) {
          return;
        }

        if (data.stats) {
          this.statCards = data.stats;
        }

        if (data.chartData) {
          this.lineChartSource = this.normalizeLineChartSource(data.chartData.lineData);
          this.doughnutChartSource = this.normalizeDoughnutChartSource(data.chartData.doughnutData);
          this.applyChartTheme();
        }

        if (data.activities) {
          this.recentActivity = data.activities;
        }
      },
      error: (error) => {
        console.error('Error loading admin dashboard data:', error);
      },
    });
  }

  private applyChartTheme(): void {
    this.chartPalette = this.readChartPalette();
    this.lineChartData = this.buildLineChartData();
    this.doughnutChartData = this.buildDoughnutChartData();
    this.lineChartOptions = this.buildLineChartOptions();
    this.doughnutChartOptions = this.buildDoughnutChartOptions();
  }

  private buildLineChartData(): ChartConfiguration<'line'>['data'] {
    const accentColors = [
      this.chartPalette.primary,
      this.chartPalette.secondary,
      this.chartPalette.accent,
    ];

    return {
      labels: [...(this.lineChartSource.labels || [])],
      datasets: this.lineChartSource.datasets.map((dataset, index) => {
        const strokeColor = accentColors[index % accentColors.length];

        return {
          ...dataset,
          borderColor: strokeColor,
          backgroundColor: (context: any) => this.createLineGradient(context.chart, strokeColor),
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 18,
          pointBackgroundColor: strokeColor,
          pointBorderColor: this.chartPalette.surface,
          pointHoverBorderColor: this.chartPalette.surface,
          pointHoverBorderWidth: 3,
          borderWidth: 3,
          fill: true,
          tension: 0.42,
          cubicInterpolationMode: 'monotone',
        };
      }),
    };
  }

  private buildDoughnutChartData(): ChartConfiguration<'doughnut'>['data'] {
    const values = this.getDoughnutValues();
    const colors = [
      this.chartPalette.primary,
      this.chartPalette.secondary,
      this.chartPalette.accent,
      this.withAlpha(this.chartPalette.primary, 0.45),
    ];

    return {
      labels: [...(this.doughnutChartSource.labels || [])],
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, index) => colors[index % colors.length]),
          hoverBackgroundColor: values.map((_, index) => colors[index % colors.length]),
          borderColor: this.chartPalette.surface,
          hoverBorderColor: this.chartPalette.surface,
          borderWidth: 4,
          hoverBorderWidth: 4,
          hoverOffset: 10,
          spacing: 2,
        },
      ],
    };
  }

  private buildLineChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      animation: {
        duration: 1300,
        easing: 'easeOutQuart',
      },
      animations: {
        x: {
          duration: 900,
          easing: 'easeOutCubic',
        },
        y: {
          duration: 1100,
          easing: 'easeOutQuart',
        },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            color: this.chartPalette.textPrimary,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            boxHeight: 10,
            padding: 18,
            font: {
              size: 12,
              weight: 600,
            },
          },
        },
        tooltip: {
          backgroundColor: this.withAlpha(this.chartPalette.surfaceStrong, 0.96),
          titleColor: this.chartPalette.textPrimary,
          bodyColor: this.chartPalette.textSecondary,
          borderColor: this.withAlpha(this.chartPalette.borderSoft, 0.92),
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxPadding: 6,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: this.chartPalette.textMuted,
            font: {
              size: 11,
              weight: 600,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: this.withAlpha(this.chartPalette.borderSoft, 0.85),
          },
          ticks: {
            color: this.chartPalette.textMuted,
            padding: 10,
            font: {
              size: 11,
            },
          },
        },
      },
    };
  }

  private buildDoughnutChartOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      animation: {
        duration: 1500,
        easing: 'easeOutExpo',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: this.withAlpha(this.chartPalette.surfaceStrong, 0.96),
          titleColor: this.chartPalette.textPrimary,
          bodyColor: this.chartPalette.textSecondary,
          borderColor: this.withAlpha(this.chartPalette.borderSoft, 0.92),
          borderWidth: 1,
          padding: 12,
          displayColors: true,
        },
      },
    };
  }

  private getWeeklyTotals(): number[] {
    const labelsCount = (this.lineChartSource.labels || []).length;
    const totals = Array.from({ length: labelsCount }, () => 0);

    this.lineChartSource.datasets.forEach((dataset) => {
      dataset.data.forEach((value, index) => {
        totals[index] += Number(value) || 0;
      });
    });

    return totals;
  }

  private getDoughnutValues(): number[] {
    const dataset = this.doughnutChartSource.datasets[0];
    return Array.isArray(dataset?.data)
      ? dataset.data.map((value) => Number(value) || 0)
      : [];
  }

  private normalizeLineChartSource(source: any): ChartConfiguration<'line'>['data'] {
    const fallback = this.cloneLineChartSource(this.defaultLineChartSource);
    const labels = Array.isArray(source?.labels) && source.labels.length
      ? source.labels.map((label: any) => `${label}`)
      : [...(fallback.labels || [])];
    const rawDatasets = Array.isArray(source?.datasets) && source.datasets.length
      ? source.datasets
      : fallback.datasets;

    return {
      labels,
      datasets: rawDatasets.map((dataset: any, index: number) => ({
        label: `${dataset?.label || fallback.datasets[index]?.label || `Series ${index + 1}`}`,
        data: this.normalizeNumericSeries(
          Array.isArray(dataset?.data) ? dataset.data : fallback.datasets[index]?.data,
          labels.length
        ),
      })),
    };
  }

  private normalizeDoughnutChartSource(source: any): ChartConfiguration<'doughnut'>['data'] {
    const fallback = this.cloneDoughnutChartSource(this.defaultDoughnutChartSource);
    const labels = Array.isArray(source?.labels) && source.labels.length
      ? source.labels.map((label: any) => `${label}`)
      : [...(fallback.labels || [])];
    const datasetValues = Array.isArray(source?.datasets) && source.datasets[0]?.data
      ? source.datasets[0].data
      : Array.isArray(source?.data)
        ? source.data
        : fallback.datasets[0].data;

    return {
      labels,
      datasets: [
        {
          data: this.normalizeNumericSeries(datasetValues, labels.length),
        },
      ],
    };
  }

  private normalizeNumericSeries(values: any, expectedLength: number): number[] {
    const normalized = Array.isArray(values)
      ? values.map((value) => Number(value) || 0)
      : [];

    if (normalized.length >= expectedLength) {
      return normalized.slice(0, expectedLength);
    }

    return [...normalized, ...Array.from({ length: expectedLength - normalized.length }, () => 0)];
  }

  private cloneLineChartSource(source: ChartConfiguration<'line'>['data']): ChartConfiguration<'line'>['data'] {
    return {
      labels: [...(source.labels || [])],
      datasets: source.datasets.map((dataset) => ({
        label: `${dataset.label || ''}`,
        data: Array.isArray(dataset.data) ? [...dataset.data] : [],
      })),
    };
  }

  private cloneDoughnutChartSource(source: ChartConfiguration<'doughnut'>['data']): ChartConfiguration<'doughnut'>['data'] {
    return {
      labels: [...(source.labels || [])],
      datasets: source.datasets.map((dataset) => ({
        data: Array.isArray(dataset.data) ? [...dataset.data] : [],
      })),
    };
  }

  private readChartPalette(): ChartPalette {
    const styles = getComputedStyle(this.document.documentElement);

    return {
      primary: this.readCssVariable(styles, '--theme-primary', '#2e4fae'),
      secondary: this.readCssVariable(styles, '--theme-secondary', '#33b4b2'),
      accent: this.readCssVariable(styles, '--theme-accent', '#59dee7'),
      textPrimary: this.readCssVariable(styles, '--theme-text-primary', '#122a4d'),
      textSecondary: this.readCssVariable(styles, '--theme-text-secondary', '#445f86'),
      textMuted: this.readCssVariable(styles, '--theme-text-muted', '#5d7499'),
      surface: this.readCssVariable(styles, '--theme-surface', '#ffffff'),
      surfaceStrong: this.readCssVariable(styles, '--theme-surface-strong', '#f8fbff'),
      borderSoft: this.readCssVariable(styles, '--theme-border-soft', 'rgba(18, 57, 110, 0.16)'),
    };
  }

  private readCssVariable(styles: CSSStyleDeclaration, name: string, fallback: string): string {
    const value = styles.getPropertyValue(name).trim();
    return value || fallback;
  }

  private createLineGradient(chart: any, color: string): CanvasGradient | string {
    const chartArea = chart?.chartArea;
    if (!chartArea) {
      return this.withAlpha(color, 0.24);
    }

    const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, this.withAlpha(color, 0.34));
    gradient.addColorStop(0.52, this.withAlpha(color, 0.12));
    gradient.addColorStop(1, this.withAlpha(color, 0.02));
    return gradient;
  }

  private withAlpha(color: string, alpha: number): string {
    const trimmed = color.trim();

    if (trimmed.startsWith('#')) {
      const hex = trimmed.slice(1);
      const normalized = hex.length === 3
        ? hex.split('').map((part) => part + part).join('')
        : hex.slice(0, 6);

      const red = parseInt(normalized.slice(0, 2), 16);
      const green = parseInt(normalized.slice(2, 4), 16);
      const blue = parseInt(normalized.slice(4, 6), 16);

      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
      const [red = '0', green = '0', blue = '0'] = rgbMatch[1].split(',').map((part) => part.trim());
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    return trimmed;
  }
}
