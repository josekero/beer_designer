import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { BrewDay } from '../../models/brewing.models';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, DatePipe, RouterLink, StatCard, UiTranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly catalog = inject(CatalogService);
  private readonly recipes = inject(RecipeStoreService);
  private readonly api = inject(ApiRepositoryService);
  private readonly today = new Date();

  readonly dashboard$ = combineLatest({
    catalog: this.catalog.dashboard$,
    recipes: this.recipes.loadInitialRecipes(),
    brewDays: this.api.getBrewDays(this.dateKey(this.today), this.dateKey(this.addDays(this.today, 60)))
  }).pipe(
    map(({ catalog, recipes, brewDays }) => {
      const tasks = brewDays.flatMap((brewDay) => (brewDay.tasks ?? [])
        .filter((task) => task.status !== 'cancelada')
        .map((task) => ({ kind:'task' as const, date:task.taskDate, time:task.taskTime, title:task.title, type:task.type, status:task.status, notes:task.notes, batchNumber:brewDay.batchNumber })));
      const agenda = [
        ...brewDays.filter((item)=>item.status!=='cancelada').map((item)=>({kind:'brew' as const,date:item.brewDate,time:item.startTime,title:item.title,type:'elaboración',status:item.status,notes:`${item.startTime.slice(0,5)}–${item.endTime.slice(0,5)}`,batchNumber:item.batchNumber})),
        ...tasks
      ].sort((a,b)=>`${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)).slice(0,7);
      return {
      catalog,
      recipeCount: recipes.length,
      recentRecipes: [...recipes]
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
        .slice(0, 5),
      upcomingAgenda: agenda,
      week: Array.from({ length: 7 }, (_, index) => {
        const date = this.addDays(this.today, index);
        const key = this.dateKey(date);
        return {
          date,
          key,
          today: index === 0,
          brewDays: brewDays.filter((item) => item.brewDate === key && item.status !== 'cancelada'),
          tasks: tasks.filter((item)=>item.date===key)
        };
      })
    }})
  );

  statusLabel(status: BrewDay['status']): string {
    return status === 'en curso' ? 'En curso' : status.charAt(0).toUpperCase() + status.slice(1);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
