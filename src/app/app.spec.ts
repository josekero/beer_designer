//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
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
});
