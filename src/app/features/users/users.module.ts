import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { UsersRoutingModule } from './users-routing.module';
import { UsersComponent } from './pages/users/users.component';

@NgModule({
  declarations: [UsersComponent],
  imports: [SharedModule, UsersRoutingModule],
})
export class UsersModule {}
