import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaySlipComponent } from './pages/pay-slip/pay-slip.component';
import { CtcComponent } from './pages/ctc/ctc.component';
import { CallLetterComponent } from './pages/call-letter/call-letter.component';

const routes: Routes = [
  { path: '', redirectTo: 'pay-slip', pathMatch: 'full' },
  { path: 'pay-slip', component: PaySlipComponent },
  { path: 'ctc', component: CtcComponent },
  { path: 'call-letter', component: CallLetterComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentsRoutingModule {}
