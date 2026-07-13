import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from './api-repository.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  const methods = [
    'getHops',
    'getMalts',
    'getYeasts',
    'getAdjuncts',
    'getAgingIngredients',
    'getWaterProfiles',
    'getSalts',
    'getStyles',
    'getEquipmentProfiles',
    'getMashProfiles',
    'getCarbonationProfiles',
    'getFermentationProfiles',
  ] as const;
  let repository: Record<(typeof methods)[number], ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = Object.fromEntries(
      methods.map((method) => [method, vi.fn(() => of([{ id: method }]))]),
    ) as typeof repository;
    TestBed.configureTestingModule({
      providers: [CatalogService, { provide: ApiRepositoryService, useValue: repository }],
    });
  });

  it('combina todos los repositorios en un catálogo único', () => {
    const service = TestBed.inject(CatalogService);
    service.catalog$.subscribe((catalog) => {
      expect(catalog.hops[0]).toEqual({ id: 'getHops' });
      expect(catalog.salts[0]).toEqual({ id: 'getSalts' });
      expect(catalog.fermentationProfiles[0]).toEqual({ id: 'getFermentationProfiles' });
    });
    expect(methods.every((method) => repository[method].mock.calls.length === 1)).toBe(true);
  });

  it('calcula los contadores del dashboard y vuelve a consultar al refrescar', () => {
    const service = TestBed.inject(CatalogService);
    const counts: number[] = [];
    const subscription = service.dashboard$.subscribe((dashboard) => {
      counts.push(dashboard.counts.hops + dashboard.counts.styles);
      expect(dashboard.counts.waterProfiles).toBe(1);
    });

    service.refresh();

    expect(counts.length).toBeGreaterThan(1);
    expect(counts.every((count) => count === 2)).toBe(true);
    expect(repository.getHops).toHaveBeenCalledTimes(2);
    expect(repository.getStyles).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
  });
});
