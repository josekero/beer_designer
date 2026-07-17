import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminRecipe, AdminSummary, AdminUser } from '../../models/brewing.models';

@Component({selector:'app-admin-dashboard',templateUrl:'./admin-dashboard.html',styleUrl:'./admin-dashboard.scss'})
export class AdminDashboard implements OnInit{
  private readonly api=inject(ApiRepositoryService);private readonly notifications=inject(NotificationService);
  readonly summary=signal<AdminSummary|null>(null);readonly users=signal<AdminUser[]>([]);readonly recipes=signal<AdminRecipe[]>([]);readonly loading=signal(true);
  ngOnInit():void{this.load();}
  update(user:AdminUser,role:'USER'|'ADMIN'=user.role,enabled=user.enabled):void{this.api.setUserAccess(user.id,role,enabled).subscribe({next:()=>{this.notifications.success('Permisos actualizados.');this.load();},error:()=>this.notifications.error('No se pudieron actualizar los permisos.')});}
  sharing(recipe:AdminRecipe,publicRecipe:boolean,template:boolean):void{this.api.setAdminRecipeSharing(recipe.id,publicRecipe,template).subscribe({next:()=>{this.notifications.success('Publicación actualizada.');this.load();},error:()=>this.notifications.error('No se pudo actualizar la receta.')});}
  private load():void{this.loading.set(true);forkJoin({summary:this.api.getAdminSummary(),users:this.api.getAdminUsers(),recipes:this.api.getAdminRecipes()}).subscribe({next:data=>{this.summary.set(data.summary);this.users.set(data.users);this.recipes.set(data.recipes);this.loading.set(false);},error:()=>{this.loading.set(false);this.notifications.error('No se pudo cargar la administración.');}});}
}
