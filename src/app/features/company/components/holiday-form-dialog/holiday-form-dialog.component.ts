import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import {
  HolidayFormDialogData,
  HolidayFormDialogResult,
  HolidayRecord_1,
  HolidayType,
} from '../../holiday-calendar.types';

@Component({
  selector: 'app-holiday-form-dialog',
  templateUrl: './holiday-form-dialog.component.html',
  styleUrls: ['./holiday-form-dialog.component.scss'],
})
export class HolidayFormDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  submitting = false;
  readonly title = this.data.mode === 'add' ? 'Add Holiday' : 'Edit Holiday';
  readonly actionLabel = this.data.mode === 'add' ? 'Save Holiday' : 'Update Holiday';
  readonly form = this.fb.group({
    date: [this.resolveInitialDate(), Validators.required],
    name: [this.data.holiday?.name || '', Validators.required],
    type: [this.data.holiday?.type || 'company', Validators.required],
    description: [this.data.holiday?.description || ''],
  });

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private tokenStorage: TokenStorageService,
    private feedback: UiFeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: HolidayFormDialogData,
    private dialogRef: MatDialogRef<HolidayFormDialogComponent>
  ) {}

  get selectedType(): HolidayType {
    return (this.form.get('type')?.value as HolidayType) || 'company';
  }

  submit(): void {
    if (this.submitting) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const date = this.form.get('date')?.value as Date | null;
    const name = `${this.form.get('name')?.value || ''}`.trim();
    const type = this.selectedType;
    const description = `${this.form.get('description')?.value || ''}`.trim();
    const companyid = Number(this.tokenStorage.getCompanyId() || this.tokenStorage.getID() || 0) || 0;
    const createdby = `${this.tokenStorage.getUsername() || ''}`.trim();

    if (!date || !name) {
      this.form.markAllAsTouched();
      return;
    }

    if (!companyid) {
      this.feedback.error('Company id is missing. Unable to save this holiday.');
      return;
    }

    if (!createdby) {
      this.feedback.error('Username is missing. Unable to save this holiday.');
      return;
    }

    const requestbody: HolidayRecord_1 = {
      companyid,
      title: name,
      holiday_date: this.formatDate(date),
      type,
      remarks: description || 'Holiday description not provided.',
      createdby,
      id: this.data.holiday?.holidayid,
    };

    const request$ = this.data.mode === 'add'
      ? this.apiService.createHoliday(requestbody)
      : this.apiService.editHoliday(requestbody);

    this.submitting = true;
    request$
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          const fallback = this.data.mode === 'add'
            ? `${name} created successfully.`
            : `${name} updated successfully.`;

          this.finish({
            reload: true,
            message: this.extractResponseMessage(response, fallback),
          });
        },
        error: (error) => {
          const fallback = this.data.mode === 'add'
            ? `Unable to create ${name}. Please try again.`
            : `Unable to update ${name}. Please try again.`;

          this.feedback.error(this.extractErrorMessage(error, fallback));
        },
      });
  }

  close(): void {
    if (this.submitting || this.closing) {
      return;
    }

    this.finish();
  }

  private finish(result?: HolidayFormDialogResult): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.dialogRef.addPanelClass('employee-dialog-panel--closing');
    window.setTimeout(() => {
      this.dialogRef.close(result);
    }, this.drawerCloseDurationMs);
  }

  private resolveInitialDate(): Date {
    if (this.data.holiday?.date) {
      return this.toDate(this.data.holiday.date);
    }

    return new Date(this.data.year, 0, 1);
  }

  private toDate(dateString: string): Date {
    return new Date(`${dateString}T00:00:00`);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
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
