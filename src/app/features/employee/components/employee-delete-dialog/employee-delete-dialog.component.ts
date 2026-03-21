import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee } from '../../employee.types';

@Component({
  selector: 'app-employee-delete-dialog',
  templateUrl: './employee-delete-dialog.component.html',
  styleUrls: ['./employee-delete-dialog.component.scss'],
})
export class EmployeeDeleteDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee },
    private dialogRef: MatDialogRef<EmployeeDeleteDialogComponent>
  ) {}

  confirm(): void {
    this.close(true);
  }

  close(confirmed = false): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.dialogRef.addPanelClass('employee-dialog-panel--closing');
    window.setTimeout(() => {
      this.dialogRef.close(confirmed);
    }, this.drawerCloseDurationMs);
  }
}
