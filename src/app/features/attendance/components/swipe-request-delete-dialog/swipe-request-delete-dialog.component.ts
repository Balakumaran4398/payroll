import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-swipe-request-delete-dialog',
  templateUrl: './swipe-request-delete-dialog.component.html',
  styleUrls: ['./swipe-request-delete-dialog.component.scss'],
})
export class SwipeRequestDeleteDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<SwipeRequestDeleteDialogComponent>
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
