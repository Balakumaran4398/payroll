import { Component } from '@angular/core';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-themes',
  templateUrl: './themes.component.html',
  styleUrls: ['./themes.component.scss'],
})
export class ThemesComponent {
  readonly themeCards = this.themeService.themePresets;
  selectedThemeId = '';
  applyingThemeId = '';

  constructor(private themeService: ThemeService) {}

  get activeThemeId(): string {
    return this.themeService.currentPresetId;
  }

  selectTheme(themeId: string): void {
    this.selectedThemeId = themeId;
  }

  applySelectedTheme(themeId: string): void {
    this.applyingThemeId = themeId;

    setTimeout(() => {
      this.themeService.applyThemeById(themeId);
      this.selectedThemeId = '';
      this.applyingThemeId = '';
    }, 400);
  }
}
