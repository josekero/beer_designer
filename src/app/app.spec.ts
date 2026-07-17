//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ApplicationUser } from './models/brewing.models';

const testUser: ApplicationUser = {
  id: 'user-1', email: 'brewer@example.com', displayName: 'Brewer', role: 'USER' as const,
  avatarKind: 'gallery' as const, avatarValue: 'amber-pint', passwordChangeRequired: false,
  createdAt: '2026-07-17T00:00:00Z'
};
const auth = { user: signal(testUser), ready: signal(true), load: vi.fn(() => of(testUser)), logout: vi.fn(() => of(undefined)) };

describe('App', () => {
  beforeEach(async () => {
    auth.user.set(testUser);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application shell', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Beer Designer');
    expect(compiled.querySelector('nav')?.textContent).toContain('Recetas');
  });

  it('toggles and closes the application menu', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.toggleApplicationMenu();
    expect(app.applicationMenuOpen()).toBe(true);
    app.closeApplicationMenu();
    expect(app.applicationMenuOpen()).toBe(false);
  });

  it('changes language and closes the menu', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const setLanguage = vi.spyOn(app.settings, 'setLanguage');
    app.applicationMenuOpen.set(true);
    app.selectLanguage('en');
    expect(setLanguage).toHaveBeenCalledWith('en');
    expect(app.applicationMenuOpen()).toBe(false);
  });

  it('changes the visual theme without closing settings', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const setTheme = vi.spyOn(app.settings, 'setTheme');
    app.applicationMenuOpen.set(true);
    app.selectTheme('brewery');
    expect(setTheme).toHaveBeenCalledWith('brewery');
    expect(app.applicationMenuOpen()).toBe(true);
  });

  it('changes the ingredient stock filter preference', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const setter = vi.spyOn(app.settings, 'setIngredientPickerStockOnly');
    app.setIngredientStockFilter(true);
    expect(setter).toHaveBeenCalledWith(true);
  });

  it('visually distinguishes the administrator workspace', () => {
    auth.user.set({ ...testUser, role: 'ADMIN', displayName: 'Beer Designer Admin' });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const shell = (fixture.nativeElement as HTMLElement).querySelector('.shell');
    expect(shell?.classList.contains('admin-shell')).toBe(true);
    expect(shell?.querySelector('.admin-badge')?.textContent).toContain('Admin');
  });
});
