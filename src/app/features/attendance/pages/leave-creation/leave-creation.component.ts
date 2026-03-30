import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { ApiService } from 'src/app/core/services/api.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { LeaveSettingsEditDialogComponent } from '../../components/leave-settings-edit-dialog/leave-settings-edit-dialog.component';

interface LeaveTypeApiItem {
  id: number;
  leave_type: string;
  leave_code: string;
  leave_type_id?: number;
  isactive?: boolean;
  createddate?: string;
  updateddate?: string;
  company_id?: number;
  monthly_limit?: number;
  yearly_limit?: number;
}

export interface LeaveTypeOption {
  id: number;
  leaveType: string;
  leaveCode: string;
}

export interface LeaveSettingRow {
  id: number;
  leaveTypeId: number;
  leaveType: string;
  leaveCode: string;
  companyId: number;
  monthlyLimit: number;
  yearlyLimit: number;
  createddate: string;
  updateddate: string;
  isactive: boolean;
}

@Component({
  selector: 'app-leave-creation',
  templateUrl: './leave-creation.component.html',
  styleUrls: ['./leave-creation.component.scss'],
})
export class LeaveCreationComponent implements OnInit {
  readonly displayedColumns = ['leaveCode', 'leaveType', 'monthlyLimit', 'yearlyLimit', 'updateddate', 'actions'];

  leaveSettings: LeaveSettingRow[] = [];
  leaveTypeOptions: LeaveTypeOption[] = [];
  loading = false;
  username: any;
  companyid = 0;
  constructor(
    private apiService: ApiService,
    private router: Router,
    private location: Location,
    private navigationService: NavigationService,
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private feedback: UiFeedbackService,
    private dialog: MatDialog,
  ) {
    this.username = tokenStorage.getUsername();
  }

  ngOnInit(): void {
    this.loadLeaveTypeOptions();
    this.getemployeedetails();
  }

  goBack(): void {
    const previousUrl = this.navigationService.getPreviousUrl();

    if (this.navigationService.isDashboardRoute(previousUrl)) {
      this.router.navigateByUrl(this.navigationService.getDashboardUrl());
      return;
    }

    this.location.back();
  }

  getemployeedetails() {
    this.apiService.getemployeedetails(this.username).subscribe((res: any) => {
      console.log(res);
      this.companyid = res.companyid;
      console.log(this.companyid);
      this.loadLeaveSettings();

    })
  }
  openCreateDialog(): void {
    if (!this.leaveTypeOptions.length) {
      this.feedback.warning('Leave type list is still loading. Please try again.');
      return;
    }

    const dialogRef = this.dialog.open(LeaveSettingsEditDialogComponent, {
      width: '520px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      data: {
        mode: 'create',
        row: this.buildEmptyRow(),
        companyId: this.companyid || this.resolveCompanyId(),
        createdby: this.resolveCreatedBy(),
        leaveTypeOptions: this.getAvailableLeaveTypeOptions(),
      },
    });

