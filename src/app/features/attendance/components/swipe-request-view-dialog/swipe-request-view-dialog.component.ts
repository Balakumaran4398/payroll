import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-swipe-request-view-dialog',
  templateUrl: './swipe-request-view-dialog.component.html',
  styleUrls: ['./swipe-request-view-dialog.component.scss'],
})
export class SwipeRequestViewDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<SwipeRequestViewDialogComponent>
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
