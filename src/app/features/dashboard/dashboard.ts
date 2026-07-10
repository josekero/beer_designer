//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, map, startWith } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { BjcpStyle } from '../../models/brewing.models';
import { StatCard } from '../../shared/components/stat-card/stat-card';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink, StatCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly catalog = inject(CatalogService);
  private readonly recipes = inject(RecipeStoreService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly categoryControl = new FormControl('all', { nonNullable: true });
  readonly recipes$ = this.recipes.loadInitialRecipes();

  readonly dashboard$ = combineLatest({
    data: this.catalog.dashboard$,
    search: this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
    category: this.categoryControl.valueChanges.pipe(startWith(this.categoryControl.value))
  }).pipe(
    map(({ data, search, category }) => {
      const normalizedSearch = search.trim().toLowerCase();
      const categories = Array.from(new Set(data.styles.map((style) => style.category)))
        .sort()
        .map((name) => ({
          name,
          count: data.styles.filter((style) => style.category === name).length
        }));
      const filteredStyles = data.styles.filter((style) => {
        const matchesCategory = category === 'all' || style.category === category;
        const haystack = `${style.code} ${style.name} ${style.category} ${style.sensoryDescription}`.toLowerCase();
        return matchesCategory && (!normalizedSearch || haystack.includes(normalizedSearch));
      });

      return {
        ...data,
        categories,
        filteredStyles,
        mostIntenseStyle: this.getMostIntenseStyle(filteredStyles)
      };
    })
  );

  getStyleColor(style: BjcpStyle): string {
    const midpoint = (style.srmMin + style.srmMax) / 2;
    if (midpoint <= 3) {
      return '#FFD878';
    }

    if (midpoint <= 6) {
      return '#FBB123';
    }

    if (midpoint <= 10) {
      return '#E58500';
    }

    if (midpoint <= 16) {
      return '#A84C00';
    }

    if (midpoint <= 24) {
      return '#5D2900';
    }

    if (midpoint <= 32) {
      return '#261716';
    }

    return '#0F0B0A';
  }

  private getMostIntenseStyle(styles: BjcpStyle[]): BjcpStyle | undefined {
    return [...styles].sort((a, b) => b.ibuMax + b.abvMax * 10 - (a.ibuMax + a.abvMax * 10))[0];
  }
}
