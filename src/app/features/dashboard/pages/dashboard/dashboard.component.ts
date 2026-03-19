import { Component, OnInit } from '@angular/core';
import { AuthService, AppRole } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  userRole: AppRole | null = null;

  constructor(public authService: AuthService) {
    this.userRole = this.authService.getRole();
  }

  ngOnInit(): void {
    console.log('Dashboard component initialized');
    console.log('User role:', this.userRole);
    console.log('Is authenticated:', this.authService.isAuthenticated());
  }
}
