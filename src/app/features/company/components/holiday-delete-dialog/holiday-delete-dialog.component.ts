import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import {
  HolidayDelete,
  HolidayDeleteDialogData,
  HolidayDeleteDialogResult,
  HolidayRecord_1,
} from '../../holiday-calendar.types';

@Component({
  selector: 'app-holiday-delete-dialog',
  templateUrl: './holiday-delete-dialog.component.html',
  styleUrls: ['./holiday-delete-dialog.component.scss'],
})
export class HolidayDeleteDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  submitting = false;
  holidayId: number;
  constructor(
    private apiService: ApiService,
    private tokenStorage: TokenStorageService,
    private feedback: UiFeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: HolidayDeleteDialogData,
    private dialogRef: MatDialogRef<HolidayDeleteDialogComponent>
  ) {
    console.log(data);
    this.holidayId = this.data.holiday?.holidayid;

  }

  confirm(): void {
    if (this.submitting) {
      return;
    }

    const companyid = Number(this.tokenStorage.getCompanyId() || this.tokenStorage.getID() || 0) || 0;
    const createdby = `${this.tokenStorage.getUsername() || ''}`.trim();
    if (!this.holidayId) {
      this.feedback.error('Holiday ID is missing. Unable to delete this holiday.');
      return;
    }

    if (!createdby) {
      this.feedback.error('Username is missing. Unable to delete this holiday.');
      return;
    }

    this.submitting = true;
    this.apiService
      .getDeleteholiday(this.holidayId, createdby).pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.finish({
            deleted: true,
            message: this.extractResponseMessage(response, `${this.data.holiday.name} deleted successfully.`),
          });
        },
        error: (error) => {
          this.feedback.error(
            this.extractErrorMessage(error, `Unable to delete ${this.data.holiday.name}. Please try again.`)
          );
        },
      });
  }

  close(): void {
    if (this.submitting || this.closing) {
      return;
    }

    this.finish();
  }

  private finish(result?: HolidayDeleteDialogResult): void {
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
