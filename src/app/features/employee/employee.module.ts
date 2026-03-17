import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeComponent } from './pages/employee/employee.component';
import { EmployeeDetailsComponent } from './pages/employee-details/employee-details.component';

@NgModule({
  declarations: [EmployeeComponent, EmployeeDetailsComponent],
  imports: [SharedModule, EmployeeRoutingModule],
})
export class EmployeeModule {}
