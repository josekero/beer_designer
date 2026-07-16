import { ApplicationSettingsService } from './application-settings.service';

describe('ApplicationSettingsService', () => {
  const stored = new Map<string, string>();

  beforeEach(() => {
    stored.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    });
  });

  afterEach(() => vi.unstubAllGlobals());
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

  it('applies the selected visual theme to the document', () => {
    const service = new ApplicationSettingsService();
    service.setTheme('brewery');

    expect(service.theme()).toBe('brewery');
    expect(document.documentElement.dataset['theme']).toBe('brewery');
  });

  it('persists the stock-only preference for recipe ingredient selectors', () => {
    const service = new ApplicationSettingsService();
    expect(service.ingredientPickerStockOnly()).toBe(false);
    service.setIngredientPickerStockOnly(true);
    expect(service.ingredientPickerStockOnly()).toBe(true);
    expect(stored.get('beer-designer.ingredients.stock-only')).toBe('true');
  });
});
