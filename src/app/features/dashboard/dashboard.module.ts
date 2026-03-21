import { NgModule } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminRequestCenterComponent } from './pages/admin-request-center/admin-request-center.component';
import { CompanyDashboardComponent } from './pages/company-dashboard/company-dashboard.component';
import { EmployeeDashboardComponent } from './pages/employee-dashboard/employee-dashboard.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AdminDashboardComponent,
    AdminRequestCenterComponent,
    CompanyDashboardComponent,
    EmployeeDashboardComponent
  ],
  imports: [SharedModule, NgChartsModule, DashboardRoutingModule],
})
export class DashboardModule {}
