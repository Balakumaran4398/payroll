import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'src/app/shared/shared.module';
import { DocumentsRoutingModule } from './documents-routing.module';
import { PaySlipComponent } from './pages/pay-slip/pay-slip.component';
import { CtcComponent } from './pages/ctc/ctc.component';
import { CallLetterComponent } from './pages/call-letter/call-letter.component';

@NgModule({
  declarations: [PaySlipComponent, CtcComponent, CallLetterComponent],
  imports: [SharedModule, DocumentsRoutingModule, MatIconModule],
})
export class DocumentsModule {}
