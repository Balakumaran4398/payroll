import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-onduty-request-delete-dialog',
  templateUrl: './onduty-request-delete-dialog.component.html',
  styleUrls: ['./onduty-request-delete-dialog.component.scss'],
})
export class OnDutyRequestDeleteDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<OnDutyRequestDeleteDialogComponent>
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
