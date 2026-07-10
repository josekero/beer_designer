import { Injectable, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { XmlRepositoryService } from './xml-repository.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly repository = inject(XmlRepositoryService);

  readonly hops$ = this.repository.getHops();
  readonly malts$ = this.repository.getMalts();
  readonly yeasts$ = this.repository.getYeasts();
  readonly waterProfiles$ = this.repository.getWaterProfiles();
  readonly styles$ = this.repository.getStyles();

  readonly catalog$ = combineLatest({
    hops: this.hops$,
    malts: this.malts$,
    yeasts: this.yeasts$,
    waterProfiles: this.waterProfiles$,
    styles: this.styles$
  });

  readonly dashboard$ = combineLatest({
    hops: this.hops$,
    malts: this.malts$,
    yeasts: this.yeasts$,
    waterProfiles: this.waterProfiles$,
    styles: this.styles$
  }).pipe(
    map((data) => ({
      ...data,
      counts: {
        hops: data.hops.length,
        malts: data.malts.length,
        yeasts: data.yeasts.length,
        waterProfiles: data.waterProfiles.length,
        styles: data.styles.length
      }
    }))
  );
}
