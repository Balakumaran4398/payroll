import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
export type AppRole = 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

@Component({
  selector: 'app-leave-request-form-dialog',
  templateUrl: './leave-request-form-dialog.component.html',
  styleUrls: ['./leave-request-form-dialog.component.scss'],
})
export class LeaveRequestFormDialogComponent {
  private readonly drawerCloseDurationMs = 340; 
  private closing = false;
  submitting = false;
  documentLoading = false;
  request: any;
  leaveTypes: Array<{ id: number; leave_type: string; leave_code: string }> = [];
  readonly approvalStatusOptions = ['Pending', 'Approved', 'Rejected'];
  readonly canApprove: boolean;
  readonly currentRole: AppRole | null;
  readonly login_id: number;
  readonly dayTypes = [
    { value: 'full', label: 'Full Day' },
    { value: 'half', label: 'Half Day' },
  ];
  readonly endDayTypes = [
    { value: 'first_half', label: 'First Half' },
    { value: 'second_half', label: 'Second Half' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any; canApprove?: boolean; currentRole?: AppRole | null, leaveTypes: Array<{ id: number; leave_type: string; leave_code: string }> },
    private dialogRef: MatDialogRef<LeaveRequestFormDialogComponent>,
    private apiService: ApiService,
    private tokenService: TokenStorageService,
    private feedback: UiFeedbackService
  ) {
    this.request = { ...data.request };
    this.leaveTypes = Array.isArray(data.leaveTypes) ? [...data.leaveTypes] : [];
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
      return 'Only approval status can be edited for this leave request.';
    }

    if (this.canEditRequestDetails && !this.canApprove) {
      return 'You can edit all leave details for your own request. Approval status is available only to admin or managers reviewing employee requests.';
    }

    return '';
  }

  get isLeaveEndDayDisabled(): boolean {
    return !this.canEditRequestDetails || `${this.request.startDay || 'full'}`.trim().toLowerCase() === 'full';
  }

  get canViewDocument(): boolean {
    return !!`${this.request.doc_url || ''}`.trim() && !this.documentLoading;
  }

  get toDateMin(): Date | null {
    return this.parseDateOnly(this.request.fromDate);
  }

  get totalLeaveDays(): number {
    if (!this.request.fromDate || !this.request.toDate) {
      return 0;
    }

    const from = new Date(this.normalizeDateValue(this.request.fromDate));
    const to = new Date(this.normalizeDateValue(this.request.toDate));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return 0;
    }

    if (`${this.request.startDay || 'full'}`.trim().toLowerCase() === 'half' && from.getTime() === to.getTime()) {
      return 0.5;
    }

    const diff = Math.floor((to.getTime() - from.getTime()) / 86400000);
    return Math.max(diff + 1, 1);
  }

  onLeaveStartDayChange(value: string): void {
    const normalizedValue = `${value || 'full'}`.trim().toLowerCase();
    if (normalizedValue === 'full') {
      this.request.endDay = 'first_half';
      return;
    }

    if (`${this.request.endDay || ''}`.trim().toLowerCase() !== 'second_half') {
      this.request.endDay = 'first_half';
    }
  }

  onFromDateChange(value: string | Date): void {
    this.request.fromDate = this.normalizeDateValue(value);
    this.syncDateRange();
  }

  onToDateChange(value: string | Date): void {
    this.request.toDate = this.normalizeDateValue(value);
    this.syncDateRange();
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;

    if (!file) {
      return;
    }

    this.request.filename = file.name || '';
    this.documentLoading = true;

    const reader = new FileReader();
    reader.onload = () => {
      this.documentLoading = false;
      this.request.doc_url = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.onerror = () => {
      this.documentLoading = false;
      this.request.doc_url = '';
      this.request.filename = '';
      this.feedback.error('Failed to read the selected document. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  viewDocument(): void {
    const documentUrl = `${this.request.doc_url || ''}`.trim();
    if (!documentUrl) {
      this.feedback.warning('No uploaded document is available to view.');
      return;
    }

    const documentWindow = window.open(documentUrl, '_blank', 'noopener,noreferrer');
    if (!documentWindow) {
      this.feedback.warning('Unable to open the document. Please allow pop-ups and try again.');
    }
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
  save(): void {
    const selectedStatus = this.canApprove
      ? this.normalizeApprovalStatus(this.request.approved_status)
      : 'Pending';
    const approvalState = this.resolveApprovalState(selectedStatus);
    const payload = {
      ...this.request,
      id: Number(this.request.id || 0),
      empid: Number(this.request.empid || 0),
      leave_type_id: this.getSelectedLeaveTypeId(),
      fromdate: this.normalizeDateValue(this.request.fromDate),
      todate: this.normalizeDateValue(this.request.toDate),
      leave_mode: this.resolveLeaveMode(),
      totaldays: this.totalLeaveDays,
      reason: `${this.request.reason || ''}`.trim(),
      doc_url: this.request.doc_url || '',
      filename: this.request.filename || '',
      approved_by: this.canApprove ? this.login_id : (this.request.approved_by || ''),
      status: approvalState.status,
      approved_status: approvalState.approved_status,
      isapproved: approvalState.isapproved,
      isactive: approvalState.isactive,
      isdelete: this.toBooleanValue(this.request.isdelete, false),
      manager_approval: approvalState.manager_approval,
      admin_approval: approvalState.admin_approval,
    };

    if (!payload.id || !payload.empid || !payload.leave_type_id || !payload.fromdate || !payload.todate || !payload.reason) {
      this.feedback.warning('Fill all required fields before saving.');
      return;
    }

    if (this.documentLoading) {
      this.feedback.warning('Document is still loading. Please wait.');
      return;
    }

    this.submitting = true;
    this.apiService.editleavedetails(payload)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.close({ message: 'Leave request updated successfully.' });
        },
        error: (err:any) => {
          this.feedback.error(err.error?.message ||'Failed to update leave request. Please try again.');
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

  private getSelectedLeaveTypeId(): number {
    const leaveCode = `${this.request.leaveType || ''}`.trim();
    const selectedType = this.leaveTypes.find((item) => item.leave_code === leaveCode);
    return selectedType?.id || Number(this.request.leave_type_id || 0);
  }

  private resolveLeaveMode(): string {
    const normalizedStartDay = `${this.request.startDay || 'full'}`.trim().toLowerCase();
    if (normalizedStartDay === 'half') {
      return `${this.request.endDay || 'first_half'}`.trim().toLowerCase() === 'second_half' ? 'second_half' : 'first_half';
    }

    return 'full';
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

  private syncDateRange(): void {
    const normalizedFromDate = this.normalizeDateValue(this.request.fromDate);
    const normalizedToDate = this.normalizeDateValue(this.request.toDate);

    this.request.fromDate = normalizedFromDate;

    if (!normalizedFromDate) {
      this.request.toDate = normalizedToDate;
      return;
    }

    if (!normalizedToDate || normalizedToDate < normalizedFromDate) {
      this.request.toDate = normalizedFromDate;
      return;
    }

    this.request.toDate = normalizedToDate;
  }

  private parseDateOnly(value: string | Date): Date | null {
    const normalizedValue = this.normalizeDateValue(value);
    if (!normalizedValue) {
      return null;
    }

    const parsedDate = new Date(`${normalizedValue}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
