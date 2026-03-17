import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeComponent } from './pages/employee/employee.component';
import { EmployeeDetailsComponent } from './pages/employee-details/employee-details.component';

const routes: Routes = [{ path: '', component: EmployeeComponent },
  { path: 'employee_details', component: EmployeeDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {
  
}
