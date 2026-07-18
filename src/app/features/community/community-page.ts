import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CommunityIngredient, CommunityRecipe, CommunityRecipeDetail, CommunityRecipePage, CommunityView, IngredientCatalogType, Recipe } from '../../models/brewing.models';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';
import { BEER_GLASSWARE, BeerGlassware } from '../recipes/recipe-editor/beer-glassware';
import { BeerAvatar } from '../../shared/components/beer-avatar/beer-avatar';
import { HopIcon } from '../../shared/components/hop-icon/hop-icon';

@Component({selector:'app-community-page',imports:[RouterLink,UiTranslatePipe,BeerAvatar,HopIcon],templateUrl:'./community-page.html',styleUrls:['./community-page.scss','./community-catalog.scss','./community-preview.scss']})
export class CommunityPage implements OnInit {
  private readonly api=inject(ApiRepositoryService);private readonly notifications=inject(NotificationService);private readonly recipes=inject(RecipeStoreService);private readonly catalog=inject(CatalogService);
  private readonly srmColors=[{srm:1,color:'#FFE699'},{srm:3,color:'#FFCA5A'},{srm:6,color:'#FBB123'},{srm:10,color:'#E58500'},{srm:13,color:'#CB6200'},{srm:17,color:'#8D3B00'},{srm:24,color:'#3B1D00'},{srm:29,color:'#261716'},{srm:40,color:'#0F0B0A'}];
  readonly view=signal<CommunityView|null>(null);readonly loading=signal(true);readonly busy=signal<string|null>(null);readonly ingredientFilter=signal<'all'|IngredientCatalogType>('all');
  readonly communityRecipes=signal<CommunityRecipePage|null>(null);readonly templateRecipes=signal<CommunityRecipePage|null>(null);
  readonly communityQuery=signal('');readonly templateQuery=signal('');
  readonly communitySort=signal<'recent'|'popular'|'copied'|'name'>('recent');readonly templateSort=signal<'recent'|'popular'|'copied'|'name'>('recent');
  readonly catalogLoading=signal<'community'|'templates'|null>(null);readonly preview=signal<CommunityRecipeDetail|null>(null);readonly previewSource=signal<CommunityRecipe|null>(null);readonly previewLoading=signal(false);
  ngOnInit():void{this.load();}
  visibility(recipe:CommunityRecipe):void{this.busy.set(recipe.id);this.api.setRecipeVisibility(recipe.id,!recipe.publicRecipe).subscribe({next:()=>{this.notifications.success(recipe.publicRecipe?'La receta vuelve a ser privada.':'Receta compartida con la comunidad.');this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo cambiar la visibilidad de la receta.');}});}
  copy(recipe:CommunityRecipe):void{this.busy.set(`copy:${recipe.id}`);this.api.copyCommunityRecipe(recipe.id).subscribe({next:result=>{this.recipes.invalidate();this.updateRecipe(recipe.id,{copyCount:result.copyCount});this.busy.set(null);this.notifications.success(`“${recipe.name}” se ha copiado a tu recetario.`);},error:()=>{this.busy.set(null);this.notifications.error('No se pudo copiar la receta.');}});}
  like(recipe:CommunityRecipe):void{this.busy.set(`like:${recipe.id}`);this.api.likeCommunityRecipe(recipe.id,!recipe.likedByCurrentUser).subscribe({next:value=>{this.updateRecipe(recipe.id,value);this.busy.set(null);},error:()=>{this.busy.set(null);this.notifications.error('No se pudo guardar tu me gusta.');}});}
  openPreview(recipe:CommunityRecipe):void{this.preview.set(null);this.previewSource.set(recipe);this.previewLoading.set(true);this.busy.set(`preview:${recipe.id}`);this.api.getCommunityRecipe(recipe.id).subscribe({next:detail=>{this.preview.set(detail);this.previewLoading.set(false);this.busy.set(null);},error:()=>{this.previewLoading.set(false);this.busy.set(null);this.notifications.error('No se pudo abrir la receta compartida.');}});}
  closePreview():void{this.preview.set(null);this.previewSource.set(null);this.previewLoading.set(false);}
  loadRecipePage(kind:'community'|'templates',page=0):void{const query=kind==='community'?this.communityQuery():this.templateQuery();const sort=kind==='community'?this.communitySort():this.templateSort();this.catalogLoading.set(kind);this.api.getCommunityRecipes(kind,query,sort,page).subscribe({next:value=>{(kind==='community'?this.communityRecipes:this.templateRecipes).set(value);this.catalogLoading.set(null);},error:()=>{this.catalogLoading.set(null);this.notifications.error('No se pudo cargar el catálogo de recetas.');}});}
  search(kind:'community'|'templates',value:string):void{(kind==='community'?this.communityQuery:this.templateQuery).set(value);this.loadRecipePage(kind,0);}
  sort(kind:'community'|'templates',value:string):void{const safe=(['recent','popular','copied','name'].includes(value)?value:'recent') as 'recent'|'popular'|'copied'|'name';(kind==='community'?this.communitySort:this.templateSort).set(safe);this.loadRecipePage(kind,0);}
  ingredientVisibility(ingredient:CommunityIngredient):void{const key=this.ingredientKey(ingredient);this.busy.set(key);this.api.setIngredientVisibility(ingredient.type,ingredient.id,!ingredient.publicIngredient).subscribe({next:()=>{this.notifications.success(ingredient.publicIngredient?'El ingrediente vuelve a ser privado.':'Ingrediente compartido con la comunidad.');this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo cambiar la visibilidad del ingrediente.');}});}
  copyIngredient(ingredient:CommunityIngredient):void{const key=this.ingredientKey(ingredient);this.busy.set(key);this.api.copyCommunityIngredient(ingredient.type,ingredient.id).subscribe({next:()=>{this.catalog.refresh();this.notifications.success(`“${ingredient.name}” ya está en tu catálogo personal.`);this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo copiar el ingrediente.');}});}
  filteredIngredients(data:CommunityView):CommunityIngredient[]{const filter=this.ingredientFilter();return filter==='all'?data.sharedIngredients:data.sharedIngredients.filter(item=>item.type===filter);}
  ingredientKey(ingredient:CommunityIngredient):string{return `ingredient:${ingredient.type}:${ingredient.id}`;}
  ingredientLabel(type:IngredientCatalogType):string{return ({hops:'Lúpulo',malts:'Malta',yeasts:'Levadura',adjuncts:'Adjunto',salts:'Sal',aging:'Aging'})[type];}
  ingredientIcon(type:IngredientCatalogType):string{return ({hops:'eco',malts:'grain',yeasts:'bubble_chart',adjuncts:'category',salts:'science',aging:'barrel'})[type];}
  glass(recipe:CommunityRecipe):BeerGlassware{return BEER_GLASSWARE.find(item=>item.id===recipe.glasswareId)??BEER_GLASSWARE[0];}
  glassTransform(recipe:CommunityRecipe):string{const glass=this.glass(recipe);return `translate(75 0) scale(${glass.widthScale??1} ${glass.heightScale??1}) translate(-75 0)`;}
  glassClipId(recipe:CommunityRecipe):string{return `community-glass-${recipe.id.replace(/[^a-zA-Z0-9_-]/g,'-')}`;}
  beerColor(recipe:CommunityRecipe):string{const srm=Math.min(40,Math.max(1,recipe.srm??1));const upperIndex=this.srmColors.findIndex(point=>point.srm>=srm);const upper=this.srmColors[upperIndex];const lower=this.srmColors[Math.max(0,upperIndex-1)];if(upper.srm===lower.srm)return upper.color;const ratio=(srm-lower.srm)/(upper.srm-lower.srm);const from=this.rgb(lower.color),to=this.rgb(upper.color);return `rgb(${from.map((value,index)=>Math.round(value+(to[index]-value)*ratio)).join(',')})`;}
  displayId(value:string|undefined):string{return value?.replace(/^user-[a-f0-9]+-(hop|malt|yeast|adjunct|salt|aging)-/,'').replace(/-[a-z0-9]+$/,'').replaceAll('-',' ')||'—';}
  recipeFromPreview():Recipe|null{return this.preview()?.recipe??null;}
  private rgb(hex:string):number[]{return [1,3,5].map(offset=>Number.parseInt(hex.slice(offset,offset+2),16));}
  private load():void{this.loading.set(true);this.api.getCommunity().subscribe({next:view=>{this.view.set(view);this.loading.set(false);this.busy.set(null);this.loadRecipePage('templates');this.loadRecipePage('community');},error:()=>{this.loading.set(false);this.notifications.error('No se pudo cargar la comunidad.');}});}
  private updateRecipe(id:string,patch:Partial<CommunityRecipe>):void{const apply=(page:CommunityRecipePage|null)=>page?{...page,items:page.items.map(item=>item.id===id?{...item,...patch}:item)}:null;this.communityRecipes.update(apply);this.templateRecipes.update(apply);this.previewSource.update(item=>item?.id===id?{...item,...patch}:item);this.view.update(data=>data?{...data,latestRecipes:data.latestRecipes.map(item=>item.id===id?{...item,...patch}:item),templates:data.templates.map(item=>item.id===id?{...item,...patch}:item)}:data);}
}
