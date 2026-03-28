import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
export type AppRole = 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

@Component({
  selector: 'app-onduty-request-form-dialog',
  templateUrl: './onduty-request-form-dialog.component.html',
  styleUrls: ['./onduty-request-form-dialog.component.scss'],
})
export class OnDutyRequestFormDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;
  submitting = false;
  readonly approvalStatusOptions = ['Pending', 'Approved', 'Rejected'];
  request: any;
  login_id: number;
  readonly canApprove: boolean;
  readonly currentRole: AppRole | null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any; canApprove?: boolean; currentRole?: AppRole | null },
    private dialogRef: MatDialogRef<OnDutyRequestFormDialogComponent>,
    private apiService: ApiService, private tokenService: TokenStorageService,
    private feedback: UiFeedbackService
  ) {
    this.login_id = tokenService.getID();
    this.request = { ...data.request };
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
      return 'Only approval status can be edited for this OD request.';
    }

    if (this.canEditRequestDetails && !this.canApprove) {
      return 'You can edit all OD details for your own request. Approval status is available only to admin or managers reviewing employee requests.';
    }

    return '';
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
      from_date: this.normalizeDateValue(this.request.from_date),
      to_date: this.normalizeDateValue(this.request.to_date),
      place_of_visit: `${this.request.place_of_visit || ''}`.trim(),
      purpose_of_visit: `${this.request.purpose_of_visit || ''}`.trim(),
      comments: `${this.request.comments || ''}`.trim(),
      approved_by: this.canApprove ? this.login_id : (this.request.approved_by || ''),
      approved_status: approvalState.approved_status,
      isapproved: approvalState.isapproved,
      isactive: approvalState.isactive,
      isdelete: this.toBooleanValue(this.request.isdelete, false),
      manager_approval: approvalState.manager_approval,
      admin_approval: approvalState.admin_approval,
    };

    if (!payload.id || !payload.from_date || !payload.to_date || !payload.place_of_visit || !payload.purpose_of_visit) {
      this.feedback.warning('Fill all required fields before saving.');
      return;
    }

    this.submitting = true;
    this.apiService.getEditOnduty(payload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.close({ message: 'OD request updated successfully.' });
        },
        error: (err:any) => {
          console.log(err.error?.message);
          
          this.feedback.error(err.error?.message || 'Failed to update OD request. Please try again.');
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
}
