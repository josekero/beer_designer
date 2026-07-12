import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Recipe } from '../../models/brewing.models';
import { ApiRepositoryService } from './api-repository.service';
import { RecipeStoreService } from './recipe-store.service';

describe('RecipeStoreService', () => {
  const first = { id: 'one', name: 'One' } as Recipe;
  const repository = {
    getRecipes: vi.fn(() => of([first])),
    getRecipe: vi.fn((id: string) => of(id === 'one' ? first : undefined)),
    saveRecipe: vi.fn((recipe: Recipe) => of(recipe)),
    deleteRecipe: vi.fn(() => of(undefined))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [RecipeStoreService, { provide: ApiRepositoryService, useValue: repository }] });
  });

  it('loads initial recipes only once', () => {
    const store = TestBed.inject(RecipeStoreService);
    store.loadInitialRecipes().subscribe(value => expect(value).toEqual([first]));
    store.loadInitialRecipes().subscribe();
    expect(repository.getRecipes).toHaveBeenCalledTimes(1);
  });

  it('updates existing recipes and prepends new recipes', () => {
    const store = TestBed.inject(RecipeStoreService);
    store.loadInitialRecipes().subscribe();
    store.saveRecipe({ ...first, name: 'Updated' }).subscribe();
    store.saveRecipe({ id: 'two', name: 'Two' } as Recipe).subscribe();
    store.recipes$.subscribe(value => expect(value.map(recipe => recipe.name)).toEqual(['Two', 'Updated']));
  });

  it('delegates detail loading and removes deleted recipes', () => {
    const store = TestBed.inject(RecipeStoreService);
    store.loadInitialRecipes().subscribe();
    store.getRecipe('one').subscribe(value => expect(value).toBe(first));
    store.deleteRecipe('one').subscribe();
    store.recipes$.subscribe(value => expect(value).toEqual([]));
  });
});
