import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeComponent } from './pages/employee/employee.component';
import { EmployeeProfileDialogComponent } from './components/employee-profile-dialog/employee-profile-dialog.component';
import { EmployeeFormDialogComponent } from './components/employee-form-dialog/employee-form-dialog.component';
import { EmployeeDeleteDialogComponent } from './components/employee-delete-dialog/employee-delete-dialog.component';

@NgModule({
  declarations: [
    EmployeeComponent,
    EmployeeProfileDialogComponent,
    EmployeeFormDialogComponent,
    EmployeeDeleteDialogComponent,
  ],
  imports: [SharedModule, EmployeeRoutingModule],
})
export class EmployeeModule {}
