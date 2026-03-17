import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'src/app/shared/shared.module';
import { ThemesRoutingModule } from './themes-routing.module';
import { ThemesComponent } from './pages/themes/themes.component';

@NgModule({
  declarations: [ThemesComponent],
  imports: [SharedModule, ThemesRoutingModule, MatIconModule],
})
export class ThemesModule {}
