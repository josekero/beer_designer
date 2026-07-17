//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ApplicationLanguage,
  ApplicationSettingsService,
  ApplicationTheme,
} from './core/services/application-settings.service';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly notifications = inject(NotificationService);
  readonly settings = inject(ApplicationSettingsService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly applicationMenuOpen = signal(false);

  constructor(){this.auth.load().subscribe();}

  toggleApplicationMenu(): void {
    this.applicationMenuOpen.update((open) => !open);
  }

  selectLanguage(language: ApplicationLanguage): void {
    this.settings.setLanguage(language);
    this.applicationMenuOpen.set(false);
  }

  selectTheme(theme: ApplicationTheme): void {
    this.settings.setTheme(theme);
  }

  setIngredientStockFilter(stockOnly: boolean): void {
    this.settings.setIngredientPickerStockOnly(stockOnly);
  }

  @HostListener('document:keydown.escape')
  closeApplicationMenu(): void {
    this.applicationMenuOpen.set(false);
  }

  logout():void{this.auth.logout().subscribe({next:()=>this.router.navigateByUrl('/login')});}
}
