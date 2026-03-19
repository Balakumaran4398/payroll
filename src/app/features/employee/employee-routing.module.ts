import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeComponent } from './pages/employee/employee.component';
import { EmployeeListResolver } from './employee-list.resolver';

const routes: Routes = [
  {
    path: '',
    component: EmployeeComponent,
    resolve: {
      employeeData: EmployeeListResolver
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {

}
