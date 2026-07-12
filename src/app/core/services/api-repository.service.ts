//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { Adjunct, AgingIngredient, BjcpStyle, BrewDay, CarbonationProfile, EquipmentProfile, FermentationProfile, Hop, Malt, MashProfile, Recipe, RecipeFolder, RecipeImage, WaterProfile, Yeast } from '../../models/brewing.models';

const API_BASE_URL = '/api';

type RecipeSummaryDto = Pick<Recipe, 'id' | 'name' | 'brewer' | 'untappdUrl' | 'equipmentProfileId' | 'mashProfileId' | 'carbonationProfileId' | 'fermentationProfileId' | 'glasswareId' | 'styleId' | 'batchVolumeL' | 'efficiencyPercent' | 'yeastId' | 'waterProfileId' | 'notes' | 'version' | 'updatedAt' | 'image'>;

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

  getAdjuncts(): Observable<Adjunct[]> {
    return this.cached('adjuncts', this.http.get<Adjunct[]>(`${API_BASE_URL}/catalog/adjuncts`));
  }

  getAgingIngredients(): Observable<AgingIngredient[]> {
    return this.cached('aging', this.http.get<AgingIngredient[]>(`${API_BASE_URL}/catalog/aging`));
  }

  getWaterProfiles(): Observable<WaterProfile[]> {
    return this.cached('waterProfiles', this.http.get<WaterProfile[]>(`${API_BASE_URL}/catalog/water-profiles`));
  }

  getStyles(): Observable<BjcpStyle[]> {
    return this.cached('styles', this.http.get<BjcpStyle[]>(`${API_BASE_URL}/catalog/bjcp-styles`));
  }

  getEquipmentProfiles(): Observable<EquipmentProfile[]> {
    return this.cached('equipmentProfiles', this.http.get<EquipmentProfile[]>(`${API_BASE_URL}/equipment-profiles`));
  }
  getMashProfiles():Observable<MashProfile[]>{return this.http.get<MashProfile[]>(`${API_BASE_URL}/profiles/mash`);}
  getCarbonationProfiles():Observable<CarbonationProfile[]>{return this.http.get<CarbonationProfile[]>(`${API_BASE_URL}/profiles/carbonation`);}
  getFermentationProfiles():Observable<FermentationProfile[]>{return this.http.get<FermentationProfile[]>(`${API_BASE_URL}/profiles/fermentation`);}
  saveEquipmentProfile(p:EquipmentProfile){return this.http.put<EquipmentProfile>(`${API_BASE_URL}/equipment-profiles/${p.id}`,p).pipe(tap(()=>this.cache.clear()));}
  saveMashProfile(p:MashProfile){return this.http.put<MashProfile>(`${API_BASE_URL}/profiles/mash/${p.id}`,p);}
  saveCarbonationProfile(p:CarbonationProfile){return this.http.put<CarbonationProfile>(`${API_BASE_URL}/profiles/carbonation/${p.id}`,p);}
  saveFermentationProfile(p:FermentationProfile){return this.http.put<FermentationProfile>(`${API_BASE_URL}/profiles/fermentation/${p.id}`,p);}
  deleteProfile(type:'equipment'|'mash'|'carbonation'|'fermentation',id:string){const path=type==='equipment'?'equipment-profiles':`profiles/${type}`;return this.http.delete<void>(`${API_BASE_URL}/${path}/${id}`).pipe(tap(()=>this.cache.clear()));}

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

  saveHop(hop: Hop): Observable<Hop> {
    return this.http.put<Hop>(`${API_BASE_URL}/catalog/hops/${hop.id}`, hop).pipe(tap(() => this.cache.clear()));
  }

  saveMalt(malt: Malt): Observable<Malt> {
    return this.http.put<Malt>(`${API_BASE_URL}/catalog/malts/${malt.id}`, malt).pipe(tap(() => this.cache.clear()));
  }

  saveYeast(yeast: Yeast): Observable<Yeast> {
    return this.http.put<Yeast>(`${API_BASE_URL}/catalog/yeasts/${yeast.id}`, yeast).pipe(tap(() => this.cache.clear()));
  }

  saveAdjunct(adjunct: Adjunct): Observable<Adjunct> {
    return this.http.put<Adjunct>(`${API_BASE_URL}/catalog/adjuncts/${adjunct.id}`, adjunct).pipe(tap(() => this.cache.clear()));
  }

  saveAgingIngredient(agingIngredient: AgingIngredient): Observable<AgingIngredient> {
    return this.http.put<AgingIngredient>(`${API_BASE_URL}/catalog/aging/${agingIngredient.id}`, agingIngredient).pipe(tap(() => this.cache.clear()));
  }

  importHopsXml(xml: string): Observable<{ type: string; imported: number }> {
    return this.importXml('hops', xml);
  }

  importMaltsXml(xml: string): Observable<{ type: string; imported: number }> {
    return this.importXml('malts', xml);
  }

  importYeastsXml(xml: string): Observable<{ type: string; imported: number }> {
    return this.importXml('yeasts', xml);
  }

  importAdjunctsXml(xml: string): Observable<{ type: string; imported: number }> {
    return this.importXml('adjuncts', xml);
  }

  importAgingIngredientsXml(xml: string): Observable<{ type: string; imported: number }> {
    return this.importXml('aging', xml);
  }

  saveRecipe(recipe: Recipe): Observable<Recipe> {
    const request$ = this.http.put<Recipe>(`${API_BASE_URL}/recipes/${recipe.id}`, recipe);
    return request$.pipe(tap(() => this.cache.clear()));
  }

  uploadRecipeImage(recipeId: string, file: File): Observable<HttpEvent<RecipeImage>> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<RecipeImage>(`${API_BASE_URL}/recipes/${recipeId}/image`, data, {
      observe: 'events',
      reportProgress: true
    });
  }

  deleteRecipe(recipeId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/recipes/${recipeId}`);
  }

  getRecipeFolders():Observable<RecipeFolder[]>{return this.http.get<RecipeFolder[]>(`${API_BASE_URL}/recipe-folders`);}
  createRecipeFolder(name:string):Observable<RecipeFolder>{return this.http.post<RecipeFolder>(`${API_BASE_URL}/recipe-folders`,{name});}
  renameRecipeFolder(id:string,name:string):Observable<void>{return this.http.put<void>(`${API_BASE_URL}/recipe-folders/${id}`,{name});}
  deleteRecipeFolder(id:string):Observable<void>{return this.http.delete<void>(`${API_BASE_URL}/recipe-folders/${id}`);}
  saveRecipeFolderLayout(folders:RecipeFolder[]):Observable<void>{return this.http.put<void>(`${API_BASE_URL}/recipe-folders/layout`,{folderIds:folders.map(f=>f.id),folders:folders.map(f=>({id:f.id,recipeIds:f.recipeIds}))});}

  getBrewDays(from: string, to: string): Observable<BrewDay[]> {
    return this.http.get<BrewDay[]>(`${API_BASE_URL}/brew-days`, { params: { from, to } });
  }

  saveBrewDay(brewDay: BrewDay): Observable<BrewDay> {
    return this.http.put<BrewDay>(`${API_BASE_URL}/brew-days/${brewDay.id}`, brewDay);
  }

  private importXml(type: 'hops' | 'malts' | 'yeasts' | 'adjuncts' | 'aging', xml: string): Observable<{ type: string; imported: number }> {
    return this.http.post<{ type: string; imported: number }>(`${API_BASE_URL}/catalog/${type}/import-xml`, xml, {
      headers: { 'Content-Type': 'application/xml' }
    }).pipe(tap(() => this.cache.clear()));
  }

  private cached<T>(key: string, request$: Observable<T>): Observable<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, request$.pipe(shareReplay(1)));
    }

    return this.cache.get(key) as Observable<T>;
  }
}
