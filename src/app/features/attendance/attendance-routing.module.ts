import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { AttendanceWorkflowComponent } from './pages/attendance-workflow/attendance-workflow.component';

const routes: Routes = [
  { path: '', component: AttendanceComponent },
  {
    path: 'apply-leave',
    component: AttendanceWorkflowComponent,
    data: { workflow: 'apply-leave' },
  },
  {
    path: 'regularize-swipe',
    component: AttendanceWorkflowComponent,
    data: { workflow: 'regularize-swipe' },
  },
  {
    path: 'permission-request',
    component: AttendanceWorkflowComponent,
    data: { workflow: 'permission-request' },
  },
  {
    path: 'request-od',
    component: AttendanceWorkflowComponent,
    data: { workflow: 'request-od' },
  },
  {
    path: 'raise-query',
    component: AttendanceWorkflowComponent,
    data: { workflow: 'raise-query' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceRoutingModule {}
