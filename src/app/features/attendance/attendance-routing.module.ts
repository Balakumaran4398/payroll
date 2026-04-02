import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { AttendanceDetailComponent } from './pages/attendance-detail/attendance-detail.component';
import { AttendanceWorkflowComponent } from './pages/attendance-workflow/attendance-workflow.component';
import { LeaveCreationComponent } from './pages/leave-creation/leave-creation.component';
import { LeaveManagementComponent } from './pages/leave-management/leave-management.component';

const routes: Routes = [
  {
    path: '',
    component: AttendanceComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'details/:employeeId',
    component: AttendanceDetailComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'apply-leave',
    component: AttendanceWorkflowComponent,
    canActivate: [RoleGuard],
    data: { workflow: 'apply-leave', roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'app-leave-management',
    component: LeaveManagementComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
  },
  {
    path: 'leave-creation',
    component: LeaveCreationComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER'] },
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
