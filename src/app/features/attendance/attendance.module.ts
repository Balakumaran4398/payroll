import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { AttendanceWorkflowComponent } from './pages/attendance-workflow/attendance-workflow.component';

@NgModule({
  declarations: [AttendanceComponent, AttendanceWorkflowComponent],
  imports: [SharedModule, AttendanceRoutingModule],
})
export class AttendanceModule {}
