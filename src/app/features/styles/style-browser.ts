import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, map, startWith } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { BjcpStyle } from '../../models/brewing.models';

@Component({
  selector: 'app-style-browser',
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './style-browser.html',
  styleUrl: './style-browser.scss'
})
export class StyleBrowser {
  private readonly catalog = inject(CatalogService);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly categoryControl = new FormControl('all', { nonNullable: true });

  readonly vm$ = combineLatest({
    styles: this.catalog.styles$,
    search: this.searchControl.valueChanges.pipe(startWith('')),
    category: this.categoryControl.valueChanges.pipe(startWith('all'))
  }).pipe(map(({ styles, search, category }) => {
    const query = this.normalize(search);
    const categories = Array.from(new Set(styles.map((style) => style.category))).sort().map((name) => ({
      name,
      count: styles.filter((style) => style.category === name).length
    }));
    const filteredStyles = styles.filter((style) => {
      const matchesCategory = category === 'all' || style.category === category;
      const text = this.normalize(`${style.code} ${style.name} ${style.category} ${style.sensoryDescription}`);
      return matchesCategory && (!query || text.includes(query));
    });
    return { styles, categories, filteredStyles, category };
  }));

  getStyleColor(style: BjcpStyle): string {
    const srm = (style.srmMin + style.srmMax) / 2;
    if (srm <= 3) return '#FFD878';
    if (srm <= 6) return '#FBB123';
    if (srm <= 10) return '#E58500';
    if (srm <= 16) return '#A84C00';
    if (srm <= 24) return '#5D2900';
    if (srm <= 32) return '#261716';
    return '#0F0B0A';
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }
}
