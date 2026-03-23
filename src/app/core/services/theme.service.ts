import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemePalette =
  | 'ocean'
  | 'sky'
  | 'cobalt'
  | 'violet'
  | 'orchid'
  | 'rose'
  | 'sunset'
  | 'amber'
  | 'emerald'
  | 'forest'
  | 'slate'
  | 'graphite';
export type ThemeMode = 'light' | 'dark';

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  palette: ThemePalette;
  preview: string;
  previewAccent: string;
  previewSurface: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly paletteStorageKey = 'rbac-theme-palette';
  private readonly modeStorageKey = 'rbac-theme-mode';

  readonly themePresets: ThemePreset[] = [
    {
      id: 'ocean',
      label: 'Ocean',
      description: 'Balanced blue with clean teal accents.',
      palette: 'ocean',
      preview: '#2e4fae',
      previewAccent: '#33b4b2',
      previewSurface: '#edf2ff',
    },
    {
      id: 'sky',
      label: 'Sky',
      description: 'Bright blue theme with airy highlights.',
      palette: 'sky',
      preview: '#2386f6',
      previewAccent: '#7cc7ff',
      previewSurface: '#eef7ff',
    },
    {
      id: 'cobalt',
      label: 'Cobalt',
      description: 'Sharper blue for data-heavy screens.',
      palette: 'cobalt',
      preview: '#3452d1',
      previewAccent: '#8393ff',
      previewSurface: '#eef1ff',
    },
    {
      id: 'violet',
      label: 'Violet',
      description: 'Confident purple with a modern feel.',
      palette: 'violet',
      preview: '#6b4fd4',
      previewAccent: '#a187ff',
      previewSurface: '#f3efff',
    },
    {
      id: 'orchid',
      label: 'Orchid',
      description: 'Creative magenta-purple mix with soft contrast.',
      palette: 'orchid',
      preview: '#a24cc4',
      previewAccent: '#df95ff',
      previewSurface: '#f8efff',
    },
    {
      id: 'rose',
      label: 'Rose',
      description: 'Warm pink-red palette with gentle highlights.',
      palette: 'rose',
      preview: '#d14b7d',
      previewAccent: '#ff9ab7',
      previewSurface: '#fff0f5',
    },
    {
      id: 'sunset',
      label: 'Sunset',
      description: 'Warm orange with softer golden accents.',
      palette: 'sunset',
      preview: '#c7633f',
      previewAccent: '#f0a15c',
      previewSurface: '#fff3eb',
    },
    {
      id: 'amber',
      label: 'Amber',
      description: 'Golden color set suited for bold panels.',
      palette: 'amber',
      preview: '#b67a12',
      previewAccent: '#f2c566',
      previewSurface: '#fff8ea',
    },
    {
      id: 'emerald',
      label: 'Emerald',
      description: 'Fresh green with brighter mint accents.',
      palette: 'emerald',
      preview: '#1d8d67',
      previewAccent: '#48c89a',
      previewSurface: '#edf9f4',
    },
    {
      id: 'forest',
      label: 'Forest',
      description: 'Natural green with calm earthy depth.',
      palette: 'forest',
      preview: '#2a7d4d',
      previewAccent: '#75c87d',
      previewSurface: '#f0f8f2',
    },
    {
      id: 'slate',
      label: 'Slate',
      description: 'Professional gray-blue with restrained contrast.',
      palette: 'slate',
      preview: '#4f6987',
      previewAccent: '#9ab0c9',
      previewSurface: '#f1f5fa',
    },
    {
      id: 'graphite',
      label: 'Graphite',
      description: 'Soft charcoal palette for a cleaner neutral look.',
      palette: 'graphite',
      preview: '#5b6476',
      previewAccent: '#a6adba',
      previewSurface: '#f3f4f7',
    },
  ];

  private readonly presetSubject = new BehaviorSubject<ThemePreset>(this.themePresets[0]);
  private readonly modeSubject = new BehaviorSubject<ThemeMode>('light');
  readonly preset$ = this.presetSubject.asObservable();
  readonly mode$ = this.modeSubject.asObservable();

  initializeTheme(): void {
    const savedPresetId = this.read(this.paletteStorageKey);
    const savedMode = this.read(this.modeStorageKey);
    const matchedPreset = this.themePresets.find((preset) => preset.id === savedPresetId);
    const modeToApply: ThemeMode = savedMode === 'dark' ? 'dark' : 'light';
    const presetToApply = matchedPreset || this.themePresets[0];

    this.presetSubject.next(presetToApply);
    this.modeSubject.next(modeToApply);
    this.applyPresetToDocument(presetToApply, modeToApply);
  }

  applyThemeById(presetId: string): void {
    const matchedPreset = this.themePresets.find((preset) => preset.id === presetId);
    if (!matchedPreset) {
      return;
    }

    this.presetSubject.next(matchedPreset);
    this.persist(this.paletteStorageKey, matchedPreset.id);
    this.applyPresetToDocument(matchedPreset, this.currentMode);
  }

  get currentPresetId(): string {
    return this.presetSubject.value.id;
  }

  get currentPreset(): ThemePreset {
    return this.presetSubject.value;
  }

  get currentMode(): ThemeMode {
    return this.modeSubject.value;
  }

  toggleMode(): void {
    const nextMode: ThemeMode = this.currentMode === 'dark' ? 'light' : 'dark';
    this.setMode(nextMode);
  }

  setMode(mode: ThemeMode): void {
    this.modeSubject.next(mode);
    this.persist(this.modeStorageKey, mode);
    this.applyPresetToDocument(this.currentPreset, mode);
  }

  private applyPresetToDocument(preset: ThemePreset, mode: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', preset.palette);
    root.setAttribute('data-mode', mode);
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
