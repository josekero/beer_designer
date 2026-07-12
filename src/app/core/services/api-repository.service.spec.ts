import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiRepositoryService } from './api-repository.service';
import { Hop, Recipe } from '../../models/brewing.models';

describe('ApiRepositoryService', () => {
  let service: ApiRepositoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ApiRepositoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('caches catalog requests and invalidates the cache after saving', () => {
    const hop = { id: 'citra', name: 'Citra' } as Hop;
    service.getHops().subscribe(value => expect(value).toEqual([hop]));
    service.getHops().subscribe(value => expect(value).toEqual([hop]));
    http.expectOne('/api/catalog/hops').flush([hop]);

    service.saveHop(hop).subscribe();
    http.expectOne('/api/catalog/hops/citra').flush(hop);

    service.getHops().subscribe();
    http.expectOne('/api/catalog/hops').flush([hop]);
  });

  it('loads complete recipes from their summaries', () => {
    const recipes = [{ id: 'one', name: 'One' }, { id: 'two', name: 'Two' }] as Recipe[];
    service.getRecipes().subscribe(value => expect(value).toEqual(recipes));
    http.expectOne('/api/recipes').flush(recipes);
    http.expectOne('/api/recipes/one').flush(recipes[0]);
    http.expectOne('/api/recipes/two').flush(recipes[1]);
  });

  it('returns an empty recipe collection without detail requests', () => {
    service.getRecipes().subscribe(value => expect(value).toEqual([]));
    http.expectOne('/api/recipes').flush([]);
  });

  it('imports XML with the expected content type', () => {
    service.importMaltsXml('<FERMENTABLES/>').subscribe(result => expect(result.imported).toBe(2));
    const request = http.expectOne('/api/catalog/malts/import-xml');
    expect(request.request.headers.get('Content-Type')).toBe('application/xml');
    expect(request.request.body).toBe('<FERMENTABLES/>');
    request.flush({ type: 'malts', imported: 2 });
  });

  it('sends folder layout and brew-day query parameters', () => {
    service.saveRecipeFolderLayout([{ id: 'production', name: 'Production', recipeIds: ['one'], sortOrder: 0, isDefault: false }]).subscribe();
    const layout = http.expectOne('/api/recipe-folders/layout');
    expect(layout.request.body).toEqual({ folderIds: ['production'], folders: [{ id: 'production', recipeIds: ['one'] }] });
    layout.flush(null);

    service.getBrewDays('2026-01-01', '2026-01-31').subscribe();
    const days = http.expectOne(request => request.url === '/api/brew-days');
    expect(days.request.params.get('from')).toBe('2026-01-01');
    expect(days.request.params.get('to')).toBe('2026-01-31');
    days.flush([]);
  });
});
