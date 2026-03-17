import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemePalette = 'ocean' | 'violet' | 'forest' | 'slate' | 'sunset' | 'indigo';
export type ThemeMode = 'light' | 'dark';

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  palette: ThemePalette;
  mode: ThemeMode;
  preview: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeStorageKey = 'rbac-theme-preset';

  readonly themePresets: ThemePreset[] = [
    {
      id: 'ocean-light',
      label: 'Ocean Light',
      description: 'Calm blue tones for everyday dashboards.',
      palette: 'ocean',
      mode: 'light',
      preview: 'linear-gradient(135deg, #2e4fae 0%, #33b4b2 100%)',
    },
    {
      id: 'ocean-dark',
      label: 'Ocean Dark',
      description: 'Night-friendly ocean contrast.',
      palette: 'ocean',
      mode: 'dark',
      preview: 'linear-gradient(135deg, #132966 0%, #1f3f8f 100%)',
    },
    {
      id: 'violet-light',
      label: 'Violet Light',
      description: 'Modern purple with clean highlights.',
      palette: 'violet',
      mode: 'light',
      preview: 'linear-gradient(135deg, #5a46c0 0%, #7b63f2 100%)',
    },
    {
      id: 'violet-dark',
      label: 'Violet Dark',
      description: 'Deep violet for focused work.',
      palette: 'violet',
      mode: 'dark',
      preview: 'linear-gradient(135deg, #2f2478 0%, #4f39a8 100%)',
    },
    {
      id: 'forest-light',
      label: 'Forest Light',
      description: 'Balanced green and mint accents.',
      palette: 'forest',
      mode: 'light',
      preview: 'linear-gradient(135deg, #1f7c70 0%, #34b98c 100%)',
    },
    {
      id: 'forest-dark',
      label: 'Forest Dark',
      description: 'Dark green palette with soft glow.',
      palette: 'forest',
      mode: 'dark',
      preview: 'linear-gradient(135deg, #17584f 0%, #1f6f64 100%)',
    },
    {
      id: 'slate-light',
      label: 'Slate Light',
      description: 'Neutral professional gray-blue.',
      palette: 'slate',
      mode: 'light',
      preview: 'linear-gradient(135deg, #3c5a8b 0%, #6288b9 100%)',
    },
    {
      id: 'slate-dark',
      label: 'Slate Dark',
      description: 'High-contrast slate for analytics.',
      palette: 'slate',
      mode: 'dark',
      preview: 'linear-gradient(135deg, #1f2f52 0%, #32446d 100%)',
    },
    {
      id: 'sunset-light',
      label: 'Sunset Light',
      description: 'Warm coral and amber blend.',
      palette: 'sunset',
      mode: 'light',
      preview: 'linear-gradient(135deg, #b85a46 0%, #e08d4b 100%)',
    },
    {
      id: 'sunset-dark',
      label: 'Sunset Dark',
      description: 'Muted warm tones for evening mode.',
      palette: 'sunset',
      mode: 'dark',
      preview: 'linear-gradient(135deg, #6d2f24 0%, #8e4a32 100%)',
    },
    {
      id: 'indigo-light',
      label: 'Indigo Light',
      description: 'Classic SaaS indigo palette.',
      palette: 'indigo',
      mode: 'light',
      preview: 'linear-gradient(135deg, #3f4ab4 0%, #5e76e2 100%)',
    },
    {
      id: 'indigo-dark',
      label: 'Indigo Dark',
      description: 'Deep indigo with subtle glow.',
      palette: 'indigo',
      mode: 'dark',
      preview: 'linear-gradient(135deg, #1f2c70 0%, #32429a 100%)',
    },
  ];

  private readonly presetSubject = new BehaviorSubject<ThemePreset>(this.themePresets[0]);
  readonly preset$ = this.presetSubject.asObservable();

  initializeTheme(): void {
    const savedPresetId = this.read(this.themeStorageKey);
    const matchedPreset = this.themePresets.find((preset) => preset.id === savedPresetId);
    const presetToApply = matchedPreset || this.themePresets[0];

    this.presetSubject.next(presetToApply);
    this.applyPresetToDocument(presetToApply);
  }

  applyThemeById(presetId: string): void {
    const matchedPreset = this.themePresets.find((preset) => preset.id === presetId);
    if (!matchedPreset) {
      return;
    }

    this.presetSubject.next(matchedPreset);
    this.persist(this.themeStorageKey, matchedPreset.id);
    this.applyPresetToDocument(matchedPreset);
  }

  get currentPresetId(): string {
    return this.presetSubject.value.id;
  }

  private applyPresetToDocument(preset: ThemePreset): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', preset.palette);
    root.setAttribute('data-mode', preset.mode);
  }

  private persist(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (_error) {
      // no-op when storage is blocked
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }
}
