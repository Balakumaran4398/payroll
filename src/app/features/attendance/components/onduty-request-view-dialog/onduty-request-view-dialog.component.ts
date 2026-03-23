import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-onduty-request-view-dialog',
  templateUrl: './onduty-request-view-dialog.component.html',
  styleUrls: ['./onduty-request-view-dialog.component.scss'],
})
export class OnDutyRequestViewDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<OnDutyRequestViewDialogComponent>
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
