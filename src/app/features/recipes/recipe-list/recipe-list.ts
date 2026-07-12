import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map, shareReplay, Subject, startWith, switchMap, take } from 'rxjs';
import { ApiRepositoryService } from '../../../core/services/api-repository.service';
import { BrewingCalculatorService } from '../../../core/services/brewing-calculator.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecipeStoreService } from '../../../core/services/recipe-store.service';
import { RecipeFolder } from '../../../models/brewing.models';

@Component({selector:'app-recipe-list',imports:[AsyncPipe,DecimalPipe,RouterLink],templateUrl:'./recipe-list.html',styleUrl:'./recipe-list.scss'})
export class RecipeList {
  private readonly recipes=inject(RecipeStoreService); private readonly catalog=inject(CatalogService); private readonly calculator=inject(BrewingCalculatorService);
  private readonly api=inject(ApiRepositoryService); private readonly notifications=inject(NotificationService); private readonly refresh$=new Subject<void>();
  folders:RecipeFolder[]=[]; draggedRecipe?:{id:string;folderId:string}; draggedFolderId?:string;
  readonly vm$=this.refresh$.pipe(startWith(undefined),switchMap(()=>combineLatest({recipes:this.recipes.loadInitialRecipes(),catalog:this.catalog.catalog$,folders:this.api.getRecipeFolders()})),map(({recipes,catalog,folders})=>{
    this.folders=folders.map(f=>({...f,recipeIds:[...f.recipeIds]}));
    const cards=recipes.map(recipe=>{const style=catalog.styles.find(x=>x.id===recipe.styleId),yeast=catalog.yeasts.find(x=>x.id===recipe.yeastId),equipment=catalog.equipmentProfiles.find(x=>x.id===recipe.equipmentProfileId);return{recipe,style,abv:this.calculator.calculate(recipe,catalog.malts,yeast,equipment?.hopUtilizationPercent??100).abv};});
    return {folders:this.folders,cardsById:new Map(cards.map(card=>[card.recipe.id,card]))};
  }),shareReplay(1));

  createFolder():void{const name=window.prompt('Nombre de la nueva carpeta');if(!name?.trim())return;this.api.createRecipeFolder(name).pipe(take(1)).subscribe({next:()=>{this.notifications.success(`Carpeta “${name.trim()}” creada.`);this.refresh$.next();},error:()=>this.notifications.error('No se pudo crear la carpeta.')});}
  rename(folder:RecipeFolder):void{const name=window.prompt('Nuevo nombre de la carpeta',folder.name);if(!name?.trim()||name.trim()===folder.name)return;this.api.renameRecipeFolder(folder.id,name).pipe(take(1)).subscribe({next:()=>{this.notifications.success('Carpeta renombrada.');this.refresh$.next();},error:()=>this.notifications.error('No se pudo renombrar la carpeta.')});}
  remove(folder:RecipeFolder):void{if(folder.isDefault||!window.confirm(`¿Borrar “${folder.name}”? Sus recetas pasarán a General.`))return;this.api.deleteRecipeFolder(folder.id).pipe(take(1)).subscribe({next:()=>{this.notifications.success('Carpeta eliminada; sus recetas están en General.');this.refresh$.next();},error:()=>this.notifications.error('No se pudo eliminar la carpeta.')});}
  startRecipe(event:DragEvent,id:string,folderId:string):void{event.stopPropagation();this.draggedRecipe={id,folderId};this.draggedFolderId=undefined;event.dataTransfer?.setData('text/plain',id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';}
  dropRecipe(event:DragEvent,targetFolderId:string,targetId?:string):void{event.preventDefault();if(!this.draggedRecipe)return;const source=this.folders.find(f=>f.id===this.draggedRecipe!.folderId),target=this.folders.find(f=>f.id===targetFolderId);if(!source||!target)return;source.recipeIds=source.recipeIds.filter(id=>id!==this.draggedRecipe!.id);let index=targetId?target.recipeIds.indexOf(targetId):target.recipeIds.length;if(index<0)index=target.recipeIds.length;target.recipeIds.splice(index,0,this.draggedRecipe.id);this.draggedRecipe=undefined;this.persist('Receta movida y orden guardado.');}
  startFolder(event:DragEvent,id:string):void{this.draggedFolderId=id;this.draggedRecipe=undefined;event.dataTransfer?.setData('text/plain',id);}
  dropFolder(event:DragEvent,targetId:string):void{event.preventDefault();if(!this.draggedFolderId||this.draggedFolderId===targetId)return;const from=this.folders.findIndex(f=>f.id===this.draggedFolderId),to=this.folders.findIndex(f=>f.id===targetId);const [folder]=this.folders.splice(from,1);this.folders.splice(to,0,folder);this.draggedFolderId=undefined;this.persist('Orden de carpetas guardado.');}
  private persist(message:string):void{this.api.saveRecipeFolderLayout(this.folders).pipe(take(1)).subscribe({next:()=>{this.notifications.success(message);this.refresh$.next();},error:()=>{this.notifications.error('No se pudo guardar la organización.');this.refresh$.next();}});}
}
