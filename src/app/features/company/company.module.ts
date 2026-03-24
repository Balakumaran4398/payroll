import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { CompanyRoutingModule } from './company-routing.module';
import { HolidayDeleteDialogComponent } from './components/holiday-delete-dialog/holiday-delete-dialog.component';
import { HolidayFormDialogComponent } from './components/holiday-form-dialog/holiday-form-dialog.component';
import { CompanyComponent } from './pages/company/company.component';

@NgModule({
  declarations: [
    CompanyComponent,
    HolidayFormDialogComponent,
    HolidayDeleteDialogComponent,
  ],
  imports: [SharedModule, CompanyRoutingModule],
})
export class CompanyModule {}
