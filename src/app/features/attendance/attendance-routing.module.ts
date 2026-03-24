import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { AttendanceWorkflowComponent } from './pages/attendance-workflow/attendance-workflow.component';

const routes: Routes = [
  {
    path: '',
    component: AttendanceComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  },
  {
    path: 'apply-leave',
    component: AttendanceWorkflowComponent,
    canActivate: [RoleGuard],
    data: { workflow: 'apply-leave', roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'regularize-swipe',
    component: AttendanceWorkflowComponent,
    canActivate: [RoleGuard],
    data: { workflow: 'regularize-swipe', roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'permission-request',
    component: AttendanceWorkflowComponent,
    canActivate: [RoleGuard],
    data: { workflow: 'permission-request', roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'request-od',
    component: AttendanceWorkflowComponent,
    canActivate: [RoleGuard],
    data: { workflow: 'request-od', roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'raise-query',
    component: AttendanceWorkflowComponent,
    canActivate: [RoleGuard],
    data: { workflow: 'raise-query', roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceRoutingModule {}
