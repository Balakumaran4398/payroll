import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
export type AppRole = 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

@Component({
  selector: 'app-permission-edit-dialog',
  templateUrl: './permission-edit-dialog.component.html',
  styleUrls: ['./permission-edit-dialog.component.scss']
})
export class PermissionEditDialogComponent {
  login_id: number;
  request: any;
  private closing = false;
  submitting = false;
  documentLoading = false;
  private readonly drawerCloseDurationMs = 340;
  readonly permissionTypes = ['IN', 'OUT'];
  readonly canApprove: boolean;
  readonly currentRole: AppRole | null;
  readonly approvalStatusOptions = ['Pending', 'Approved', 'Rejected'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any; canApprove?: boolean; currentRole?: AppRole | null },
    private dialogRef: MatDialogRef<PermissionEditDialogComponent>,
    private apiService: ApiService,
    private tokenService: TokenStorageService,
    private feedback: UiFeedbackService
  ) {
    this.request = { ...data.request };
    this.canApprove = !!data.canApprove;
    this.currentRole = data.currentRole || null;

    this.login_id = this.tokenService.getID();
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
      return 'Only approval status can be edited for this permission request.';
    }

    if (this.canEditRequestDetails && !this.canApprove) {
      return 'You can edit all permission details for your own request. Approval status is available only to admin or managers reviewing employee requests.';
    }

    return '';
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

    const normalizedValue = `${value}`.trim().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(normalizedValue);
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
    status: 'Pending' | 'Approved' | 'Rejected';
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
        status: 'Pending',
        approved_status: 'Pending',
        isapproved: false,
        isactive: true,
        manager_approval: currentManagerApproval,
        admin_approval: currentAdminApproval,
      };
    }

    if (selectedStatus === 'Rejected') {
      return {
        status: 'Rejected',
        approved_status: 'Rejected',
        isapproved: false,
        isactive: false,
        manager_approval: this.currentRole === 'ROLE_MANAGER' ? false : currentManagerApproval,
        admin_approval: this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ROLE_COMPANY' ? false : currentAdminApproval,
      };
    }

    if (this.currentRole === 'ROLE_MANAGER') {
      return {
        status: 'Pending',
        approved_status: 'Pending',
        isapproved: false,
        isactive: true,
        manager_approval: true,
        admin_approval: currentAdminApproval,
      };
    }

    return {
      status: 'Approved',
      approved_status: 'Approved',
      isapproved: true,
      isactive: true,
      manager_approval: currentManagerApproval,
      admin_approval: true,
    };
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
    console.log(approvalState);

    const payload = {
      ...this.request,
      id: Number(this.request.id || 0),
      empid: Number(this.request.empid || 0),
      request_date: this.normalizeDateValue(this.request.request_date),
      mode: `${this.request.mode || ''}`.trim(),
      starttime: this.formatToSeconds(this.request.starttime),
      endtime: this.formatToSeconds(this.request.endtime),
      reason: `${this.request.reason || ''}`.trim(),
      manager_approval: approvalState.manager_approval,
      admin_approval: approvalState.admin_approval,
      approved_by: this.canApprove ? this.login_id : (this.request.approved_by || ''),
      status: approvalState.approved_status,
      approved_status: approvalState.approved_status,
      isapproved: approvalState.isapproved,
      isactive: approvalState.isactive,
      isdelete: this.toBooleanValue(this.request.isdelete, false),
    };

    if (!payload.id || !payload.empid || !payload.request_date || !payload.mode || !payload.starttime || !payload.endtime || !payload.reason) {
      this.feedback.warning('Fill all required fields before saving.');
      return;
    }

    if (this.documentLoading) {
      this.feedback.warning('Document is still loading. Please wait.');
      return;
    }

    this.submitting = true;
    this.apiService.editPermissiontails(payload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.close({ message: 'permission request updated successfully.' });
        },
        error: (err: any) => {
          this.feedback.error(err.error?.message || 'Failed to update permission request. Please try again.');
        },
      });
  }

  private formatToSeconds(time: string): string {
    const normalizedTime = `${time || ''}`.trim();
    if (!normalizedTime) {
      return '';
    }

    return normalizedTime.split(':').length >= 3 ? normalizedTime : `${normalizedTime}:00`;
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
}
