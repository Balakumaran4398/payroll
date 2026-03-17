import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceComponent } from './pages/attendance/attendance.component';

@NgModule({
  declarations: [AttendanceComponent],
  imports: [SharedModule, AttendanceRoutingModule],
})
export class AttendanceModule {}
