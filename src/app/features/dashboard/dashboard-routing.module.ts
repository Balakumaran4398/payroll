import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminRequestCenterComponent } from './pages/admin-request-center/admin-request-center.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  {
    path: 'requests',
    component: AdminRequestCenterComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ROLE_ADMIN'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
