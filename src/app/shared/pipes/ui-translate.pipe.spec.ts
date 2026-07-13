import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationSettingsService } from '../../core/services/application-settings.service';
import { UiTranslatePipe } from './ui-translate.pipe';

describe('UiTranslatePipe', () => {
  const translate = vi.fn((value: string) => `translated:${value}`);
  let pipe: UiTranslatePipe;

  beforeEach(() => {
    translate.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: ApplicationSettingsService, useValue: { translate } }],
    });
    pipe = TestBed.runInInjectionContext(() => new UiTranslatePipe());
  });

  it('traduce texto y deja vacíos los valores ausentes', () => {
    expect(pipe.transform('Guardar')).toBe('translated:Guardar');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(translate).toHaveBeenCalledOnce();
  });
});
