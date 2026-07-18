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
  const recipe = { id: 'r1', name: 'Shared IPA', publicRecipe: false, likeCount: 0, copyCount: 0, likedByCurrentUser: false } as never;
  const ingredient = { type: 'hops', id: 'my-hop', name: 'My Hop', publicIngredient: false, ownedByCurrentUser: true } as CommunityIngredient;
  const view = {
    latestRecipes: [recipe], templates: [], myRecipes: [recipe], sharedIngredients: [ingredient], myIngredients: [ingredient], recentMembers: [],
    memberCount: 4, activeUsers: 2, publicRecipeCount: 1, templateCount: 0, sharedIngredientCount: 1,
  };

  beforeEach(() => {
    api = {
      getCommunity: vi.fn(() => of(view)),
      setRecipeVisibility: vi.fn(() => of(void 0)),
      copyCommunityRecipe: vi.fn(() => of({ id: 'copy-r1', copyCount: 1 })),
      setIngredientVisibility: vi.fn(() => of(void 0)),
      copyCommunityIngredient: vi.fn(() => of({ id: 'copy-hop' })),
      getCommunityRecipes: vi.fn(() => of({ items: [recipe], totalElements: 1, page: 0, size: 9, totalPages: 1 })),
      getCommunityRecipe: vi.fn(() => of({ recipe: { id: 'r1', name: 'Shared IPA' } })),
      likeCommunityRecipe: vi.fn(() => of({ likeCount: 1, copyCount: 0, likedByCurrentUser: true })),
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
    component.ngOnInit();
    component.copy(recipe);
    expect(api['copyCommunityRecipe']).toHaveBeenCalledWith('r1');
    expect(recipeStore.invalidate).toHaveBeenCalled();
    expect(component.communityRecipes()?.items[0].copyCount).toBe(1);
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

  it('renders the selected glass with the interpolated beer colour', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    const visualRecipe = { id: 'hazy/one', glasswareId: 'teku', srm: 5 } as never;
    expect(component.glass(visualRecipe).id).toBe('teku');
    expect(component.glassTransform(visualRecipe)).toContain('scale(1 0.82)');
    expect(component.glassClipId(visualRecipe)).toBe('community-glass-hazy-one');
    expect(component.beerColor(visualRecipe)).toMatch(/^rgb\(/);
    expect(component.beerColor({ id: 'dark', srm: 99 } as never)).toBe('rgb(15,11,10)');
    expect(component.glass({ id: 'unknown', glasswareId: 'missing' } as never).id)
        .toBe('american-pint');
  });

  it('filters and describes every shared ingredient kind', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    const shared = [ingredient, { ...ingredient, type: 'malts', id: 'malt-1' }] as CommunityIngredient[];
    const data = { ...view, sharedIngredients: shared };
    expect(component.filteredIngredients(data)).toHaveLength(2);
    component.ingredientFilter.set('malts');
    expect(component.filteredIngredients(data).map(item => item.id)).toEqual(['malt-1']);
    expect(['hops', 'malts', 'yeasts', 'adjuncts', 'salts', 'aging'].map(type =>
      component.ingredientLabel(type as never))).toEqual(['Lúpulo', 'Malta', 'Levadura', 'Adjunto', 'Sal', 'Aging']);
    expect(component.ingredientIcon('adjuncts')).toBe('category');
    expect(component.ingredientKey(ingredient)).toBe('ingredient:hops:my-hop');
  });

  it('likes recipes and opens the complete preview before copying', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    component.ngOnInit();
    component.like(recipe);
    expect(api['likeCommunityRecipe']).toHaveBeenCalledWith('r1', true);
    expect(component.communityRecipes()?.items[0].likedByCurrentUser).toBe(true);
    component.openPreview(recipe);
    expect(api['getCommunityRecipe']).toHaveBeenCalledWith('r1');
    expect(component.preview()?.recipe.name).toBe('Shared IPA');
    component.closePreview();
    expect(component.preview()).toBeNull();
  });

  it('searches, sorts and paginates the scalable recipe catalog', () => {
    const component = TestBed.createComponent(CommunityPage).componentInstance;
    component.search('community', 'ipa');
    expect(api['getCommunityRecipes']).toHaveBeenLastCalledWith('community', 'ipa', 'recent', 0);
    component.sort('community', 'popular');
    expect(api['getCommunityRecipes']).toHaveBeenLastCalledWith('community', 'ipa', 'popular', 0);
    component.loadRecipePage('community', 2);
    expect(api['getCommunityRecipes']).toHaveBeenLastCalledWith('community', 'ipa', 'popular', 2);
  });
});