    this.handleDialogClose(dialogRef);
  }

  openEditDialog(row: LeaveSettingRow): void {
    const dialogRef = this.dialog.open(LeaveSettingsEditDialogComponent, {
      width: '520px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      data: {
        mode: 'edit',
        row: { ...row },
        companyId: this.companyid || this.resolveCompanyId(),
        createdby: this.resolveCreatedBy(),
        leaveTypeOptions: this.leaveTypeOptions,
      },
    });

    this.handleDialogClose(dialogRef);
  }

  trackByLeaveType(_: number, row: LeaveSettingRow): number {
    return row.leaveTypeId;
  }

  formatUpdatedDate(value: string): string {
    const normalizedValue = `${value || ''}`.trim();
    if (!normalizedValue) {
      return '-';
    }

    const parsedDate = new Date(normalizedValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return normalizedValue;
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(parsedDate);
  }

  private loadLeaveSettings(): void {
    this.loading = true;
    console.log("dsfjdslkfdjl   ", this.companyid);

    this.apiService.getcompanyleavesetting(this.companyid)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.leaveSettings = this.extractLeaveSettings(response);
        },
        error: (error: any) => {
          this.leaveSettings = [];
          this.feedback.error(this.extractErrorMessage(error, 'Failed to load leave settings.'));
        },
      });
  }

  private loadLeaveTypeOptions(): void {
    this.apiService.getleavetype().subscribe({
      next: (response: any) => {
        const source = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
              ? response.result
              : [];

        this.leaveTypeOptions = source
          .map((item: LeaveTypeApiItem) => ({
            id: Number(item?.leave_type_id || item?.id || 0) || 0,
            leaveType: `${item?.leave_type || ''}`.trim(),
            leaveCode: `${item?.leave_code || ''}`.trim(),
          }))
          .filter((item: LeaveTypeOption) => item.id > 0 && !!item.leaveType);
      },
      error: () => {
        this.leaveTypeOptions = [];
      },
    });
  }

  private extractLeaveSettings(response: any): LeaveSettingRow[] {
    const source = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : [];

    return source
      .map((item: LeaveTypeApiItem) => this.mapLeaveSettingRow(item))
      .filter((item: LeaveSettingRow) => item.leaveTypeId > 0 && item.isactive !== false);
  }

  private mapLeaveSettingRow(item: LeaveTypeApiItem): LeaveSettingRow {
    const companyId = Number(item?.company_id || this.resolveCompanyId() || 0) || 0;
    const createddate = `${item?.createddate || ''}`.trim();
    const updateddate = `${item?.updateddate || item?.createddate || ''}`.trim();
    const leaveTypeId = Number(item?.leave_type_id || item?.id || 0) || 0;
    const leaveTypeOption = this.leaveTypeOptions.find((option) => option.id === leaveTypeId);

    return {
      id: Number(item?.id || 0) || 0,
      leaveTypeId,
      leaveType: `${item?.leave_type || leaveTypeOption?.leaveType || ''}`.trim(),
      leaveCode: `${item?.leave_code || leaveTypeOption?.leaveCode || ''}`.trim(),
      companyId,
      monthlyLimit: Number(item?.monthly_limit || 0) || 0,
      yearlyLimit: Number(item?.yearly_limit || 0) || 0,
      createddate,
      updateddate,
      isactive: item?.isactive !== false,
    };
  }

  private resolveCompanyId(): number {
    return Number(this.tokenStorage.getCompanyId() || this.authService.getID() || 0) || 0;
  }

  private resolveCreatedBy(): string {
    return `${this.tokenStorage.getUsername() || this.authService.getUsername() || ''}`.trim();
  }

  private handleDialogClose(dialogRef: any): void {
    dialogRef.afterClosed().subscribe((result?: { row?: LeaveSettingRow; message?: string }) => {
      if (!result?.row) {
        return;
      }

      const rowExists = this.leaveSettings.some((item) => item.leaveTypeId === result.row?.leaveTypeId);
      this.leaveSettings = rowExists
        ? this.leaveSettings.map((item) => item.leaveTypeId === result.row?.leaveTypeId ? result.row : item)
        : [result.row, ...this.leaveSettings];

      this.feedback.success(result.message || 'Leave settings updated successfully.');
    });
  }

  private buildEmptyRow(): LeaveSettingRow {
    return {
      id: 0,
      leaveTypeId: 0,
      leaveType: '',
      leaveCode: '',
      companyId: this.companyid || this.resolveCompanyId(),
      monthlyLimit: 0,
      yearlyLimit: 0,
      createddate: '',
      updateddate: '',
      isactive: true,
    };
  }

  private getAvailableLeaveTypeOptions(): LeaveTypeOption[] {
    const existingIds = new Set(this.leaveSettings.map((item) => item.leaveTypeId));
    const filteredOptions = this.leaveTypeOptions.filter((item) => !existingIds.has(item.id));
    return filteredOptions.length ? filteredOptions : this.leaveTypeOptions;
  }

  private extractErrorMessage(error: any, fallback: string): string {
    const candidate = `${error?.error?.message || error?.error?.msg || error?.message || ''}`.trim();
    return candidate || fallback;
  }
}
