import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { DepartmentsRoutingModule } from './departments-routing.module';
import { DepartmentsComponent } from './pages/departments/departments.component';

@NgModule({
  declarations: [DepartmentsComponent],
  imports: [SharedModule, DepartmentsRoutingModule],
})
export class DepartmentsModule {}
