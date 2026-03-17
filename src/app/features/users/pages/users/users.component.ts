import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  users = [
    { name: 'John Admin', email: 'john@corp.com', role: 'Admin' },
    { name: 'Ava Company', email: 'ava@corp.com', role: 'Company' },
    { name: 'Ethan Staff', email: 'ethan@corp.com', role: 'Employee' },
  ];
}
