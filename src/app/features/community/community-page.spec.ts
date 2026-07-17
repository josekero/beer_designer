import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CommunityPage } from './community-page';
import { CommunityIngredient } from '../../models/brewing.models';

describe('CommunityPage', () => {
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let recipeStore: { invalidate: ReturnType<typeof vi.fn> };
  let catalog: { refresh: ReturnType<typeof vi.fn> };
  const recipe = { id: 'r1', name: 'Shared IPA', publicRecipe: false } as never;
  const ingredient = { type: 'hops', id: 'my-hop', name: 'My Hop', publicIngredient: false, ownedByCurrentUser: true } as CommunityIngredient;
  const view = {
    latestRecipes: [recipe], templates: [], myRecipes: [recipe], sharedIngredients: [ingredient], myIngredients: [ingredient], recentMembers: [],
    memberCount: 4, activeUsers: 2,
  };

  beforeEach(() => {
    api = {
      getCommunity: vi.fn(() => of(view)),
      setRecipeVisibility: vi.fn(() => of(void 0)),
      copyCommunityRecipe: vi.fn(() => of({ id: 'copy-r1' })),
      setIngredientVisibility: vi.fn(() => of(void 0)),
      copyCommunityIngredient: vi.fn(() => of({ id: 'copy-hop' })),
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    recipeStore = { invalidate: vi.fn() };
    catalog = { refresh: vi.fn() };
    TestBed.configureTestingModule({ imports: [CommunityPage], providers: [
      { provide: ApiRepositoryService, useValue: api },
      { provide: NotificationService, useValue: notifications },
      { provide: RecipeStoreService, useValue: recipeStore },
      { provide: CatalogService, useValue: catalog },
    ] }).overrideComponent(CommunityPage, { set: { template: '' } });
  });

  it('loads the community and publishes an owned recipe', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    component.ngOnInit();
    expect(component.view()).toEqual(view);
    component.visibility(recipe);
    expect(api['setRecipeVisibility']).toHaveBeenCalledWith('r1', true);
    expect(notifications.success).toHaveBeenCalled();
  });

  it('copies a community recipe and refreshes the view', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    component.copy(recipe);
    expect(api['copyCommunityRecipe']).toHaveBeenCalledWith('r1');
    expect(recipeStore.invalidate).toHaveBeenCalled();
    expect(api['getCommunity']).toHaveBeenCalled();
    expect(notifications.success).toHaveBeenCalled();
  });

  it('publishes and copies personal community ingredients', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    component.ingredientVisibility(ingredient);
    expect(api['setIngredientVisibility']).toHaveBeenCalledWith('hops', 'my-hop', true);

    const shared = { ...ingredient, id: 'other-hop', ownedByCurrentUser: false };
    component.copyIngredient(shared);
    expect(api['copyCommunityIngredient']).toHaveBeenCalledWith('hops', 'other-hop');
    expect(catalog.refresh).toHaveBeenCalled();
  });

  it('reports load and mutation errors', () => {
    api['getCommunity'].mockReturnValue(throwError(() => new Error('failed')));
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    component.ngOnInit();
    expect(component.loading()).toBe(false);
    api['setRecipeVisibility'].mockReturnValue(throwError(() => new Error('failed')));
    component.visibility(recipe);
    api['copyCommunityRecipe'].mockReturnValue(throwError(() => new Error('failed')));
    component.copy(recipe);
    api['setIngredientVisibility'].mockReturnValue(throwError(() => new Error('failed')));
    component.ingredientVisibility(ingredient);
    api['copyCommunityIngredient'].mockReturnValue(throwError(() => new Error('failed')));
    component.copyIngredient(ingredient);
    expect(notifications.error).toHaveBeenCalledTimes(5);
  });
});
