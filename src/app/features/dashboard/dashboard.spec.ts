import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { BrewDay, Recipe } from '../../models/brewing.models';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  const recipes = [
    { id: 'old', name: 'Antigua', updatedAt: '2026-07-01T10:00:00Z' },
    { id: 'new', name: 'Reciente', updatedAt: '2026-07-12T10:00:00Z' },
  ] as Recipe[];
  const brewDays = [
    {
      id: 'brew-1', batchNumber: 'L-001', title: 'NEIPA', brewDate: '2026-07-13',
      startTime: '09:00:00', endTime: '16:00:00', status: 'planificada',
      tasks: [
        { taskDate: '2026-07-14', taskTime: '10:00:00', title: 'Dry hop', type: 'dry-hop', status: 'pendiente', notes: 'Citra' },
        { taskDate: '2026-07-15', taskTime: '10:00:00', title: 'Cancelada', type: 'adjunto', status: 'cancelada', notes: '' },
      ],
    },
    {
      id: 'brew-2', batchNumber: 'L-002', title: 'Cancelada', brewDate: '2026-07-13',
      startTime: '08:00:00', endTime: '10:00:00', status: 'cancelada', tasks: [],
    },
  ] as BrewDay[];
  let dashboard: Dashboard;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 13, 12));
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogService, useValue: { dashboard$: of({ counts: { hops: 2 } }) } },
        { provide: RecipeStoreService, useValue: { loadInitialRecipes: () => of(recipes) } },
        { provide: ApiRepositoryService, useValue: { getBrewDays: vi.fn(() => of(brewDays)) } },
      ],
    });
    dashboard = TestBed.runInInjectionContext(() => new Dashboard());
  });

  afterEach(() => vi.useRealTimers());

  it('ordena recetas y construye una agenda sin elementos cancelados', () => {
    dashboard.dashboard$.subscribe((view) => {
      expect(view.recipeCount).toBe(2);
      expect(view.recentRecipes.map((recipe) => recipe.id)).toEqual(['new', 'old']);
      expect(view.upcomingAgenda.map((item) => item.title)).toEqual(['NEIPA', 'Dry hop']);
      expect(view.upcomingAgenda[0].notes).toBe('09:00–16:00');
      expect(view.week).toHaveLength(7);
      expect(view.week[0]).toMatchObject({ key: '2026-07-13', today: true });
      expect(view.week[0].brewDays).toHaveLength(1);
      expect(view.week[1].tasks).toHaveLength(1);
    });
  });

  it('presenta estados legibles', () => {
    expect(dashboard.statusLabel('en curso')).toBe('En curso');
    expect(dashboard.statusLabel('planificada')).toBe('Planificada');
  });
});
