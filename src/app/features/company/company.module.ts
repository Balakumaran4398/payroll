import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { CompanyRoutingModule } from './company-routing.module';
import { CompanyComponent } from './pages/company/company.component';

@NgModule({
  declarations: [CompanyComponent],
  imports: [SharedModule, CompanyRoutingModule],
})
export class CompanyModule {}
