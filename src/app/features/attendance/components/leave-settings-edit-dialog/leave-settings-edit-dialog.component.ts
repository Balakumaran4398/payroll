import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { LeaveSettingRow, LeaveTypeOption } from '../../pages/leave-creation/leave-creation.component';

@Component({
  selector: 'app-leave-settings-edit-dialog',
  templateUrl: './leave-settings-edit-dialog.component.html',
  styleUrls: ['./leave-settings-edit-dialog.component.scss'],
})
export class LeaveSettingsEditDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  readonly request: LeaveSettingRow;
  readonly mode: 'create' | 'edit';
  readonly leaveTypeOptions: LeaveTypeOption[];
  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      row: LeaveSettingRow;
      companyId: number;
      createdby: string;
      mode?: 'create' | 'edit';
      leaveTypeOptions?: LeaveTypeOption[];
    },
    private dialogRef: MatDialogRef<LeaveSettingsEditDialogComponent>,
    private apiService: ApiService,
    private feedback: UiFeedbackService,
  ) {
    this.mode = data.mode || 'edit';
    this.leaveTypeOptions = Array.isArray(data.leaveTypeOptions) ? data.leaveTypeOptions : [];
    this.request = {
      ...data.row,
      companyId: Number(data.row?.companyId || data.companyId || 0) || 0,
      monthlyLimit: Number(data.row?.monthlyLimit || 0) || 0,
      yearlyLimit: Number(data.row?.yearlyLimit || 0) || 0,
    };
  }

  save(): void {
    const companyId = Number(this.request.companyId || this.data.companyId || 0) || 0;
    const createdby = `${this.data.createdby || ''}`.trim();
    const monthlyLimit = Number(this.request.monthlyLimit || 0);
    const yearlyLimit = Number(this.request.yearlyLimit || 0);

    if (!companyId) {
      this.feedback.warning('Company id is missing for this leave setting.');
      return;
    }

    if (!createdby) {
      this.feedback.warning('Created by value is missing for this leave setting.');
      return;
    }

    if (!this.request.leaveTypeId) {
      this.feedback.warning('Leave type is missing for this row.');
      return;
    }

    if (monthlyLimit < 0 || yearlyLimit < 0) {
      this.feedback.warning('Monthly and yearly limits cannot be negative.');
      return;
    }

    if (yearlyLimit < monthlyLimit) {
      this.feedback.warning('Yearly limit cannot be smaller than monthly limit.');
      return;
    }

    const now = new Date().toISOString();
    const listItem: any = {
      company_id: companyId,
      leave_type_id: Number(this.request.leaveTypeId || 0) || 0,
      monthly_limit: monthlyLimit,
      yearly_limit: yearlyLimit,
    };

    if (this.mode === 'edit' && Number(this.request.id || 0) > 0) {
      listItem.id = Number(this.request.id || 0) || 0;
      listItem.createddate = this.request.createddate || now;
      listItem.updateddate = now;
    }

    const payload = {
      company_id: companyId,
      createdby,
      list: [listItem],
    };

    this.submitting = true;
    this.apiService.updateleavesettings(payload)
      .pipe(finalize(() => {
        this.submitting = false;
      }))
      .subscribe({
        next: (response: any) => {
          const selectedLeaveType = this.leaveTypeOptions.find((item) => item.id === this.request.leaveTypeId);
          this.close({
            row: {
              ...this.request,
              id: Number(this.request.id || response?.id || this.request.leaveTypeId || 0) || 0,
              leaveType: this.request.leaveType || selectedLeaveType?.leaveType || '',
              leaveCode: this.request.leaveCode || selectedLeaveType?.leaveCode || '',
              companyId,
              monthlyLimit,
              yearlyLimit,
              createddate: this.request.createddate || now,
              updateddate: now,
            },
            message: this.extractResponseMessage(response, 'Leave settings updated successfully.'),
          });
        },
        error: (error: any) => {
          this.feedback.error(this.extractErrorMessage(error, 'Failed to update leave settings.'));
        },
      });
  }

  onLeaveTypeChange(leaveTypeId: number): void {
    const selectedLeaveType = this.leaveTypeOptions.find((item) => item.id === Number(leaveTypeId || 0));
    this.request.leaveTypeId = Number(leaveTypeId || 0) || 0;
    this.request.leaveType = selectedLeaveType?.leaveType || '';
    this.request.leaveCode = selectedLeaveType?.leaveCode || '';
  }

  close(result?: { row?: LeaveSettingRow; message?: string }): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.dialogRef.addPanelClass('employee-dialog-panel--closing');
    window.setTimeout(() => {
      this.dialogRef.close(result);
    }, this.drawerCloseDurationMs);
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
