//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, tap, take } from 'rxjs';
import { Recipe } from '../../models/brewing.models';
import { ApiRepositoryService } from './api-repository.service';

@Injectable({ providedIn: 'root' })
export class RecipeStoreService {
  private readonly repository = inject(ApiRepositoryService);
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
    return this.repository.getRecipe(id);
  }

  saveRecipe(recipe: Recipe): Observable<Recipe> {
    return this.repository.saveRecipe(recipe).pipe(
      tap((savedRecipe) => {
        const recipes = this.recipesSubject.value;
        const index = recipes.findIndex((candidate) => candidate.id === savedRecipe.id);
        const next = index >= 0
          ? recipes.map((candidate) => candidate.id === savedRecipe.id ? savedRecipe : candidate)
          : [savedRecipe, ...recipes];
        this.recipesSubject.next(next);
      })
    );
  }
}
