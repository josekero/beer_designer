//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Injectable, effect, inject } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, tap, take } from 'rxjs';
import { Recipe } from '../../models/brewing.models';
import { ApiRepositoryService } from './api-repository.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RecipeStoreService {
  private readonly repository = inject(ApiRepositoryService);
  private readonly auth = inject(AuthService);
  private readonly recipesSubject = new BehaviorSubject<Recipe[]>([]);
  private loaded = false;

  readonly recipes$: Observable<Recipe[]> = this.recipesSubject.asObservable();

  constructor() {
    effect(() => {
      this.auth.user()?.id;
      this.loaded = false;
      this.recipesSubject.next([]);
    });
  }

  loadInitialRecipes(forceRefresh = false): Observable<Recipe[]> {
    if (forceRefresh || !this.loaded) {
      this.loaded = true;
      this.repository.getRecipes().pipe(take(1)).subscribe((recipes) => this.recipesSubject.next(recipes));
    }

    return this.recipes$.pipe(shareReplay(1));
  }

  invalidate(): void {
    this.loaded = false;
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

  deleteRecipe(id: string): Observable<void> {
    return this.repository.deleteRecipe(id).pipe(
      tap(() => this.recipesSubject.next(this.recipesSubject.value.filter((recipe) => recipe.id !== id)))
    );
  }
}
