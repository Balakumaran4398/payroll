import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-permission-view-dialog',
  templateUrl: './permission-view-dialog.component.html',
  styleUrls: ['./permission-view-dialog.component.scss']
})
export class PermissionViewDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { request: any },
    private dialogRef: MatDialogRef<PermissionViewDialogComponent>
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
