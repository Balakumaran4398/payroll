import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './layout/header/header.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@NgModule({
  declarations: [MainLayoutComponent, HeaderComponent, SidebarComponent],
  imports: [CommonModule, RouterModule, SharedModule, MatIconModule],
  exports: [MainLayoutComponent, HeaderComponent, SidebarComponent],
})
export class CoreModule {}
