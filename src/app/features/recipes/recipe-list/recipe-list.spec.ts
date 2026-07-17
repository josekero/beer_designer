import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../../core/services/api-repository.service';
import { BrewingCalculatorService } from '../../../core/services/brewing-calculator.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecipeStoreService } from '../../../core/services/recipe-store.service';
import { Recipe, RecipeFolder } from '../../../models/brewing.models';
import { RecipeList } from './recipe-list';

describe('RecipeList', () => {
  const recipes = [{ id: 'r1', name: 'NEIPA', styleId: '21a', yeastId: 'y1', equipmentProfileId: 'eq1' }] as Recipe[];
  const catalog = {
    styles: [{ id: '21a', name: 'American IPA' }], yeasts: [{ id: 'y1' }], equipmentProfiles: [{ id: 'eq1', hopUtilizationPercent: 90 }],
    hops: [], malts: [], adjuncts: [], agingIngredients: [], waterProfiles: [], salts: [], mashProfiles: [], carbonationProfiles: [], fermentationProfiles: [],
  };
  const initialFolders: RecipeFolder[] = [
    { id: 'general', name: 'General', sortOrder: 0, isDefault: true, recipeIds: ['r1'] },
    { id: 'experiments', name: 'Experimentos', sortOrder: 1, isDefault: false, recipeIds: [] },
  ];
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let loadRecipes: ReturnType<typeof vi.fn>;
  let list: RecipeList;

  beforeEach(() => {
    api = {
      getRecipeFolders: vi.fn(() => of(initialFolders)),
      createRecipeFolder: vi.fn(() => of(initialFolders[1])),
      renameRecipeFolder: vi.fn(() => of(initialFolders[1])),
      deleteRecipeFolder: vi.fn(() => of(undefined)),
      saveRecipeFolderLayout: vi.fn(() => of(undefined)),
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    loadRecipes = vi.fn(() => of(recipes));
    TestBed.configureTestingModule({
      providers: [
        { provide: RecipeStoreService, useValue: { loadInitialRecipes: loadRecipes } },
        { provide: CatalogService, useValue: { catalog$: of(catalog) } },
        { provide: BrewingCalculatorService, useValue: { calculate: vi.fn(() => ({ abv: 6.4 })) } },
        { provide: ApiRepositoryService, useValue: api },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    list = TestBed.runInInjectionContext(() => new RecipeList());
    list.vm$.subscribe();
  });

  it('construye las tarjetas y copia la organización recibida', () => {
    list.vm$.subscribe((view) => {
      expect(view.cardsById.get('r1')).toMatchObject({ abv: 6.4, style: catalog.styles[0] });
      expect(view.folders).toEqual(initialFolders);
      expect(view.folders[0]).not.toBe(initialFolders[0]);
    });
    expect(loadRecipes).toHaveBeenCalledWith(true);
  });

  it('crea, renombra y elimina carpetas mostrando confirmación', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(' Producción ').mockReturnValueOnce('Guaja');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    list.createFolder();
    list.rename(list.folders[1]);
    list.remove(list.folders[1]);
    expect(api['createRecipeFolder']).toHaveBeenCalledWith(' Producción ');
    expect(api['renameRecipeFolder']).toHaveBeenCalledWith('experiments', 'Guaja');
    expect(api['deleteRecipeFolder']).toHaveBeenCalledWith('experiments');
    expect(notifications.success).toHaveBeenCalledTimes(3);
    list.remove(list.folders[0]);
    expect(api['deleteRecipeFolder']).toHaveBeenCalledTimes(1);
  });

  it('mueve recetas y carpetas mediante sus tiradores', () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    const dragEvent = { stopPropagation: vi.fn(), preventDefault: vi.fn(), dataTransfer } as unknown as DragEvent;
    list.startRecipe(dragEvent, 'r1', 'general');
    expect(dataTransfer.effectAllowed).toBe('move');
    list.dropRecipe(dragEvent, 'experiments');
    const recipeLayout = api['saveRecipeFolderLayout'].mock.calls[0][0] as RecipeFolder[];
    expect(recipeLayout[0].recipeIds).toEqual([]);
    expect(recipeLayout[1].recipeIds).toEqual(['r1']);

    list.startFolder(dragEvent, 'experiments');
    list.dropFolder(dragEvent, 'general');
    const folderLayout = api['saveRecipeFolderLayout'].mock.calls[1][0] as RecipeFolder[];
    expect(folderLayout.map((folder) => folder.id)).toEqual(['experiments', 'general']);
    expect(api['saveRecipeFolderLayout']).toHaveBeenCalledTimes(2);
  });

  it('informa de los errores de persistencia', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Nueva');
    api['createRecipeFolder'].mockReturnValueOnce(throwError(() => new Error('fallo')));
    list.createFolder();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo crear la carpeta.');

    api['saveRecipeFolderLayout'].mockReturnValueOnce(throwError(() => new Error('fallo')));
    const event = { preventDefault: vi.fn() } as unknown as DragEvent;
    list.draggedFolderId = 'experiments';
    list.dropFolder(event, 'general');
    expect(notifications.error).toHaveBeenCalledWith('No se pudo guardar la organización.');
  });
});
