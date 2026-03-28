import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-leave-request-view-dialog',
  templateUrl: './leave-request-view-dialog.component.html',
  styleUrls: ['./leave-request-view-dialog.component.scss'],
})
export class LeaveRequestViewDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<LeaveRequestViewDialogComponent>
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
