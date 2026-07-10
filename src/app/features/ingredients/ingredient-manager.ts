//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, startWith, take } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Flocculation, Hop, HopFormat, HopUse, Malt, Yeast, YeastType } from '../../models/brewing.models';

type IngredientType = 'hops' | 'malts' | 'yeasts';

@Component({
  selector: 'app-ingredient-manager',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './ingredient-manager.html',
  styleUrl: './ingredient-manager.scss'
})
export class IngredientManager {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(CatalogService);
  private readonly api = inject(ApiRepositoryService);

  readonly typeControl = this.fb.nonNullable.control<IngredientType>('hops');
  readonly selectedIdControl = this.fb.nonNullable.control('');
  readonly statusControl = this.fb.nonNullable.control('');

  readonly hopForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    country: [''],
    alphaAcids: [8, [Validators.required, Validators.min(0)]],
    betaAcids: [0],
    format: ['pellet' as HopFormat, Validators.required],
    recommendedUse: ['hervido, whirlpool'],
    aromas: [''],
    description: [''],
    imageUrl: ['']
  });

  readonly maltForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    type: ['base', Validators.required],
    potential: [1.037, [Validators.required, Validators.min(1)]],
    colorSrm: [3, [Validators.required, Validators.min(0)]],
    diastaticPower: [0],
    maxRecommendedPercent: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    description: [''],
    imageUrl: ['']
  });

  readonly yeastForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    laboratory: [''],
    type: ['ale' as YeastType, Validators.required],
    attenuationMin: [70, [Validators.required, Validators.min(0)]],
    attenuationMax: [78, [Validators.required, Validators.min(0)]],
    temperatureMin: [18, Validators.required],
    temperatureMax: [22, Validators.required],
    flocculation: ['media' as Flocculation, Validators.required],
    alcoholTolerance: [10, [Validators.required, Validators.min(0)]],
    sensoryProfile: [''],
    imageUrl: ['']
  });

  readonly vm$ = combineLatest({
    catalog: this.catalog.catalog$,
    type: this.typeControl.valueChanges.pipe(startWith(this.typeControl.value)),
    selectedId: this.selectedIdControl.valueChanges.pipe(startWith(this.selectedIdControl.value)),
    status: this.statusControl.valueChanges.pipe(startWith(this.statusControl.value))
  }).pipe(
    map(({ catalog, type, selectedId, status }) => {
      const items = type === 'hops' ? catalog.hops : type === 'malts' ? catalog.malts : catalog.yeasts;
      return { catalog, type, selectedId, status, items };
    })
  );

  selectType(type: IngredientType): void {
    this.typeControl.setValue(type);
    this.selectedIdControl.setValue('');
    this.statusControl.setValue('');
    this.createNew();
  }

  selectIngredient(item: Hop | Malt | Yeast): void {
    this.selectedIdControl.setValue(item.id);
    this.statusControl.setValue('');

    if (this.typeControl.value === 'hops') {
      this.patchHop(item as Hop);
      return;
    }

    if (this.typeControl.value === 'malts') {
      this.patchMalt(item as Malt);
      return;
    }

    this.patchYeast(item as Yeast);
  }

  createNew(): void {
    const id = `new-${this.typeControl.value.slice(0, -1)}-${Date.now()}`;
    this.selectedIdControl.setValue('');
    this.statusControl.setValue('');

    if (this.typeControl.value === 'hops') {
      this.hopForm.reset({
        id,
        name: '',
        country: '',
        alphaAcids: 8,
        betaAcids: 0,
        format: 'pellet',
        recommendedUse: 'hervido, whirlpool',
        aromas: '',
        description: '',
        imageUrl: ''
      });
      return;
    }

    if (this.typeControl.value === 'malts') {
      this.maltForm.reset({
        id,
        name: '',
        type: 'base',
        potential: 1.037,
        colorSrm: 3,
        diastaticPower: 0,
        maxRecommendedPercent: 100,
        description: '',
        imageUrl: ''
      });
      return;
    }

    this.yeastForm.reset({
      id,
      name: '',
      laboratory: '',
      type: 'ale',
      attenuationMin: 70,
      attenuationMax: 78,
      temperatureMin: 18,
      temperatureMax: 22,
      flocculation: 'media',
      alcoholTolerance: 10,
      sensoryProfile: '',
      imageUrl: ''
    });
  }

  save(): void {
    if (this.typeControl.value === 'hops') {
      this.saveHop();
      return;
    }

    if (this.typeControl.value === 'malts') {
      this.saveMalt();
      return;
    }

    this.saveYeast();
  }

  importXml(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    file.text().then((xml) => {
      const request$ = this.typeControl.value === 'hops'
        ? this.api.importHopsXml(xml)
        : this.typeControl.value === 'malts'
          ? this.api.importMaltsXml(xml)
          : this.api.importYeastsXml(xml);

      request$.pipe(take(1)).subscribe((result) => {
        this.catalog.refresh();
        this.statusControl.setValue(`Importados ${result.imported} registros de ${result.type}.`);
        input.value = '';
      });
    });
  }

  private saveHop(): void {
    if (this.hopForm.invalid) {
      this.hopForm.markAllAsTouched();
      return;
    }

    const value = this.hopForm.getRawValue();
    const hop: Hop = {
      ...value,
      betaAcids: value.betaAcids || undefined,
      recommendedUse: this.csv(value.recommendedUse) as HopUse[],
      aromas: this.csv(value.aromas),
      imageUrl: value.imageUrl || undefined
    };
    this.api.saveHop(hop).pipe(take(1)).subscribe((saved) => {
      this.catalog.refresh();
      this.selectedIdControl.setValue(saved.id);
      this.statusControl.setValue(`Lúpulo guardado: ${saved.name}`);
    });
  }

  private saveMalt(): void {
    if (this.maltForm.invalid) {
      this.maltForm.markAllAsTouched();
      return;
    }

    const value = this.maltForm.getRawValue();
    const malt: Malt = {
      ...value,
      diastaticPower: value.diastaticPower || undefined,
      imageUrl: value.imageUrl || undefined
    };
    this.api.saveMalt(malt).pipe(take(1)).subscribe((saved) => {
      this.catalog.refresh();
      this.selectedIdControl.setValue(saved.id);
      this.statusControl.setValue(`Malta guardada: ${saved.name}`);
    });
  }

  private saveYeast(): void {
    if (this.yeastForm.invalid) {
      this.yeastForm.markAllAsTouched();
      return;
    }

    const value = this.yeastForm.getRawValue();
    const yeast: Yeast = {
      ...value,
      laboratory: value.laboratory || undefined,
      imageUrl: value.imageUrl || undefined
    };
    this.api.saveYeast(yeast).pipe(take(1)).subscribe((saved) => {
      this.catalog.refresh();
      this.selectedIdControl.setValue(saved.id);
      this.statusControl.setValue(`Levadura guardada: ${saved.name}`);
    });
  }

  private patchHop(hop: Hop): void {
    this.hopForm.patchValue({
      ...hop,
      betaAcids: hop.betaAcids ?? 0,
      recommendedUse: hop.recommendedUse.join(', '),
      aromas: hop.aromas.join(', '),
      imageUrl: hop.imageUrl ?? ''
    });
  }

  private patchMalt(malt: Malt): void {
    this.maltForm.patchValue({
      ...malt,
      diastaticPower: malt.diastaticPower ?? 0,
      imageUrl: malt.imageUrl ?? ''
    });
  }

  private patchYeast(yeast: Yeast): void {
    this.yeastForm.patchValue({
      ...yeast,
      laboratory: yeast.laboratory ?? '',
      imageUrl: yeast.imageUrl ?? ''
    });
  }

  private csv(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}
