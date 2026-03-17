import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './pages/reports/reports.component';

@NgModule({
  declarations: [ReportsComponent],
  imports: [SharedModule, ReportsRoutingModule],
})
export class ReportsModule {}
