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
  readonly waterProfiles$ = this.refresh$.pipe(switchMap(() => this.repository.getWaterProfiles()), shareReplay(1));
  readonly styles$ = this.refresh$.pipe(switchMap(() => this.repository.getStyles()), shareReplay(1));

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

  refresh(): void {
    this.refreshSubject.next();
  }
}
