import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
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

  it('uses the expected endpoints for the complete catalog and brewing profiles', () => {
    const reads: Array<[Observable<unknown>, string]> = [
      [service.getMalts(), '/api/catalog/malts'],
      [service.getYeasts(), '/api/catalog/yeasts'],
      [service.getAdjuncts(), '/api/catalog/adjuncts'],
      [service.getAgingIngredients(), '/api/catalog/aging'],
      [service.getWaterProfiles(), '/api/catalog/water-profiles'],
      [service.getSalts(), '/api/catalog/salts'],
      [service.getStyles(), '/api/catalog/bjcp-styles'],
      [service.getEquipmentProfiles(), '/api/equipment-profiles'],
      [service.getMashProfiles(), '/api/profiles/mash'],
      [service.getCarbonationProfiles(), '/api/profiles/carbonation'],
      [service.getFermentationProfiles(), '/api/profiles/fermentation']
    ];
    reads.forEach(([request$, url]) => {
      request$.subscribe();
      http.expectOne(url).flush([]);
    });

    const saves: Array<[Observable<unknown>, string]> = [
      [service.saveSalt({ id: 'gypsum' } as never), '/api/catalog/salts/gypsum'],
      [service.saveEquipmentProfile({ id: 'pilot' } as never), '/api/equipment-profiles/pilot'],
      [service.saveMashProfile({ id: 'single' } as never), '/api/profiles/mash/single'],
      [service.saveCarbonationProfile({ id: 'bottle' } as never), '/api/profiles/carbonation/bottle'],
      [service.saveFermentationProfile({ id: 'ale' } as never), '/api/profiles/fermentation/ale']
    ];
    saves.forEach(([request$, url]) => {
      request$.subscribe();
      const request = http.expectOne(url);
      expect(request.request.method).toBe('PUT');
      request.flush(request.request.body);
    });

    service.deleteProfile('equipment', 'pilot').subscribe();
    http.expectOne('/api/equipment-profiles/pilot').flush(null);
    service.deleteProfile('mash', 'single').subscribe();
    http.expectOne('/api/profiles/mash/single').flush(null);
  });

  it('persists recipes, folders, images and brew sheets with their HTTP contracts', () => {
    const recipe = { id: 'one', name: 'One' } as Recipe;
    service.saveRecipe(recipe).subscribe();
    const saveRecipe = http.expectOne('/api/recipes/one');
    expect(saveRecipe.request.method).toBe('PUT');
    saveRecipe.flush(recipe);

    const imageFile = new File(['image'], 'label.png', { type: 'image/png' });
    service.uploadRecipeImage('one', imageFile).subscribe();
    const upload = http.expectOne('/api/recipes/one/image');
    expect(upload.request.method).toBe('POST');
    expect(upload.request.reportProgress).toBe(true);
    upload.flush({ url: '/image.png' });

    service.deleteRecipe('one').subscribe();
    http.expectOne('/api/recipes/one').flush(null);
    service.getRecipeFolders().subscribe();
    http.expectOne('/api/recipe-folders').flush([]);
    service.createRecipeFolder('Producción').subscribe();
    const createFolder = http.expectOne('/api/recipe-folders');
    expect(createFolder.request.body).toEqual({ name: 'Producción' });
    createFolder.flush({ id: 'production' });
    service.renameRecipeFolder('production', 'Guaja').subscribe();
    const renameFolder = http.expectOne('/api/recipe-folders/production');
    expect(renameFolder.request.body).toEqual({ name: 'Guaja' });
    renameFolder.flush(null);
    service.deleteRecipeFolder('production').subscribe();
    http.expectOne('/api/recipe-folders/production').flush(null);

    const brewDay = { id: 'brew-one' } as never;
    service.saveBrewDay(brewDay).subscribe();
    const saveBrewDay = http.expectOne('/api/brew-days/brew-one');
    expect(saveBrewDay.request.method).toBe('PUT');
    saveBrewDay.flush(brewDay);
    service.deleteBrewDay('brew-one').subscribe();
    http.expectOne('/api/brew-days/brew-one').flush(null);
  });
});
