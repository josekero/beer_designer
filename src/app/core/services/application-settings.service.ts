import { Injectable, computed, signal } from '@angular/core';

export type ApplicationLanguage = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'beer-designer.language';

const SHELL_TRANSLATIONS = {
  es: {
    subtitle: 'Recetas BJCP 2021',
    dashboard: 'Dashboard',
    recipes: 'Recetas',
    brewing: 'Elaboración',
    ingredients: 'Ingredientes',
    profiles: 'Perfiles',
    styles: 'Estilos BJCP',
    calculators: 'Calculadoras',
    applicationMenu: 'Menú de aplicación',
    settings: 'Configuración',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    currentLanguage: 'Idioma actual',
    closeNotification: 'Cerrar notificación'
  },
  en: {
    subtitle: 'BJCP 2021 Recipes',
    dashboard: 'Dashboard',
    recipes: 'Recipes',
    brewing: 'Brewing',
    ingredients: 'Ingredients',
    profiles: 'Profiles',
    styles: 'BJCP Styles',
    calculators: 'Calculators',
    applicationMenu: 'Application menu',
    settings: 'Settings',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    currentLanguage: 'Current language',
    closeNotification: 'Dismiss notification'
  }
} as const;

export type ShellTranslationKey = keyof typeof SHELL_TRANSLATIONS.es;

@Injectable({ providedIn: 'root' })
export class ApplicationSettingsService {
  readonly language = signal<ApplicationLanguage>(this.readLanguage());
  readonly text = computed(() => SHELL_TRANSLATIONS[this.language()]);

  constructor() {
    this.applyDocumentLanguage(this.language());
  }

  setLanguage(language: ApplicationLanguage): void {
    this.language.set(language);
    try {
      globalThis.localStorage?.setItem?.(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The preference remains active for this session when storage is unavailable.
    }
    this.applyDocumentLanguage(language);
  }

  private readLanguage(): ApplicationLanguage {
    try {
      const stored = globalThis.localStorage?.getItem?.(LANGUAGE_STORAGE_KEY);
      return stored === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  }

  private applyDocumentLanguage(language: ApplicationLanguage): void {
    document.documentElement.lang = language;
  }
}
