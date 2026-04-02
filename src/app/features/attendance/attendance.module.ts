import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SharedModule } from 'src/app/shared/shared.module';
import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { AttendanceDetailComponent } from './pages/attendance-detail/attendance-detail.component';
import { AttendanceWorkflowComponent } from './pages/attendance-workflow/attendance-workflow.component';
import { OnDutyRequestViewDialogComponent } from './components/onduty-request-view-dialog/onduty-request-view-dialog.component';
import { OnDutyRequestFormDialogComponent } from './components/onduty-request-form-dialog/onduty-request-form-dialog.component';
import { OnDutyRequestDeleteDialogComponent } from './components/onduty-request-delete-dialog/onduty-request-delete-dialog.component';
import { LeaveRequestViewDialogComponent } from './components/leave-request-view-dialog/leave-request-view-dialog.component';
import { LeaveRequestFormDialogComponent } from './components/leave-request-form-dialog/leave-request-form-dialog.component';
import { LeaveRequestDeleteDialogComponent } from './components/leave-request-delete-dialog/leave-request-delete-dialog.component';
import { PermissionViewDialogComponent } from './components/permission-view-dialog/permission-view-dialog.component';
import { PermissionEditDialogComponent } from './components/permission-edit-dialog/permission-edit-dialog.component';
import { PermissionDeleteDialogComponent } from './components/permission-delete-dialog/permission-delete-dialog.component';
import { SwipeRequestViewDialogComponent } from './components/swipe-request-view-dialog/swipe-request-view-dialog.component';
import { SwipeRequestEditDialogComponent } from './components/swipe-request-edit-dialog/swipe-request-edit-dialog.component';
import { SwipeRequestDeleteDialogComponent } from './components/swipe-request-delete-dialog/swipe-request-delete-dialog.component';
import { LeaveCreationComponent } from './pages/leave-creation/leave-creation.component';
import { LeaveSettingsEditDialogComponent } from './components/leave-settings-edit-dialog/leave-settings-edit-dialog.component';
import { LeaveManagementComponent } from './pages/leave-management/leave-management.component';

@NgModule({
  declarations: [
    AttendanceComponent,
    AttendanceDetailComponent,
    AttendanceWorkflowComponent,
    OnDutyRequestViewDialogComponent,
    OnDutyRequestFormDialogComponent,
    OnDutyRequestDeleteDialogComponent,
    LeaveRequestViewDialogComponent,
    LeaveRequestFormDialogComponent,
    LeaveRequestDeleteDialogComponent,
    PermissionViewDialogComponent,
    PermissionEditDialogComponent,
    PermissionDeleteDialogComponent,
    SwipeRequestViewDialogComponent,
    SwipeRequestEditDialogComponent,
    SwipeRequestDeleteDialogComponent,
    LeaveCreationComponent,
    LeaveSettingsEditDialogComponent,
    LeaveManagementComponent,
  ],
  imports: [
    SharedModule,
    AttendanceRoutingModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
})
export class AttendanceModule {}
