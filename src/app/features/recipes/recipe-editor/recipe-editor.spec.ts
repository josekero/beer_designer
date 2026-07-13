import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../../core/services/api-repository.service';
import { ApplicationSettingsService } from '../../../core/services/application-settings.service';
import { BrewingCalculatorService } from '../../../core/services/brewing-calculator.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecipeStoreService } from '../../../core/services/recipe-store.service';
import { EquipmentProfile, Recipe } from '../../../models/brewing.models';
import { RecipeEditor } from './recipe-editor';

describe('RecipeEditor', () => {
  const pilot = { id: 'pilot-20l', name: 'Piloto', batchVolumeL: 20, boilVolumeL: 24, efficiencyPercent: 72, hopUtilizationPercent: 100 } as EquipmentProfile;
  const production = { id: 'production-500l', name: 'Producción', batchVolumeL: 500, boilVolumeL: 570, efficiencyPercent: 80, hopUtilizationPercent: 90 } as EquipmentProfile;
  const recipe: Recipe = {
    id: 'recipe-one', name: 'NEIPA', brewer: 'Guaja', untappdUrl: '', equipmentProfileId: pilot.id,
    mashProfileId: 'mash', carbonationProfileId: 'carbonation', fermentationProfileId: 'fermentation', glasswareId: 'teku',
    styleId: 'style-neipa', batchVolumeL: 20, efficiencyPercent: 72, boilVolumeL: 24,
    malts: [{ maltId: 'pale', amountKg: 4, notes: 'Base' }, { maltId: 'oats', amountKg: 1, notes: '' }],
    hops: [{ type: 'lúpulo', hopId: 'citra', amountG: 40, alphaAcids: 12, timeMin: 10, temperatureC: 80, use: 'whirlpool', notes: '' }],
    yeastId: 'verdant', yeasts: [{ yeastId: 'verdant', format: 'seca', amount: 11.5, unit: 'g', pitchTempC: 19, starterVolumeL: 0, notes: '' }],
    waterProfileId: 'neipa-water', waterAdditions: [{ saltId: 'gypsum', name: 'Gypsum', amountG: 3 }],
    mashSteps: [{ name: 'Macerado', temperatureC: 66, timeMin: 60 }],
    boilSteps: [{ name: 'Hervido', timeMin: 60, description: 'Vigoroso' }],
    processAdditions: [{ name: 'Servomyces', brand: '', amountG: 5, stage: 'hervido', timeMin: 10, temperatureC: 100, dayLabel: '', notes: '' }],
    maturationAdditions: [{ type: 'lúpulo', hopId: 'citra', name: 'Citra', batch: 'Primer dry hop', amount: 100, unit: 'g', addDay: 3, contactDays: 3, temperatureC: 18, notes: '' }],
    waterTreatment: { calcium: 144, magnesium: 15, sodium: 8, sulfate: 74, chloride: 180, bicarbonate: 197, mashPh: 5.3, spargePh: 5.6, notes: '' },
    fermentation: { primaryDays: 10, primaryTempC: 19, secondaryDays: 0, secondaryTempC: 18 },
    fermentationSteps: [{ stage: 'primaria', startDay: 0, durationDays: 10, temperatureC: 19, notes: '' }],
    dryHop: { enabled: true, days: 3, temperatureC: 18 }, packaging: { maturationDays: 14, carbonationVolumes: 2.4, method: 'Botella' },
    notes: '', version: 2, updatedAt: '2026-07-13T08:00:00Z'
  };
  const catalogData = {
    malts: [
      { id: 'pale', name: 'Pale Ale', colorSrm: 3, type: 'base', brand: 'Malt Co', potential: 1.037 },
      { id: 'oats', name: 'Oats', colorSrm: 2, type: 'adjunto', brand: '', potential: 1.033 }
    ],
    hops: [{ id: 'citra', name: 'Citra', format: 'pellet', alphaAcids: 12, country: 'US', brand: '', aromas: ['cítrico'] }],
    yeasts: [{ id: 'verdant', name: 'Verdant', type: 'ale', attenuationMin: 75, attenuationMax: 82, temperatureMin: 18, temperatureMax: 23, sensoryProfile: 'Frutal' }],
    adjuncts: [{ id: 'servo', name: 'Servomyces', format: 'polvo', category: 'nutriente', description: '' }],
    salts: [{ id: 'gypsum', name: 'Gypsum', formula: 'CaSO4', category: 'sal', description: '' }],
    styles: [{ id: 'style-neipa', name: 'Hazy IPA' }],
    waterProfiles: [{ id: 'neipa-water', calcium: 144, magnesium: 15, sodium: 8, sulfate: 74, chloride: 180, bicarbonate: 197, targetPh: 5.2 }],
    equipmentProfiles: [pilot, production],
    mashProfiles: [{ id: 'mash', mashTempC: 65, mashTimeMin: 60, mashOutTempC: 76, mashOutTimeMin: 10 }],
    fermentationProfiles: [{ id: 'fermentation', primaryDays: 8, primaryTempC: 20, secondaryDays: 2, secondaryTempC: 18, maturationDays: 10 }],
    carbonationProfiles: [{ id: 'carbonation', targetVolumes: 2.5, method: 'CO2' }],
    agingIngredients: []
  };

  let editor: RecipeEditor;
  let store: { getRecipe: ReturnType<typeof vi.fn>; saveRecipe: ReturnType<typeof vi.fn>; deleteRecipe: ReturnType<typeof vi.fn> };
  let api: { uploadRecipeImage: ReturnType<typeof vi.fn> };
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn>;
  let calculator: { calculate: ReturnType<typeof vi.fn>; compareToStyle: ReturnType<typeof vi.fn>; calculateHopIbu: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    store = {
      getRecipe: vi.fn(() => of(structuredClone(recipe))),
      saveRecipe: vi.fn((value: Recipe) => of({ ...value, updatedAt: '2026-07-13T10:00:00Z' })),
      deleteRecipe: vi.fn(() => of(undefined))
    };
    api = { uploadRecipeImage: vi.fn() };
    notifications = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    navigate = vi.fn(() => Promise.resolve(true));
    calculator = {
      calculate: vi.fn(() => ({ og: 1.06, fg: 1.014, abv: 6, ibu: 40, srm: 5 })),
      compareToStyle: vi.fn(() => [{ metric: 'og', inRange: true }]),
      calculateHopIbu: vi.fn(() => 12.5)
    };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: recipe.id })) } },
        { provide: Router, useValue: { navigate } },
        { provide: CatalogService, useValue: { catalog$: of(catalogData) } },
        { provide: RecipeStoreService, useValue: store },
        { provide: BrewingCalculatorService, useValue: calculator },
        { provide: ApiRepositoryService, useValue: api },
        { provide: NotificationService, useValue: notifications },
        { provide: ApplicationSettingsService, useValue: { language: () => 'es' } }
      ]
    });
    editor = TestBed.runInInjectionContext(() => new RecipeEditor());
    editor.ngOnInit();
  });

  it('carga la receta y construye los selectores del catálogo', () => {
    expect(store.getRecipe).toHaveBeenCalledWith(recipe.id);
    expect(editor.form.controls.name.value).toBe('NEIPA');
    expect(editor.canUploadImage).toBe(true);
    expect(editor.maltsArray.length).toBe(2);
    expect(editor.maltPickerItems[0]).toMatchObject({ id: 'pale', label: 'Pale Ale (3 SRM)' });
    expect(editor.hopPickerItems[0].meta).toContain('12% AA');
    expect(editor.yeastPickerItems[0].meta).toContain('75-82%');
    expect(editor.saltPickerItems[0].label).toBe('Gypsum');
  });

  it('gestiona filas, porcentajes, orden y sincronización de lúpulos', () => {
    expect(editor.maltPercent(0)).toBe(80);
    editor.addMalt('oats');
    editor.addHop('citra');
    editor.addBoilAdjunct('citra', 'servo');
    editor.addYeast('verdant');
    editor.addWaterAddition();
    editor.addProcessAddition();
    editor.addMaturationAddition('adjunto', 'citra', 'servo');
    editor.addFermentationStep('cold crash');
    editor.addFermentationStep('estabilización');
    editor.addMashStep();
    editor.addBoilStep();

    expect(editor.hopsArray.length).toBe(3);
    expect(editor.hopsArray.at(2).value).toMatchObject({ type: 'adjunto', adjunctId: 'servo' });
    expect(editor.fermentationStepsArray.at(1).value).toMatchObject({ stage: 'cold crash', durationDays: 2, temperatureC: 4 });
    editor.selectHop(0, 'citra');
    expect(editor.hopsArray.at(0).get('alphaAcids')?.value).toBe(12);
    expect(editor.hopIbu(0)).toBe(12.5);

    const stopped = vi.fn();
    editor.startRowDrag({ dataTransfer: {} as DataTransfer, stopPropagation: stopped } as unknown as DragEvent, editor.maltsArray, 0);
    editor.dropRow({ preventDefault: vi.fn() } as unknown as DragEvent, editor.maltsArray, 1);
    expect(stopped).toHaveBeenCalled();
    expect(editor.maltsArray.dirty).toBe(true);

    const before = editor.maltsArray.length;
    editor.removeAt(editor.maltsArray, 0);
    expect(editor.maltsArray.length).toBe(before - 1);
    editor.removeAnyAt(editor.processAdditionsArray, 0);
    expect(editor.processAdditionsArray.length).toBe(1);
  });

  it('aplica perfiles de agua, equipo, macerado, fermentación y carbonatación', () => {
    editor.applyWaterProfile('neipa-water');
    expect(editor.form.controls.waterTreatment.value).toMatchObject({ calcium: 144, chloride: 180, mashPh: 5.2 });
    editor.applyEquipmentProfile(production.id);
    expect(editor.form.value).toMatchObject({ batchVolumeL: 500, boilVolumeL: 570, efficiencyPercent: 80 });
    editor.applyMashProfile('mash');
    expect(editor.mashStepsArray.length).toBe(2);
    expect(editor.mashStepsArray.at(1).value.name).toBe('Mash out');
    editor.applyFermentationProfile('fermentation');
    expect(editor.form.controls.fermentation.value).toMatchObject({ primaryDays: 8, secondaryDays: 2 });
    expect(editor.form.controls.packaging.controls.maturationDays.value).toBe(10);
    editor.applyCarbonationProfile('carbonation');
    expect(editor.form.controls.packaging.value).toMatchObject({ carbonationVolumes: 2.5, method: 'CO2' });
  });

  it('calcula resumen visual y escala como modificación o como copia', () => {
    let summary: unknown;
    const subscription = editor.summary$.subscribe(value => summary = value);
    expect(summary).toMatchObject({ metrics: { srm: 5 }, glass: { id: 'teku' } });
    expect(calculator.compareToStyle).toHaveBeenCalled();

    editor.openScale();
    expect(editor.scaleOpen).toBe(true);
    expect(editor.scaleForm.controls.batchVolumeL.value).toBe(500);
    expect(editor.scalePreview?.grainFactor).toBeGreaterThan(20);
    editor.scaleForm.controls.createCopy.setValue(false);
    editor.applyScale();
    expect(editor.form.controls.batchVolumeL.value).toBe(500);
    expect(notifications.info).toHaveBeenCalledWith(expect.stringContaining('Escalado a 500 L'));

    editor.selectScaleProfile(pilot.id);
    editor.scaleForm.controls.createCopy.setValue(true);
    editor.applyScale();
    expect(store.saveRecipe).toHaveBeenCalled();
    expect(notifications.success).toHaveBeenCalledWith(expect.stringContaining('guardada como copia'));
    subscription.unsubscribe();
  });

  it('guarda, duplica y comunica fallos de validación y persistencia', () => {
    editor.form.controls.name.setValue('');
    editor.save();
    expect(notifications.error).toHaveBeenCalledWith(expect.stringContaining('campos marcados'));
    editor.form.controls.name.setValue('NEIPA');
    editor.save();
    expect(navigate).toHaveBeenCalledWith(['/recipes', recipe.id]);
    expect(editor.updatedAt).toBe('2026-07-13T10:00:00Z');

    store.saveRecipe.mockReturnValueOnce(throwError(() => new Error('backend')));
    editor.save();
    expect(notifications.error).toHaveBeenCalledWith(expect.stringContaining('No se pudo guardar'));
    editor.duplicate();
    expect(store.saveRecipe).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Copia de NEIPA', version: 1, image: undefined }));
  });

  it('elimina con confirmación y distingue recetas asociadas a elaboraciones', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    editor.deleteRecipe();
    expect(store.deleteRecipe).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    editor.deleteRecipe();
    expect(store.deleteRecipe).toHaveBeenCalledWith(recipe.id);
    expect(navigate).toHaveBeenCalledWith(['/recipes']);

    store.deleteRecipe.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    editor.deleteRecipe();
    expect(editor.recipeActionStatus).toContain('elaboraciones asociadas');
  });

  it('valida imágenes y procesa progreso, respuesta y errores de subida', () => {
    const invalid = { files: [new File(['x'], 'label.gif', { type: 'image/gif' })], value: 'label.gif' };
    editor.uploadImage({ target: invalid } as unknown as Event);
    expect(editor.imageStatus).toContain('JPG o PNG');
    expect(invalid.value).toBe('');

    const image = { url: '/images/one.png', originalName: 'one.png', contentType: 'image/png', sizeBytes: 10, width: 100, height: 100, uploadedAt: 'now' };
    api.uploadRecipeImage.mockReturnValueOnce(of(
      { type: HttpEventType.UploadProgress, loaded: 5, total: 10 },
      new HttpResponse({ body: image })
    ));
    const valid = { files: [new File(['image'], 'one.png', { type: 'image/png' })], value: 'one.png' };
    editor.uploadImage({ target: valid } as unknown as Event);
    expect(editor.imageUploadProgress).toBe(100);
    expect(editor.recipeImage?.url).toContain('/images/one.png?v=');
    expect(editor.uploadingImage).toBe(false);

    api.uploadRecipeImage.mockReturnValueOnce(throwError(() => ({ status: 413 })));
    editor.uploadImage({ target: { files: [new File(['image'], 'big.png', { type: 'image/png' })], value: 'big.png' } } as unknown as Event);
    expect(editor.imageStatus).toContain('supera el límite');
  });

  it('cierra los diálogos solo al pulsar su fondo', () => {
    const backdrop = {} as EventTarget;
    editor.scaleOpen = true;
    editor.imageViewerOpen = true;
    editor.closeScaleBackdrop({ target: backdrop, currentTarget: backdrop } as MouseEvent);
    editor.closeImageBackdrop({ target: backdrop, currentTarget: backdrop } as MouseEvent);
    expect(editor.scaleOpen).toBe(false);
    expect(editor.imageViewerOpen).toBe(false);
  });
});
