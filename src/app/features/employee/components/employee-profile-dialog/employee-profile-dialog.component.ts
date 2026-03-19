import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee } from '../../employee.types';

@Component({
  selector: 'app-employee-profile-dialog',
  templateUrl: './employee-profile-dialog.component.html',
  styleUrls: ['./employee-profile-dialog.component.scss'],
})
export class EmployeeProfileDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee; imageUrl: string },
    private dialogRef: MatDialogRef<EmployeeProfileDialogComponent>
  ) {}

  close(): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.dialogRef.addPanelClass('employee-dialog-panel--closing');
    window.setTimeout(() => {
      this.dialogRef.close();
    }, this.drawerCloseDurationMs);
  }
}
