import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
export type AppRole = 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

@Component({
  selector: 'app-swipe-request-edit-dialog',
  templateUrl: './swipe-request-edit-dialog.component.html',
  styleUrls: ['./swipe-request-edit-dialog.component.scss'],
})
export class SwipeRequestEditDialogComponent {
  request: any;
  submitting = false;
  private closing = false;
  private readonly drawerCloseDurationMs = 340;
  readonly approvalStatusOptions = ['Pending', 'Approved', 'Rejected'];
  readonly permissionTypes = ['IN', 'OUT'];
  login_id: number;
  readonly canApprove: boolean;
  readonly currentRole: AppRole | null;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any; canApprove?: boolean; currentRole?: AppRole | null },
    private dialogRef: MatDialogRef<SwipeRequestEditDialogComponent>,
    private apiService: ApiService, private tokenService: TokenStorageService,
    private feedback: UiFeedbackService
  ) {
    this.login_id = tokenService.getID();
    this.request = {
      ...data.request,
      request_date: this.normalizeDateValue(data.request?.request_date || ''),
      punch_time: this.trimTimeSeconds(data.request?.punch_time || ''),
      mode: `${data.request?.mode || ''}`.trim(),
      reason: `${data.request?.reason || ''}`.trim(),
    };
    this.canApprove = !!data.canApprove;
    this.currentRole = data.currentRole || null;
  }

  get isOwnRequest(): boolean {
    return Number(this.request.empid || 0) === Number(this.login_id || 0);
  }

  get canEditRequestDetails(): boolean {
    if (this.currentRole === 'ROLE_EMPLOYEE' || this.currentRole === 'ROLE_MANAGER') {
      return this.isOwnRequest;
    }

    return false;
  }

  get dialogHint(): string {
    if (!this.canEditRequestDetails && this.canApprove) {
      return 'Only approval status can be edited for this swipe request.';
    }

    if (this.canEditRequestDetails && !this.canApprove) {
      return 'You can edit all swipe details for your own request. Approval status is available only to admin or managers reviewing employee requests.';
    }

    return '';
  }

  openTimePicker(input: HTMLInputElement): void {
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  save(): void {
    const selectedStatus = this.canApprove
      ? this.normalizeApprovalStatus(this.request.approved_status)
      : 'Pending';
    const approvalState = this.resolveApprovalState(selectedStatus);
    const payload = {
      ...this.request,
      id: Number(this.request.id || 0),
      empid: Number(this.request.empid || 0),
      request_date: this.normalizeDateValue(this.request.request_date),
      punch_time: this.formatToSeconds(this.request.punch_time),
      mode: `${this.request.mode || ''}`.trim(),
      reason: `${this.request.reason || ''}`.trim(),
      status: approvalState.approved_status,
      approved_status: approvalState.approved_status,
      approved_by: this.canApprove ? this.login_id : (this.request.approved_by || ''),
      isapproved: approvalState.isapproved,
      isactive: approvalState.isactive,
      isdelete: this.toBooleanValue(this.request.isdelete, false),
      manager_approval: approvalState.manager_approval,
      admin_approval: approvalState.admin_approval,
    };

    if (!payload.id || !payload.empid || !payload.request_date || !payload.mode || !payload.punch_time || !payload.reason) {
      this.feedback.warning('Fill all required fields before saving.');
      return;
    }

    this.submitting = true;
    this.apiService.editSwipeDetails(payload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.close({ message: 'Swipe request updated successfully.' });
        },
        error: (err: any) => {
          this.feedback.error(err.error?.message || 'Failed to update swipe request. Please try again.');
        },
      });
  }

  close(result?: { message?: string }): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.dialogRef.addPanelClass('employee-dialog-panel--closing');
    window.setTimeout(() => {
      this.dialogRef.close(result);
    }, this.drawerCloseDurationMs);
  }

  private formatToSeconds(time: string): string {
    const normalizedTime = `${time || ''}`.trim();
    if (!normalizedTime) {
      return '';
    }

    return normalizedTime.split(':').length >= 3 ? normalizedTime : `${normalizedTime}:00`;
  }

  private trimTimeSeconds(time: string): string {
    return this.formatToSeconds(time).slice(0, 5);
  }

  private normalizeDateValue(value: string | Date): string {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      return this.toIsoDate(value);
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value) === false) {
      return this.toIsoDate(parsedDate);
    }

    return `${value}`;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toBooleanValue(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    return ['true', '1', 'yes', 'y'].includes(`${value}`.trim().toLowerCase());
  }
  private normalizeApprovalStatus(value: unknown): 'Pending' | 'Approved' | 'Rejected' {
    const normalizedValue = `${value || ''}`.trim().toLowerCase();
    if (normalizedValue === 'approved') {
      return 'Approved';
    }

    if (normalizedValue === 'rejected' || normalizedValue === 'rejeted') {
      return 'Rejected';
    }

    return 'Pending';
  }

  private resolveApprovalState(selectedStatus: 'Pending' | 'Approved' | 'Rejected'): {
    approved_status: 'Pending' | 'Approved' | 'Rejected';
    isapproved: boolean;
    isactive: boolean;
    manager_approval: boolean;
    admin_approval: boolean;
  } {
    const currentManagerApproval = this.toBooleanValue(this.request.manager_approval, false);
    const currentAdminApproval = this.toBooleanValue(this.request.admin_approval, false);

    if (!this.canApprove || selectedStatus === 'Pending') {
      return {
        approved_status: 'Pending',
        isapproved: false,
        isactive: true,
        manager_approval: currentManagerApproval,
        admin_approval: currentAdminApproval,
      };
    }

    if (selectedStatus === 'Rejected') {
      return {
        approved_status: 'Rejected',
        isapproved: false,
        isactive: false,
        manager_approval: this.currentRole === 'ROLE_MANAGER' ? false : currentManagerApproval,
        admin_approval: this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY' ? false : currentAdminApproval,
      };
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return {
        approved_status: 'Pending',
        isapproved: false,
        isactive: true,
        manager_approval: true,
        admin_approval: currentAdminApproval,
      };
    }

    return {
      approved_status: 'Approved',
      isapproved: true,
      isactive: true,
      manager_approval: currentManagerApproval,
      admin_approval: true,
    };
  }
}
