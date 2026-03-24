import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { AppRole, AuthService } from 'src/app/core/services/auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { HolidayDeleteDialogComponent } from '../../components/holiday-delete-dialog/holiday-delete-dialog.component';
import { HolidayFormDialogComponent } from '../../components/holiday-form-dialog/holiday-form-dialog.component';
import {
  HolidayDeleteDialogResult,
  HolidayFormDialogResult,
  HolidayRecord,
  HolidayType,
  WeekendSettingsPayload,
} from '../../holiday-calendar.types';

type SaturdayPolicy = 'none' | 'all' | 'second-fourth' | 'alternate';

interface HolidayStatsCard {
  label: string;
  count: number;
  icon: string;
  tone: HolidayType | 'total';
  hint: string;
}

interface WeekdayOption {
  value: string;
  label: string;
}

interface SaturdayOption {
  value: SaturdayPolicy;
  title: string;
  subtitle: string;
  icon: string;
}

interface HolidayTypeOption {
  value: HolidayType | 'all';
  label: string;
  chipLabel: string;
  icon: string;
}

interface HolidayViewModel extends HolidayRecord {
  dateValue: Date;
  monthLabel: string;
  dateLabel: string;
  dayLabel: string;
  typeLabel: string;
}

interface HolidayMonthGroup {
  monthLabel: string;
  items: HolidayViewModel[];
}

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss'],
})
export class CompanyComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from({ length: 5 }, (_, index) => this.currentYear - 1 + index);
  readonly weekDays: WeekdayOption[] = [
    { value: 'Sunday', label: 'Sunday' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
  ];
  readonly saturdayOptions: SaturdayOption[] = [
    { value: 'none', title: 'No Saturday Off', subtitle: 'All Saturdays are working', icon: 'event_busy' },
    { value: 'all', title: 'All Saturdays', subtitle: 'Every Saturday is off', icon: 'event_available' },
    { value: 'second-fourth', title: '2nd & 4th Saturday', subtitle: 'Common policy for teams', icon: 'calendar_view_month' },
    { value: 'alternate', title: '1st, 3rd & 5th Saturday', subtitle: 'Alternate weekend pattern', icon: 'view_week' },
  ];
  readonly holidayTypeOptions: HolidayTypeOption[] = [
    { value: 'all', label: 'All Types', chipLabel: 'All', icon: 'layers' },
    { value: 'national', label: 'National', chipLabel: 'National', icon: 'flag' },
    { value: 'religious', label: 'Religious', chipLabel: 'Religious', icon: 'auto_awesome' },
    { value: 'company', label: 'Company', chipLabel: 'Company', icon: 'apartment' },
  ];

  selectedYear = Math.max(this.currentYear, 2026);
  selectedTypeFilter: HolidayType | 'all' = 'all';
  selectedWeeklyOffs: string[] = ['Sunday'];
  selectedSaturdayPolicy: SaturdayPolicy = 'second-fourth';
  searchTerm = '';
  isLoading = true;
  isSavingWeekendSettings = false;
  currentRole: AppRole | null = null;
  companyId = 0;
  createdBy = '';

  holidays: HolidayRecord[] = [];

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private feedback: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.currentRole = this.authService.getRole();
    this.companyId = this.resolveCompanyId();
    this.createdBy = this.resolveCreatedBy();
    this.loadHolidays();
  }

  get statsCards(): HolidayStatsCard[] {
    const holidays = this.holidaysForSelectedYear;
    const national = holidays.filter((holiday) => holiday.type === 'national').length;
    const religious = holidays.filter((holiday) => holiday.type === 'religious').length;
    const company = holidays.filter((holiday) => holiday.type === 'company').length;

    return [
      { label: 'National Holidays', count: national, icon: 'flag', tone: 'national', hint: 'Public and statutory closures' },
      { label: 'Religious Holidays', count: religious, icon: 'auto_awesome', tone: 'religious', hint: 'Faith and regional observances' },
      { label: 'Company Holidays', count: company, icon: 'apartment', tone: 'company', hint: 'Internal closures and culture days' },
      { label: 'Total Holidays', count: holidays.length, icon: 'event_note', tone: 'total', hint: 'Calendar entries for the year' },
    ];
  }

  get holidayGroups(): HolidayMonthGroup[] {
    const monthMap = new Map<string, HolidayViewModel[]>();

    this.filteredHolidays.forEach((holiday) => {
      const monthLabel = holiday.monthLabel;
      const current = monthMap.get(monthLabel) ?? [];
      current.push(holiday);
      monthMap.set(monthLabel, current);
    });

    return Array.from(monthMap.entries()).map(([monthLabel, items]) => ({ monthLabel, items }));
  }

  get totalFilteredHolidays(): number {
    return this.filteredHolidays.length;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.selectedTypeFilter !== 'all';
  }

  get canManageHolidayActions(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY';
  }

  getHolidayActionDisabledReason(): string {
    return this.canManageHolidayActions ? '' : 'Only admin and company roles can manage holidays.';
  }

  get selectedWeeklyOffSummary(): string {
    const weekdaySummary = this.selectedWeeklyOffs.length
      ? this.selectedWeeklyOffs.join(', ')
      : 'No weekday weekly off selected';

    return `${weekdaySummary}, ${this.selectedSaturdayOption.title}`;
  }

  get selectedSaturdayOption(): SaturdayOption {
    return this.saturdayOptions.find((option) => option.value === this.selectedSaturdayPolicy) || this.saturdayOptions[0];
  }

  onYearChange(): void {}

  toggleWeeklyOff(day: string): void {
    if (this.isSavingWeekendSettings) {
      return;
    }

    const previousWeeklyOffs = [...this.selectedWeeklyOffs];
    const previousSaturdayPolicy = this.selectedSaturdayPolicy;

    if (this.selectedWeeklyOffs.includes(day)) {
      this.selectedWeeklyOffs = this.selectedWeeklyOffs.filter((item) => item !== day);
    } else {
      this.selectedWeeklyOffs = [...this.selectedWeeklyOffs, day];
    }

    this.updateWeekendSettings(previousWeeklyOffs, previousSaturdayPolicy);
  }

  isWeeklyOff(day: string): boolean {
    return this.selectedWeeklyOffs.includes(day);
  }

  selectSaturdayPolicy(policy: SaturdayPolicy): void {
    if (this.isSavingWeekendSettings || this.selectedSaturdayPolicy === policy) {
      return;
    }

    const previousWeeklyOffs = [...this.selectedWeeklyOffs];
    const previousSaturdayPolicy = this.selectedSaturdayPolicy;
    this.selectedSaturdayPolicy = policy;
    this.updateWeekendSettings(previousWeeklyOffs, previousSaturdayPolicy);
  }

  openAddHolidayDialog(): void {
    if (!this.canManageHolidayActions) {
      return;
    }

    this.openHolidayFormDialog('add');
  }

  openEditHolidayDialog(holiday: HolidayViewModel): void {
    if (!this.canManageHolidayActions) {
      return;
    }

    this.openHolidayFormDialog('edit', holiday);
  }

  openDeleteHolidayDialog(holiday: HolidayViewModel): void {
    if (!this.canManageHolidayActions) {
      return;
    }

    const dialogRef = this.dialog.open(HolidayDeleteDialogComponent, {
      width: '460px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-delete-modal-panel'],
      position: { top: '64px', right: '0' },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      data: { holiday },
    });

    dialogRef.afterClosed().subscribe((result?: HolidayDeleteDialogResult) => {
      if (!result?.deleted) {
        return;
      }

      this.feedback.success(result.message || `${holiday.name} deleted successfully.`);
      this.loadHolidays(false);
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedTypeFilter = 'all';
  }

  trackByYear(_index: number, year: number): number {
    return year;
  }

  trackByLabel(_index: number, item: { label: string }): string {
    return item.label;
  }

  trackByValue(_index: number, item: { value: string }): string {
    return item.value;
  }

  trackByMonth(_index: number, group: HolidayMonthGroup): string {
    return group.monthLabel;
  }

  trackByHolidayId(_index: number, holiday: HolidayViewModel): number {
    return holiday.id;
  }

  private openHolidayFormDialog(mode: 'add' | 'edit', holiday?: HolidayRecord): void {
    const dialogRef = this.dialog.open(HolidayFormDialogComponent, {
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
      position: { top: '64px', right: '0' },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      data: { mode, holiday, year: this.selectedYear },
    });

    dialogRef.afterClosed().subscribe((result?: HolidayFormDialogResult) => {
      if (!result?.reload) {
        return;
      }

      this.feedback.success(result.message || 'Holiday saved successfully.');
      this.loadHolidays(false);
    });
  }

  private loadHolidays(showLoader = true): void {
    if (!this.companyId) {
      this.holidays = [];
      this.isLoading = false;
      this.feedback.error('Company id is missing. Unable to load holidays.');
      return;
    }

    if (showLoader) {
      this.isLoading = true;
    }

    this.apiService
      .getholidays(this.companyId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.applyWeekendSettingsFromResponse(response);
          this.holidays = this.normalizeHolidayResponse(response);
        },
        error: (error) => {
          this.holidays = [];
          this.feedback.error(this.extractErrorMessage(error, 'Unable to load holidays. Please try again.'));
        },
      });
  }

  private updateWeekendSettings(previousWeeklyOffs: string[], previousSaturdayPolicy: SaturdayPolicy): void {
    if (!this.companyId) {
      this.selectedWeeklyOffs = previousWeeklyOffs;
      this.selectedSaturdayPolicy = previousSaturdayPolicy;
      this.feedback.error('Company id is missing. Unable to update weekend settings.');
      return;
    }

    const payload = this.buildWeekendSettingsPayload();
    this.isSavingWeekendSettings = true;

    this.apiService
      .updateweekendsettings(payload)
      .pipe(
        finalize(() => {
          this.isSavingWeekendSettings = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.feedback.success(this.extractResponseMessage(response, 'Weekend settings updated successfully.'));
        },
        error: (error) => {
          this.selectedWeeklyOffs = [...previousWeeklyOffs];
          this.selectedSaturdayPolicy = previousSaturdayPolicy;
          this.feedback.error(this.extractErrorMessage(error, 'Unable to update weekend settings. Please try again.'));
        },
      });
  }

  private buildWeekendSettingsPayload(): WeekendSettingsPayload {
    return {
      companyid: this.companyId,
      sunday_off: this.isWeeklyOff('Sunday'),
      monday_off: this.isWeeklyOff('Monday'),
      tuesday_off: this.isWeeklyOff('Tuesday'),
      wednesday_off: this.isWeeklyOff('Wednesday'),
      thursday_off: this.isWeeklyOff('Thursday'),
      friday_off: this.isWeeklyOff('Friday'),
      saturday_off: this.selectedSaturdayPolicy !== 'none',
      saturday_type: this.selectedSaturdayPolicy,
      createdby: this.createdBy,
    };
  }

  private get holidaysForSelectedYear(): HolidayRecord[] {
    return this.holidays.filter((holiday) => this.toDate(holiday.date).getFullYear() === this.selectedYear);
  }

  private get filteredHolidays(): HolidayViewModel[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.holidaysForSelectedYear
      .filter((holiday) => (this.selectedTypeFilter === 'all' ? true : holiday.type === this.selectedTypeFilter))
      .filter((holiday) => {
        if (!search) {
          return true;
        }

        const date = this.toDate(holiday.date);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(date);

        const haystack = `${holiday.name} ${holiday.description} ${formattedDate}`.toLowerCase();
        return haystack.includes(search);
      })
      .map((holiday) => this.toHolidayViewModel(holiday))
      .sort((left, right) => left.dateValue.getTime() - right.dateValue.getTime());
  }

  private normalizeHolidayResponse(response: any): HolidayRecord[] {
    const source = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : Array.isArray(response?.holidays)
            ? response.holidays
            : [];

    return source
      .map((item: any, index: number) => this.toHolidayRecord(item, index))
      .filter((holiday: HolidayRecord | null): holiday is HolidayRecord => !!holiday);
  }

  private applyWeekendSettingsFromResponse(response: any): void {
    const source = this.extractWeekendSettingsSource(response);
    if (!source) {
      return;
    }

    this.selectedWeeklyOffs = this.weekDays
      .filter((day) => !!source[this.toWeekendFlagKey(day.value)])
      .map((day) => day.value);

    this.selectedSaturdayPolicy = this.normalizeSaturdayPolicy(source?.saturday_type, source?.saturday_off);
  }

  private extractWeekendSettingsSource(response: any): any | null {
    const candidates = [
      response,
      response?.data,
      response?.result,
      response?.settings,
      response?.weekendSettings,
      response?.weekend_settings,
      response?.weekendSetting,
      response?.weekend_setting,
      Array.isArray(response?.data) ? response.data.find((item: any) => this.hasWeekendSettings(item)) : null,
      Array.isArray(response?.result) ? response.result.find((item: any) => this.hasWeekendSettings(item)) : null,
    ];

    return candidates.find((candidate) => this.hasWeekendSettings(candidate)) || null;
  }

  private hasWeekendSettings(candidate: any): boolean {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return false;
    }

    return [
      'sunday_off',
      'monday_off',
      'tuesday_off',
      'wednesday_off',
      'thursday_off',
      'friday_off',
      'saturday_off',
      'saturday_type',
    ].some((key) => key in candidate);
  }

  private toWeekendFlagKey(day: string): keyof WeekendSettingsPayload {
    switch (day) {
      case 'Sunday':
        return 'sunday_off';
      case 'Monday':
        return 'monday_off';
      case 'Tuesday':
        return 'tuesday_off';
      case 'Wednesday':
        return 'wednesday_off';
      case 'Thursday':
        return 'thursday_off';
      case 'Friday':
        return 'friday_off';
      default:
        return 'sunday_off';
    }
  }

  private normalizeSaturdayPolicy(rawType: unknown, saturdayOff: unknown): SaturdayPolicy {
    if (!saturdayOff) {
      return 'none';
    }

    const normalized = `${rawType || ''}`.trim().toLowerCase();

    if (normalized.includes('all')) {
      return 'all';
    }

    if (normalized.includes('second') || normalized.includes('2nd') || (normalized.includes('2') && normalized.includes('4'))) {
      return 'second-fourth';
    }

    if (normalized.includes('alternate') || normalized.includes('1st') || (normalized.includes('1') && normalized.includes('3') && normalized.includes('5'))) {
      return 'alternate';
    }

    return 'all';
  }

  private toHolidayRecord(item: any, index: number): HolidayRecord | null {
    const date = this.normalizeDateString(item?.holiday_date || item?.date || item?.holidayDate);
    const name = `${item?.title || item?.name || ''}`.trim();

    if (!date || !name) {
      return null;
    }

    const holidayid = Number(item?.holidayid || item?.holiday_id || item?.id || 0) || undefined;

    return {
      id: holidayid || index + 1,
      companyid: Number(item?.companyid || this.companyId || 0),
      date,
      name,
      type: this.normalizeHolidayType(item?.type),
      description: `${item?.remarks || item?.description || 'Holiday description not provided.'}`.trim(),
      createdby: `${item?.createdby || this.createdBy || ''}`.trim(),
      holidayid,
    };
  }

  private normalizeHolidayType(value: unknown): HolidayType {
    const normalized = `${value || ''}`.trim().toLowerCase();

    if (normalized.includes('national')) {
      return 'national';
    }

    if (normalized.includes('religious')) {
      return 'religious';
    }

    return 'company';
  }

  private normalizeDateString(value: unknown): string {
    const raw = `${value || ''}`.trim();
    return raw ? raw.slice(0, 10) : '';
  }

  private toHolidayViewModel(holiday: HolidayRecord): HolidayViewModel {
    const dateValue = this.toDate(holiday.date);

    return {
      ...holiday,
      dateValue,
      monthLabel: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(dateValue),
      dateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dateValue),
      dayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateValue),
      typeLabel: this.holidayTypeOptions.find((option) => option.value === holiday.type)?.label || 'Holiday',
    };
  }

  private toDate(dateString: string): Date {
    return new Date(`${dateString}T00:00:00`);
  }

  private resolveCompanyId(): number {
    return Number(this.tokenStorage.getCompanyId() || this.tokenStorage.getID() || 0) || 0;
  }

  private resolveCreatedBy(): string {
    return `${this.tokenStorage.getUsername() || this.authService.getUsername() || ''}`.trim();
  }

  private extractResponseMessage(response: any, fallback: string): string {
    const candidate = `${response?.message || response?.msg || response?.data?.message || ''}`.trim();
    return candidate || fallback;
  }

  private extractErrorMessage(error: any, fallback: string): string {
    const candidate = `${error?.error?.message || error?.error?.msg || error?.message || ''}`.trim();
    return candidate || fallback;
  }
}
