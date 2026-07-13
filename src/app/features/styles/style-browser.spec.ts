import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationSettingsService } from '../../core/services/application-settings.service';
import { CatalogService } from '../../core/services/catalog.service';
import { BjcpStyle } from '../../models/brewing.models';
import { StyleBrowser } from './style-browser';

describe('StyleBrowser', () => {
  const styles = [
    {
      id: '21a', code: '21A', name: 'American IPA', category: 'IPA',
      sensoryDescription: 'Citrus and hops', sensoryDescriptionEs: 'Cítrica y lupulada',
      srmMin: 6, srmMax: 10,
    },
    {
      id: '20c', code: '20C', name: 'Imperial Stout', category: 'Stout',
      sensoryDescription: 'Dark and roasted', sensoryDescriptionEs: undefined,
      srmMin: 30, srmMax: 40,
    },
  ] as BjcpStyle[];
  const language = signal<'es' | 'en'>('es');
  let browser: StyleBrowser;

  beforeEach(() => {
    language.set('es');
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogService, useValue: { styles$: of(styles) } },
        { provide: ApplicationSettingsService, useValue: { language } },
      ],
    });
    browser = TestBed.runInInjectionContext(() => new StyleBrowser());
  });

  it('agrupa categorías y filtra ignorando mayúsculas y acentos', () => {
    let result!: { categories: { name: string; count: number }[]; filteredStyles: BjcpStyle[] };
    const subscription = browser.vm$.subscribe((view) => result = view);

    expect(result!.categories).toEqual([
      { name: 'IPA', count: 1 },
      { name: 'Stout', count: 1 },
    ]);
    browser.searchControl.setValue('CITRICA');
    expect(result!.filteredStyles).toEqual([styles[0]]);
    browser.categoryControl.setValue('Stout');
    expect(result!.filteredStyles).toEqual([]);
    browser.searchControl.setValue('');
    expect(result!.filteredStyles).toEqual([styles[1]]);
    subscription.unsubscribe();
  });

  it('elige descripción por idioma, formatea rangos y cubre la escala SRM', () => {
    expect(browser.description(styles[0])).toBe('Cítrica y lupulada');
    expect(browser.description(styles[1])).toBe('Dark and roasted');
    language.set('en');
    expect(browser.description(styles[0])).toBe('Citrus and hops');
    expect(browser.range(null, 10)).toBe('N/A');
    expect(browser.range(1.04, 1.06)).toBe('1.04–1.06');

    const colors = [null, 2, 5, 8, 14, 20, 28, 40].map((srm) =>
      browser.getStyleColor({ srmMin: srm, srmMax: srm } as BjcpStyle),
    );
    expect(new Set(colors).size).toBe(8);
  });
});
