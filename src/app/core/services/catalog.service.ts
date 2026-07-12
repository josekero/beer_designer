//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Injectable, inject } from '@angular/core';
import { Subject, combineLatest, map, shareReplay, startWith, switchMap } from 'rxjs';
import { ApiRepositoryService } from './api-repository.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly repository = inject(ApiRepositoryService);
  private readonly refreshSubject = new Subject<void>();
  private readonly refresh$ = this.refreshSubject.pipe(startWith(undefined));

  readonly hops$ = this.refresh$.pipe(switchMap(() => this.repository.getHops()), shareReplay(1));
  readonly malts$ = this.refresh$.pipe(switchMap(() => this.repository.getMalts()), shareReplay(1));
  readonly yeasts$ = this.refresh$.pipe(switchMap(() => this.repository.getYeasts()), shareReplay(1));
  readonly adjuncts$ = this.refresh$.pipe(switchMap(() => this.repository.getAdjuncts()), shareReplay(1));
  readonly agingIngredients$ = this.refresh$.pipe(switchMap(() => this.repository.getAgingIngredients()), shareReplay(1));
  readonly waterProfiles$ = this.refresh$.pipe(switchMap(() => this.repository.getWaterProfiles()), shareReplay(1));
  readonly styles$ = this.refresh$.pipe(switchMap(() => this.repository.getStyles()), shareReplay(1));
  readonly equipmentProfiles$ = this.refresh$.pipe(switchMap(() => this.repository.getEquipmentProfiles()), shareReplay(1));
  readonly mashProfiles$ = this.refresh$.pipe(switchMap(() => this.repository.getMashProfiles()), shareReplay(1));
  readonly carbonationProfiles$ = this.refresh$.pipe(switchMap(() => this.repository.getCarbonationProfiles()), shareReplay(1));
  readonly fermentationProfiles$ = this.refresh$.pipe(switchMap(() => this.repository.getFermentationProfiles()), shareReplay(1));

  readonly catalog$ = combineLatest({
    hops: this.hops$,
    malts: this.malts$,
    yeasts: this.yeasts$,
    adjuncts: this.adjuncts$,
    agingIngredients: this.agingIngredients$,
    waterProfiles: this.waterProfiles$,
    styles: this.styles$
    ,equipmentProfiles:this.equipmentProfiles$,
    mashProfiles:this.mashProfiles$,
    carbonationProfiles:this.carbonationProfiles$,
    fermentationProfiles:this.fermentationProfiles$
  });

  readonly dashboard$ = combineLatest({
    hops: this.hops$,
    malts: this.malts$,
    yeasts: this.yeasts$,
    adjuncts: this.adjuncts$,
    agingIngredients: this.agingIngredients$,
    waterProfiles: this.waterProfiles$,
    styles: this.styles$
    ,equipmentProfiles:this.equipmentProfiles$
  }).pipe(
    map((data) => ({
      ...data,
      counts: {
        hops: data.hops.length,
        malts: data.malts.length,
        yeasts: data.yeasts.length,
        adjuncts: data.adjuncts.length,
        agingIngredients: data.agingIngredients.length,
        waterProfiles: data.waterProfiles.length,
        styles: data.styles.length
      }
    }))
  );

  refresh(): void {
    this.refreshSubject.next();
  }
}
