import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'rbac-admin-app';

  constructor(private themeService: ThemeService) {
    this.themeService.initializeTheme();
  }
}
