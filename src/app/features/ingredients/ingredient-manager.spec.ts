import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Adjunct, AgingIngredient, BrewingSalt, Hop, Malt, Yeast } from '../../models/brewing.models';
import { IngredientManager } from './ingredient-manager';

describe('IngredientManager', () => {
  const hop = { id: 'citra', name: 'Citra', brand: '', country: 'US', alphaAcids: 12, betaAcids: 4, format: 'pellet', recommendedUse: ['hervido', 'whirlpool'], aromas: ['cítrico'], description: '' } as Hop;
  const malt = { id: 'pale', name: 'Pale Ále', brand: '', type: 'base', potential: 1.037, colorSrm: 3, diastaticPower: 50, maxRecommendedPercent: 100, description: '' } as Malt;
  const yeast = { id: 'verdant', name: 'Verdant', brand: '', laboratory: 'Lallemand', type: 'ale', attenuationMin: 75, attenuationMax: 82, temperatureMin: 18, temperatureMax: 23, flocculation: 'media', alcoholTolerance: 12, sensoryProfile: 'Frutal' } as Yeast;
  const adjunct = { id: 'cacao', name: 'Cacao', brand: '', category: 'especia', format: 'nibs', recommendedUse: ['maduración'], dosageGuidance: '5 g/L', fermentabilityPercent: 0, allergens: '', description: '' } as Adjunct;
  const aging = { id: 'oak', name: 'Roble', brand: '', type: 'chips', woodType: 'roble americano', previousUse: 'bourbon', origin: '', barrelDetails: '', intensity: 'media', contactTimeDaysMin: 14, contactTimeDaysMax: 30, description: '' } as AgingIngredient;
  const salt = { id: 'gypsum', name: 'Sulfato de calcio', formula: 'CaSO4', category: 'sal mineral', calciumPercent: 23, magnesiumPercent: 0, sodiumPercent: 0, sulfatePercent: 56, chloridePercent: 0, bicarbonatePercent: 0, description: '' } as BrewingSalt;
  const catalogData = {
    hops: [hop], malts: [malt], yeasts: [yeast], adjuncts: [adjunct], agingIngredients: [aging], salts: [salt],
    waterProfiles: [], styles: [], equipmentProfiles: [], mashProfiles: [], carbonationProfiles: [], fermentationProfiles: []
  };

  let manager: IngredientManager;
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let refresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refresh = vi.fn();
    api = {
      saveHop: vi.fn((value: Hop) => of(value)),
      saveMalt: vi.fn((value: Malt) => of(value)),
      saveYeast: vi.fn((value: Yeast) => of(value)),
      saveAdjunct: vi.fn((value: Adjunct) => of(value)),
      saveAgingIngredient: vi.fn((value: AgingIngredient) => of(value)),
      saveSalt: vi.fn((value: BrewingSalt) => of(value)),
      setIngredientStock: vi.fn((type: string, id: string, inStock: boolean) => of({ ingredientType: type, ingredientId: id, inStock })),
      deleteIngredient: vi.fn(() => of(undefined)),
      importHopsXml: vi.fn(() => of({ type: 'hops', imported: 1 })),
      importMaltsXml: vi.fn(() => of({ type: 'malts', imported: 1 })),
      importYeastsXml: vi.fn(() => of({ type: 'yeasts', imported: 1 })),
      importAdjunctsXml: vi.fn(() => of({ type: 'adjuncts', imported: 1 })),
      importAgingIngredientsXml: vi.fn(() => of({ type: 'aging', imported: 1 }))
    };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: vi.fn(() => 'hops') } } } },
        { provide: CatalogService, useValue: { catalog$: of(catalogData), refresh } },
        { provide: ApiRepositoryService, useValue: api }
      ]
    });
    manager = TestBed.runInInjectionContext(() => new IngredientManager());
    manager.auth.user.set({
      id: 'user-one', email: 'user@example.com', displayName: 'User', role: 'USER',
      avatarKind: 'gallery', avatarValue: 'amber-pint', passwordChangeRequired: false, createdAt: ''
    });
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('filtra el catálogo ignorando mayúsculas y acentos', () => {
    let items: unknown[] = [];
    const subscription = manager.vm$.subscribe(vm => items = vm.items);
    manager.selectType('malts');
    manager.searchControl.setValue('pale ale');
    expect(items).toEqual([malt]);

    manager.searchControl.setValue('no existe');
    expect(items).toEqual([]);
    subscription.unsubscribe();
  });

  it('filtra y actualiza visualmente el stock por tipo de ingrediente', () => {
    hop.inStock = true;
    let items: unknown[] = [];
    const subscription = manager.vm$.subscribe(vm => items = vm.items);
    manager.stockOnlyControl.setValue(true);
    expect(items).toEqual([hop]);

    manager.toggleStock(hop);
    expect(api['setIngredientStock']).toHaveBeenCalledWith('hops', 'citra', false);
    expect(refresh).toHaveBeenCalledOnce();
    expect(manager.statusControl.value).toContain('sin stock');
    subscription.unsubscribe();
    hop.inStock = undefined;
  });

  it('crea formularios con valores iniciales apropiados para cada tipo', () => {
    manager.selectType('hops');
    expect(manager.hopForm.value).toMatchObject({ name: '', format: 'pellet', alphaAcids: 8 });
    manager.selectType('malts');
    expect(manager.maltForm.value).toMatchObject({ type: 'base', maxRecommendedPercent: 100 });
    manager.selectType('yeasts');
    expect(manager.yeastForm.value).toMatchObject({ type: 'ale', attenuationMin: 70 });
    manager.selectType('adjuncts');
    expect(manager.adjunctForm.value).toMatchObject({ category: 'fruta', format: 'puré' });
    manager.selectType('aging');
    expect(manager.agingForm.value).toMatchObject({ woodType: 'roble americano', contactTimeDaysMin: 14 });
    manager.selectType('salts');
    expect(manager.saltForm.value).toMatchObject({ category: 'sal mineral', calciumPercent: 0 });
    expect(manager.selectedIdControl.value).toBe('');
  });

  it('limpia el ingrediente seleccionado al iniciar uno nuevo', () => {
    manager.selectIngredient(hop);
    expect(manager.hopForm.controls.name.value).toBe('Citra');

    manager.createNew();

    expect(manager.selectedIdControl.value).toBe('');
    expect(manager.hopForm.controls.name.value).toBe('');
    expect(manager.hopForm.controls.brand.value).toBe('');
    expect(manager.statusControl.value).toContain('ingrediente nuevo');
  });

  it('carga en el formulario cualquier ingrediente seleccionado', () => {
    const cases = [
      ['hops', hop, manager.hopForm],
      ['malts', malt, manager.maltForm],
      ['yeasts', yeast, manager.yeastForm],
      ['adjuncts', adjunct, manager.adjunctForm],
      ['aging', aging, manager.agingForm],
      ['salts', salt, manager.saltForm]
    ] as const;

    for (const [type, item, form] of cases) {
      manager.selectType(type);
      manager.selectIngredient(item);
      expect(manager.selectedIdControl.value).toBe(item.id);
      expect(form.controls.name.value).toBe(item.name);
    }
    expect(manager.hopForm.controls.recommendedUse.value).toBe('hervido, whirlpool');
    expect(manager.adjunctForm.controls.recommendedUse.value).toBe('maduración');
  });

  it('valida y guarda todos los tipos actualizando catálogo y estado', () => {
    const cases = [
      ['hops', hop, 'saveHop'],
      ['malts', malt, 'saveMalt'],
      ['yeasts', yeast, 'saveYeast'],
      ['adjuncts', adjunct, 'saveAdjunct'],
      ['aging', aging, 'saveAgingIngredient'],
      ['salts', salt, 'saveSalt']
    ] as const;

    manager.selectType('hops');
    manager.createNew();
    manager.save();
    expect(api['saveHop']).not.toHaveBeenCalled();

    for (const [type, item, method] of cases) {
      manager.selectType(type);
      manager.selectIngredient(item);
      manager.save();
      expect(api[method]).toHaveBeenCalledOnce();
      expect(manager.statusControl.value).toContain(item.name);
    }
    expect(refresh).toHaveBeenCalledTimes(6);
  });

  it('importa XML con el endpoint correspondiente y limpia el selector', async () => {
    const cases = [
      ['hops', 'importHopsXml'],
      ['malts', 'importMaltsXml'],
      ['yeasts', 'importYeastsXml'],
      ['adjuncts', 'importAdjunctsXml'],
      ['aging', 'importAgingIngredientsXml']
    ] as const;

    for (const [type, method] of cases) {
      manager.selectType(type);
      const input = { files: [{ text: () => Promise.resolve('<ROOT/>') }], value: 'catalog.xml' };
      manager.importXml({ target: input } as unknown as Event);
      await Promise.resolve();
      expect(api[method]).toHaveBeenCalledWith('<ROOT/>');
      expect(input.value).toBe('');
    }
    manager.importXml({ target: { files: [] } } as unknown as Event);
    expect(refresh).toHaveBeenCalledTimes(5);
  });

  it('solo permite borrar ingredientes propios o del sistema siendo administrador', () => {
    const personal = { ...hop, id: 'user-one-citra', ownerId: 'user-one' };
    expect(manager.canDelete(personal)).toBe(true);
    expect(manager.canDelete(hop)).toBe(false);

    manager.selectIngredient(personal);
    manager.deleteIngredient(personal);

    expect(api['deleteIngredient']).toHaveBeenCalledWith('hops', personal.id);
    expect(manager.selectedIdControl.value).toBe('');
    expect(manager.statusControl.value).toContain('Ingrediente eliminado');
    expect(refresh).toHaveBeenCalledOnce();

    manager.auth.user.update(user => user ? { ...user, role: 'ADMIN' } : user);
    expect(manager.canDelete(hop)).toBe(true);
    expect(manager.canDelete(personal)).toBe(false);
  });
});
