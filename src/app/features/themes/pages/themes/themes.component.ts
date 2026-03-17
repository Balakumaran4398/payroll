import { Component } from '@angular/core';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-themes',
  templateUrl: './themes.component.html',
  styleUrls: ['./themes.component.scss'],
})
export class ThemesComponent {
  themeCards = this.themeService.themePresets;
  activeThemeId = this.themeService.currentPresetId;

  selectedThemeId = '';
  applyingThemeId = '';

  constructor(private themeService: ThemeService) {}

  selectTheme(themeId: string): void {
    this.selectedThemeId = themeId;
  }

  applySelectedTheme(themeId: string): void {
    this.applyingThemeId = themeId;

    setTimeout(() => {
      this.themeService.applyThemeById(themeId);
      this.activeThemeId = themeId;
      this.selectedThemeId = '';
      this.applyingThemeId = '';
    }, 800);
  }
}
