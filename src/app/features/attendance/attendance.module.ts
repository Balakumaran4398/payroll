import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { AttendanceWorkflowComponent } from './pages/attendance-workflow/attendance-workflow.component';
import { OnDutyRequestViewDialogComponent } from './components/onduty-request-view-dialog/onduty-request-view-dialog.component';
import { OnDutyRequestFormDialogComponent } from './components/onduty-request-form-dialog/onduty-request-form-dialog.component';
import { OnDutyRequestDeleteDialogComponent } from './components/onduty-request-delete-dialog/onduty-request-delete-dialog.component';

@NgModule({
  declarations: [
    AttendanceComponent,
    AttendanceWorkflowComponent,
    OnDutyRequestViewDialogComponent,
    OnDutyRequestFormDialogComponent,
    OnDutyRequestDeleteDialogComponent,
  ],
  imports: [SharedModule, AttendanceRoutingModule],
})
export class AttendanceModule {}
