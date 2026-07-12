import { ApplicationSettingsService } from './application-settings.service';

describe('ApplicationSettingsService', () => {
  it('uses Spanish UI text by default', () => {
    const service = new ApplicationSettingsService();

    expect(service.language()).toBe('es');
    expect(service.translate('Guardar receta')).toBe('Guardar receta');
  });

  it('translates known UI text without changing unknown catalog data', () => {
    const service = new ApplicationSettingsService();
    service.setLanguage('en');

    expect(service.translate('Guardar receta')).toBe('Save recipe');
    expect(service.translate('Mosaic Cryo')).toBe('Mosaic Cryo');
  });
});
