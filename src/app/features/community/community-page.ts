import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CommunityIngredient, CommunityRecipe, CommunityView, IngredientCatalogType } from '../../models/brewing.models';

@Component({selector:'app-community-page',imports:[RouterLink],templateUrl:'./community-page.html',styleUrl:'./community-page.scss'})
export class CommunityPage implements OnInit {
  private readonly api=inject(ApiRepositoryService);private readonly notifications=inject(NotificationService);private readonly recipes=inject(RecipeStoreService);private readonly catalog=inject(CatalogService);
  readonly view=signal<CommunityView|null>(null);readonly loading=signal(true);readonly busy=signal<string|null>(null);readonly ingredientFilter=signal<'all'|IngredientCatalogType>('all');
  ngOnInit():void{this.load();}
  visibility(recipe:CommunityRecipe):void{this.busy.set(recipe.id);this.api.setRecipeVisibility(recipe.id,!recipe.publicRecipe).subscribe({next:()=>{this.notifications.success(recipe.publicRecipe?'La receta vuelve a ser privada.':'Receta compartida con la comunidad.');this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo cambiar la visibilidad de la receta.');}});}
  copy(recipe:CommunityRecipe):void{this.busy.set(recipe.id);this.api.copyCommunityRecipe(recipe.id).subscribe({next:()=>{this.recipes.invalidate();this.notifications.success(`“${recipe.name}” se ha copiado a tu recetario.`);this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo copiar la receta.');}});}
  ingredientVisibility(ingredient:CommunityIngredient):void{const key=this.ingredientKey(ingredient);this.busy.set(key);this.api.setIngredientVisibility(ingredient.type,ingredient.id,!ingredient.publicIngredient).subscribe({next:()=>{this.notifications.success(ingredient.publicIngredient?'El ingrediente vuelve a ser privado.':'Ingrediente compartido con la comunidad.');this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo cambiar la visibilidad del ingrediente.');}});}
  copyIngredient(ingredient:CommunityIngredient):void{const key=this.ingredientKey(ingredient);this.busy.set(key);this.api.copyCommunityIngredient(ingredient.type,ingredient.id).subscribe({next:()=>{this.catalog.refresh();this.notifications.success(`“${ingredient.name}” ya está en tu catálogo personal.`);this.load();},error:()=>{this.busy.set(null);this.notifications.error('No se pudo copiar el ingrediente.');}});}
  filteredIngredients(data:CommunityView):CommunityIngredient[]{const filter=this.ingredientFilter();return filter==='all'?data.sharedIngredients:data.sharedIngredients.filter(item=>item.type===filter);}
  ingredientKey(ingredient:CommunityIngredient):string{return `ingredient:${ingredient.type}:${ingredient.id}`;}
  ingredientLabel(type:IngredientCatalogType):string{return ({hops:'Lúpulo',malts:'Malta',yeasts:'Levadura',adjuncts:'Adjunto',salts:'Sal',aging:'Aging'})[type];}
  ingredientIcon(type:IngredientCatalogType):string{return ({hops:'eco',malts:'grain',yeasts:'bubble_chart',adjuncts:'category',salts:'science',aging:'barrel'})[type];}
  private load():void{this.loading.set(true);this.api.getCommunity().subscribe({next:view=>{this.view.set(view);this.loading.set(false);this.busy.set(null);},error:()=>{this.loading.set(false);this.notifications.error('No se pudo cargar la comunidad.');}});}
}
