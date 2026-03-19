import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee } from '../../employee.types';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

@Component({
  selector: 'app-employee-delete-dialog',
  templateUrl: './employee-delete-dialog.component.html',
  styleUrls: ['./employee-delete-dialog.component.scss'],
})
export class EmployeeDeleteDialogComponent {
  private readonly drawerCloseDurationMs = 340;
  private closing = false;
  emp_id: number;
  username: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee }, private apiservice: ApiService, private tokenservice: TokenStorageService,
    private dialogRef: MatDialogRef<EmployeeDeleteDialogComponent>
  ) {
    this.emp_id = data?.employee.id
    this.username = tokenservice.getUsername();
    console.log(this.username);
    console.log(this.emp_id);

  }

  confirm(): void {
    this.close(true);
    this.apiservice.getDeleteEmployee(this.emp_id, this.username).subscribe((res: any) => {
      console.log(res);
    })
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
