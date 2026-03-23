import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';

@Component({
  selector: 'app-onduty-request-form-dialog',
  templateUrl: './onduty-request-form-dialog.component.html',
  styleUrls: ['./onduty-request-form-dialog.component.scss'],
})
export class OnDutyRequestFormDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;
  submitting = false;
  readonly approvalStatusOptions = ['Pending', 'Approved', 'Rejeted'];
  request: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<OnDutyRequestFormDialogComponent>,
    private apiService: ApiService,
    private feedback: UiFeedbackService
  ) {
    this.request = { ...data.request };
  }

  save(): void {
    const payload = {
      ...this.request,
      from_date: this.normalizeDateValue(this.request.from_date),
      to_date: this.normalizeDateValue(this.request.to_date),
      place_of_visit: `${this.request.place_of_visit || ''}`.trim(),
      purpose_of_visit: `${this.request.purpose_of_visit || ''}`.trim(),
      comments: `${this.request.comments || ''}`.trim(),
      approved_by: `${this.request.approved_by || ''}`.trim(),
      approved_status: `${this.request.approved_status || 'Pending'}`,
      isapproved: this.request.approved_status === 'Approved',
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
        error: () => {
          this.feedback.error('Failed to update OD request. Please try again.');
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
