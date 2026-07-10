import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, shareReplay, take } from 'rxjs';
import { Recipe } from '../../models/brewing.models';
import { XmlRepositoryService } from './xml-repository.service';

@Injectable({ providedIn: 'root' })
export class RecipeStoreService {
  private readonly repository = inject(XmlRepositoryService);
  private readonly recipesSubject = new BehaviorSubject<Recipe[]>([]);
  private loaded = false;

  readonly recipes$: Observable<Recipe[]> = this.recipesSubject.asObservable();

  loadInitialRecipes(): Observable<Recipe[]> {
    if (!this.loaded) {
      this.loaded = true;
      this.repository.getRecipes().pipe(take(1)).subscribe((recipes) => this.recipesSubject.next(recipes));
    }

    return this.recipes$.pipe(shareReplay(1));
  }

  getRecipe(id: string): Observable<Recipe | undefined> {
    return this.loadInitialRecipes().pipe(map((recipes) => recipes.find((recipe) => recipe.id === id)));
  }

  saveRecipe(recipe: Recipe): void {
    const recipes = this.recipesSubject.value;
    const index = recipes.findIndex((candidate) => candidate.id === recipe.id);
    const next = index >= 0
      ? recipes.map((candidate) => candidate.id === recipe.id ? recipe : candidate)
      : [recipe, ...recipes];
    this.recipesSubject.next(next);
  }
}
