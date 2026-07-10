//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { BjcpStyle, Hop, Malt, Recipe, WaterProfile, Yeast } from '../../models/brewing.models';

const API_BASE_URL = 'http://localhost:8082/api';

type RecipeSummaryDto = Pick<Recipe, 'id' | 'name' | 'styleId' | 'batchVolumeL' | 'efficiencyPercent' | 'yeastId' | 'waterProfileId' | 'notes'>;

@Injectable({ providedIn: 'root' })
export class ApiRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<unknown>>();

  getHops(): Observable<Hop[]> {
    return this.cached('hops', this.http.get<Hop[]>(`${API_BASE_URL}/catalog/hops`));
  }

  getMalts(): Observable<Malt[]> {
    return this.cached('malts', this.http.get<Malt[]>(`${API_BASE_URL}/catalog/malts`));
  }

  getYeasts(): Observable<Yeast[]> {
    return this.cached('yeasts', this.http.get<Yeast[]>(`${API_BASE_URL}/catalog/yeasts`));
  }

  getWaterProfiles(): Observable<WaterProfile[]> {
    return this.cached('waterProfiles', this.http.get<WaterProfile[]>(`${API_BASE_URL}/catalog/water-profiles`));
  }

  getStyles(): Observable<BjcpStyle[]> {
    return this.cached('styles', this.http.get<BjcpStyle[]>(`${API_BASE_URL}/catalog/bjcp-styles`));
  }

  getRecipes(): Observable<Recipe[]> {
    return this.http.get<RecipeSummaryDto[]>(`${API_BASE_URL}/recipes`).pipe(
      switchMap((summaries) => summaries.length
        ? forkJoin(summaries.map((recipe) => this.getRecipe(recipe.id)))
        : of([])
      ),
      map((recipes) => recipes.filter((recipe): recipe is Recipe => Boolean(recipe)))
    );
  }

  getRecipe(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${API_BASE_URL}/recipes/${id}`);
  }

  saveRecipe(recipe: Recipe): Observable<Recipe> {
    const request$ = this.http.put<Recipe>(`${API_BASE_URL}/recipes/${recipe.id}`, recipe);
    return request$.pipe(tap(() => this.cache.clear()));
  }

  private cached<T>(key: string, request$: Observable<T>): Observable<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, request$.pipe(shareReplay(1)));
    }

    return this.cache.get(key) as Observable<T>;
  }
}
