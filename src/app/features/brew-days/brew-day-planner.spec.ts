import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { BrewingCalculatorService } from '../../core/services/brewing-calculator.service';
import { CatalogService } from '../../core/services/catalog.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { BrewDay, Recipe } from '../../models/brewing.models';
import { BrewDayPlanner } from './brew-day-planner';

describe('BrewDayPlanner', () => {
  const recipe: Recipe = {
    id: 'recipe-neipa',
    name: 'NEIPA de prueba',
    brewer: 'Guaja',
    styleId: '21C',
    batchVolumeL: 20,
    efficiencyPercent: 75,
    boilVolumeL: 25,
    malts: [{ maltId: 'pale', amountKg: 4, notes: 'Base' }],
    hops: [
      { type: 'lúpulo', hopId: 'citra', amountG: 30, alphaAcids: 12, timeMin: 10, temperatureC: 100, use: 'hervido' },
      { type: 'lúpulo', hopId: 'mosaic', amountG: 50, alphaAcids: 13, timeMin: 0, temperatureC: 18, use: 'dry hop' },
      { type: 'adjunto', adjunctId: 'servo', amountG: 5, alphaAcids: 0, timeMin: 10, temperatureC: 100, use: 'hervido', notes: 'Nutriente' }
    ],
    yeastId: 'verdant',
    yeasts: [{ yeastId: 'verdant', format: 'seca', amount: 11, unit: 'g', pitchTempC: 19, starterVolumeL: 0, notes: 'Directa' }],
    waterProfileId: 'neipa',
    waterAdditions: [],
    mashSteps: [],
    boilSteps: [],
    processAdditions: [{ name: 'Irish Moss', brand: '', amountG: 2, stage: 'hervido', timeMin: 10, temperatureC: 100, dayLabel: '', notes: 'Clarificante' }],
    maturationAdditions: [{ type: 'adjunto', adjunctId: 'cacao', name: 'Cacao', batch: 'Maduración', amount: 200, unit: 'g', addDay: 7, contactDays: 3, temperatureC: 18, notes: 'Nibs' }],
    waterTreatment: { calcium: 144, magnesium: 15, sodium: 8, sulfate: 74, chloride: 180, bicarbonate: 197, mashPh: 5.3, spargePh: 5.6, notes: 'Cloruro 2:1' },
    fermentation: { primaryDays: 10, primaryTempC: 19, secondaryDays: 0, secondaryTempC: 18 },
    fermentationSteps: [],
    dryHop: { enabled: true, days: 3, temperatureC: 18 },
    packaging: { maturationDays: 7, carbonationVolumes: 2.4, method: 'CO2' },
    notes: 'Receta para pruebas'
  };

  let planner: BrewDayPlanner;
  let api: {
    getBrewDays: ReturnType<typeof vi.fn>;
    saveBrewDay: ReturnType<typeof vi.fn>;
    deleteBrewDay: ReturnType<typeof vi.fn>;
  };
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let detectChanges: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    api = {
      getBrewDays: vi.fn(() => of([])),
      saveBrewDay: vi.fn((brewDay: BrewDay) => of(brewDay)),
      deleteBrewDay: vi.fn(() => of(undefined))
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    detectChanges = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ApiRepositoryService, useValue: api },
        { provide: RecipeStoreService, useValue: { loadInitialRecipes: vi.fn(() => of([recipe])) } },
        {
          provide: CatalogService,
          useValue: {
            catalog$: of({
              malts: [{ id: 'pale', name: 'Pale Ale', potential: 1.037, colorSrm: 3 }],
              hops: [{ id: 'citra', name: 'Citra' }, { id: 'mosaic', name: 'Mosaic' }],
              yeasts: [{ id: 'verdant', name: 'Verdant' }],
              adjuncts: [{ id: 'servo', name: 'Servomyces' }, { id: 'cacao', name: 'Cacao' }],
              equipmentProfiles: []
            })
          }
        },
        { provide: NotificationService, useValue: notifications },
        { provide: BrewingCalculatorService, useValue: { calculate: vi.fn(() => ({ og: 1.06, fg: 1.014, abv: 6, ibu: 40, srm: 6 })) } },
        { provide: ChangeDetectorRef, useValue: { detectChanges } }
      ]
    });
    planner = TestBed.runInInjectionContext(() => new BrewDayPlanner());
  });

  it('inicializa el calendario y carga el plan completo de la receta', () => {
    planner.ngOnInit();

    expect(planner.monthDays).toHaveLength(42);
    expect(planner.maltRows.at(0).value).toMatchObject({ ingredientName: 'Pale Ale', plannedAmountKg: 4, plannedPercent: 100 });
    expect(planner.hopRows.at(0).value).toMatchObject({ ingredientName: 'Citra', plannedTemperatureC: 100 });
    expect(planner.hopRows.length).toBe(1);
    expect(planner.yeastRows.at(0).value).toMatchObject({ ingredientName: 'Verdant', pitchTempC: 19 });
    expect(planner.additionRows.length).toBe(2);
    expect(planner.taskRows.at(0).value.title).toBe('Añadir Cacao');
    expect(planner.eventRows.length).toBe(4);
    expect(api.getBrewDays).toHaveBeenCalledOnce();
    expect(detectChanges).toHaveBeenCalled();
  });

  it('permite navegar por meses, elegir fechas y volver a hoy', () => {
    planner.recipeList = [recipe];
    const initialMonth = planner.currentMonth.getMonth();

    planner.nextMonth();
    expect(planner.currentMonth.getMonth()).toBe((initialMonth + 1) % 12);
    planner.previousMonth();
    expect(planner.currentMonth.getMonth()).toBe(initialMonth);
    planner.selectDate('2030-04-20');
    expect(planner.currentMonth.getFullYear()).toBe(2030);
    expect(planner.selectedDate).toBe('2030-04-20');
    planner.goToday();
    expect(planner.selectedDate).toBe(planner.todayKey);
    expect(api.getBrewDays.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('añade y elimina filas operativas sin dejar restos en el formulario', () => {
    planner.addMalt();
    planner.addHop();
    planner.addYeast();
    planner.addAddition();
    planner.addEvent();
    planner.addTask('cold crash', 5);

    expect(planner.maltRows.length).toBe(1);
    expect(planner.hopRows.at(0).value).toMatchObject({ plannedTemperatureC: 100, use: 'hervido' });
    expect(planner.taskRows.at(0).value).toMatchObject({ type: 'cold crash', title: 'Iniciar cold crash', taskTime: '09:00' });

    planner.removeMalt(0);
    planner.removeHop(0);
    planner.removeYeast(0);
    planner.removeAddition(0);
    planner.removeEvent(0);
    planner.removeTask(0);
    expect([planner.maltRows, planner.hopRows, planner.yeastRows, planner.additionRows, planner.eventRows, planner.taskRows].every(rows => rows.length === 0)).toBe(true);
  });

  it('guarda una elaboración válida y comunica los errores de persistencia', () => {
    planner.recipeList = [recipe];
    planner.createNew('2026-07-13');
    planner.save();

    expect(api.saveBrewDay).toHaveBeenCalledOnce();
    expect(planner.persistedBrewDay).toBe(true);
    expect(notifications.success).toHaveBeenCalledWith(expect.stringContaining('guardada'));

    api.saveBrewDay.mockReturnValueOnce(throwError(() => new Error('backend')));
    planner.save();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo guardar la elaboración.');
  });

  it('borra únicamente hojas persistidas tras confirmación y soporta fallo del backend', () => {
    planner.recipeList = [recipe];
    planner.createNew('2026-07-13');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    planner.persistedBrewDay = true;
    planner.deleteBrewDay();
    expect(api.deleteBrewDay).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    planner.deleteBrewDay();
    expect(api.deleteBrewDay).toHaveBeenCalledOnce();
    expect(notifications.success).toHaveBeenCalledWith(expect.stringContaining('eliminada'));

    planner.persistedBrewDay = true;
    api.deleteBrewDay.mockReturnValueOnce(throwError(() => new Error('backend')));
    planner.deleteBrewDay();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo eliminar la elaboración.');
  });
});
