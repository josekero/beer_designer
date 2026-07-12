//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map, startWith, take } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Adjunct, AgingIngredient, BrewingSalt, Flocculation, Hop, HopFormat, HopUse, Malt, Yeast, YeastType } from '../../models/brewing.models';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';

type IngredientType = 'hops' | 'malts' | 'yeasts' | 'adjuncts' | 'salts' | 'aging';
type CatalogIngredient = Hop | Malt | Yeast | Adjunct | BrewingSalt | AgingIngredient;

@Component({
  selector: 'app-ingredient-manager',
  imports: [AsyncPipe, ReactiveFormsModule, UiTranslatePipe],
  templateUrl: './ingredient-manager.html',
  styleUrl: './ingredient-manager.scss'
})
export class IngredientManager {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(CatalogService);
  private readonly api = inject(ApiRepositoryService);
  private readonly route = inject(ActivatedRoute);

  readonly typeControl = this.fb.nonNullable.control<IngredientType>(this.initialType());
  readonly searchControl = this.fb.nonNullable.control('');
  readonly selectedIdControl = this.fb.nonNullable.control('');
  readonly statusControl = this.fb.nonNullable.control('');

  readonly hopForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    brand: [''],
    country: [''],
    alphaAcids: [8, [Validators.required, Validators.min(0)]],
    betaAcids: [0],
    format: ['pellet' as HopFormat, Validators.required],
    recommendedUse: ['hervido, whirlpool'],
    aromas: [''],
    description: [''],
    imageUrl: [''],
    distributorName: [''],
    distributorUrl: ['']
  });

  readonly maltForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    brand: [''],
    type: ['base', Validators.required],
    potential: [1.037, [Validators.required, Validators.min(1)]],
    colorSrm: [3, [Validators.required, Validators.min(0)]],
    diastaticPower: [0],
    maxRecommendedPercent: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    description: [''],
    imageUrl: [''],
    distributorName: [''],
    distributorUrl: ['']
  });

  readonly yeastForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    brand: [''],
    laboratory: [''],
    type: ['ale' as YeastType, Validators.required],
    attenuationMin: [70, [Validators.required, Validators.min(0)]],
    attenuationMax: [78, [Validators.required, Validators.min(0)]],
    temperatureMin: [18, Validators.required],
    temperatureMax: [22, Validators.required],
    flocculation: ['media' as Flocculation, Validators.required],
    alcoholTolerance: [10, [Validators.required, Validators.min(0)]],
    sensoryProfile: [''],
    imageUrl: [''],
    distributorName: [''],
    distributorUrl: ['']
  });

  readonly adjunctForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    brand: [''],
    category: ['fruta', Validators.required],
    format: ['puré', Validators.required],
    recommendedUse: ['secundario, maduración'],
    dosageGuidance: [''],
    fermentabilityPercent: [0],
    allergens: [''],
    description: [''],
    imageUrl: [''],
    distributorName: [''],
    distributorUrl: ['']
  });

  readonly agingForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    brand: [''],
    type: ['barrica', Validators.required],
    woodType: ['roble americano', Validators.required],
    previousUse: ['bourbon'],
    origin: [''],
    barrelDetails: [''],
    intensity: ['media'],
    contactTimeDaysMin: [14],
    contactTimeDaysMax: [90],
    description: [''],
    imageUrl: [''],
    distributorName: [''],
    distributorUrl: ['']
  });

  readonly saltForm=this.fb.nonNullable.group({id:['',Validators.required],name:['',Validators.required],formula:[''],category:['sal mineral',Validators.required],calciumPercent:[0],magnesiumPercent:[0],sodiumPercent:[0],sulfatePercent:[0],chloridePercent:[0],bicarbonatePercent:[0],description:['']});

  readonly vm$ = combineLatest({
    catalog: this.catalog.catalog$,
    type: this.typeControl.valueChanges.pipe(startWith(this.typeControl.value)),
    search: this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
    selectedId: this.selectedIdControl.valueChanges.pipe(startWith(this.selectedIdControl.value)),
    status: this.statusControl.valueChanges.pipe(startWith(this.statusControl.value))
  }).pipe(
    map(({ catalog, type, search, selectedId, status }) => {
      const query = this.normalizeSearch(search);
      const items = this.itemsForType(catalog, type).filter((item) => {
        if (!query) {
          return true;
        }

        return this.normalizeSearch([
          item.name,
          item.id,
          item.brand,
          item.distributorName
        ].filter(Boolean).join(' ')).includes(query);
      });
      return { catalog, type, selectedId, status, items };
    })
  );

  private initialType(): IngredientType {
    const type = this.route.snapshot.queryParamMap.get('type');
    const validTypes: IngredientType[] = ['hops', 'malts', 'yeasts', 'adjuncts','salts','aging'];
    return validTypes.includes(type as IngredientType) ? type as IngredientType : 'hops';
  }

  selectType(type: IngredientType): void {
    this.typeControl.setValue(type);
    this.searchControl.setValue('');
    this.selectedIdControl.setValue('');
    this.statusControl.setValue('');
    this.createNew();
  }

  selectIngredient(item: CatalogIngredient): void {
    this.selectedIdControl.setValue(item.id);
    this.statusControl.setValue('');
    if(this.typeControl.value==='salts'){this.saltForm.patchValue(item as BrewingSalt);return;}

    if (this.typeControl.value === 'hops') {
      this.patchHop(item as Hop);
      return;
    }

    if (this.typeControl.value === 'malts') {
      this.patchMalt(item as Malt);
      return;
    }

    if (this.typeControl.value === 'yeasts') {
      this.patchYeast(item as Yeast);
      return;
    }

    if (this.typeControl.value === 'adjuncts') {
      this.patchAdjunct(item as Adjunct);
      return;
    }
    this.patchAgingIngredient(item as AgingIngredient);
  }

  createNew(): void {
    const id = `new-${this.typeControl.value.slice(0, -1)}-${Date.now()}`;
    this.selectedIdControl.setValue('');
    this.statusControl.setValue('');
    if(this.typeControl.value==='salts'){this.saltForm.reset({id,name:'',formula:'',category:'sal mineral',calciumPercent:0,magnesiumPercent:0,sodiumPercent:0,sulfatePercent:0,chloridePercent:0,bicarbonatePercent:0,description:''});return;}

    if (this.typeControl.value === 'hops') {
      this.hopForm.reset({
        id,
        name: '',
        brand: '',
        country: '',
        alphaAcids: 8,
        betaAcids: 0,
        format: 'pellet',
        recommendedUse: 'hervido, whirlpool',
        aromas: '',
        description: '',
        imageUrl: '',
        distributorName: '',
        distributorUrl: ''
      });
      return;
    }

    if (this.typeControl.value === 'malts') {
      this.maltForm.reset({
        id,
        name: '',
        brand: '',
        type: 'base',
        potential: 1.037,
        colorSrm: 3,
        diastaticPower: 0,
        maxRecommendedPercent: 100,
        description: '',
        imageUrl: '',
        distributorName: '',
        distributorUrl: ''
      });
      return;
    }

    if (this.typeControl.value === 'yeasts') {
      this.yeastForm.reset({
        id,
        name: '',
        brand: '',
        laboratory: '',
        type: 'ale',
        attenuationMin: 70,
        attenuationMax: 78,
        temperatureMin: 18,
        temperatureMax: 22,
        flocculation: 'media',
        alcoholTolerance: 10,
        sensoryProfile: '',
        imageUrl: '',
        distributorName: '',
        distributorUrl: ''
      });
      return;
    }

    if (this.typeControl.value === 'adjuncts') {
      this.adjunctForm.reset({
        id,
        name: '',
        brand: '',
        category: 'fruta',
        format: 'puré',
        recommendedUse: 'secundario, maduración',
        dosageGuidance: '',
        fermentabilityPercent: 0,
        allergens: '',
        description: '',
        imageUrl: '',
        distributorName: '',
        distributorUrl: ''
      });
      return;
    }

    this.agingForm.reset({
      id,
      name: '',
      brand: '',
      type: 'barrica',
      woodType: 'roble americano',
      previousUse: 'bourbon',
      origin: '',
      barrelDetails: '',
      intensity: 'media',
      contactTimeDaysMin: 14,
      contactTimeDaysMax: 90,
      description: '',
      imageUrl: '',
      distributorName: '',
      distributorUrl: ''
    });
  }

  save(): void {
    if(this.typeControl.value==='salts'){this.saveSalt();return;}
    if (this.typeControl.value === 'hops') {
      this.saveHop();
      return;
    }

    if (this.typeControl.value === 'malts') {
      this.saveMalt();
      return;
    }

    if (this.typeControl.value === 'yeasts') {
      this.saveYeast();
      return;
    }

    if (this.typeControl.value === 'adjuncts') {
      this.saveAdjunct();
      return;
    }

    this.saveAgingIngredient();
  }

  importXml(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    file.text().then((xml) => {
      const request$ = this.importRequest(xml);

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
      imageUrl: value.imageUrl || undefined,
      brand: value.brand || undefined,
      distributorName: value.distributorName || undefined,
      distributorUrl: value.distributorUrl || undefined
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
      imageUrl: value.imageUrl || undefined,
      brand: value.brand || undefined,
      distributorName: value.distributorName || undefined,
      distributorUrl: value.distributorUrl || undefined
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
      imageUrl: value.imageUrl || undefined,
      brand: value.brand || undefined,
      distributorName: value.distributorName || undefined,
      distributorUrl: value.distributorUrl || undefined
    };
    this.api.saveYeast(yeast).pipe(take(1)).subscribe((saved) => {
      this.catalog.refresh();
      this.selectedIdControl.setValue(saved.id);
      this.statusControl.setValue(`Levadura guardada: ${saved.name}`);
    });
  }

  private saveAdjunct(): void {
    if (this.adjunctForm.invalid) {
      this.adjunctForm.markAllAsTouched();
      return;
    }

    const value = this.adjunctForm.getRawValue();
    const adjunct: Adjunct = {
      ...value,
      recommendedUse: this.csv(value.recommendedUse),
      dosageGuidance: value.dosageGuidance || undefined,
      fermentabilityPercent: value.fermentabilityPercent || undefined,
      allergens: value.allergens || undefined,
      imageUrl: value.imageUrl || undefined,
      brand: value.brand || undefined,
      distributorName: value.distributorName || undefined,
      distributorUrl: value.distributorUrl || undefined
    };
    this.api.saveAdjunct(adjunct).pipe(take(1)).subscribe((saved) => {
      this.catalog.refresh();
      this.selectedIdControl.setValue(saved.id);
      this.statusControl.setValue(`Adjunto guardado: ${saved.name}`);
    });
  }

  private saveAgingIngredient(): void {
    if (this.agingForm.invalid) {
      this.agingForm.markAllAsTouched();
      return;
    }

    const value = this.agingForm.getRawValue();
    const agingIngredient: AgingIngredient = {
      ...value,
      brand: value.brand || undefined,
      previousUse: value.previousUse || undefined,
      origin: value.origin || undefined,
      barrelDetails: value.barrelDetails || undefined,
      intensity: value.intensity || undefined,
      contactTimeDaysMin: value.contactTimeDaysMin || undefined,
      contactTimeDaysMax: value.contactTimeDaysMax || undefined,
      imageUrl: value.imageUrl || undefined,
      distributorName: value.distributorName || undefined,
      distributorUrl: value.distributorUrl || undefined
    };
    this.api.saveAgingIngredient(agingIngredient).pipe(take(1)).subscribe((saved) => {
      this.catalog.refresh();
      this.selectedIdControl.setValue(saved.id);
      this.statusControl.setValue(`Aging guardado: ${saved.name}`);
    });
  }

  private saveSalt():void{if(this.saltForm.invalid){this.saltForm.markAllAsTouched();return;}this.api.saveSalt(this.saltForm.getRawValue()).pipe(take(1)).subscribe(saved=>{this.catalog.refresh();this.selectedIdControl.setValue(saved.id);this.saltForm.patchValue(saved);this.statusControl.setValue(`Sal guardada: ${saved.name}`);});}

  private patchHop(hop: Hop): void {
    this.hopForm.patchValue({
      ...hop,
      betaAcids: hop.betaAcids ?? 0,
      recommendedUse: hop.recommendedUse.join(', '),
      aromas: hop.aromas.join(', '),
      imageUrl: hop.imageUrl ?? '',
      brand: hop.brand ?? '',
      distributorName: hop.distributorName ?? '',
      distributorUrl: hop.distributorUrl ?? ''
    });
  }

  private patchMalt(malt: Malt): void {
    this.maltForm.patchValue({
      ...malt,
      diastaticPower: malt.diastaticPower ?? 0,
      imageUrl: malt.imageUrl ?? '',
      brand: malt.brand ?? '',
      distributorName: malt.distributorName ?? '',
      distributorUrl: malt.distributorUrl ?? ''
    });
  }

  private patchYeast(yeast: Yeast): void {
    this.yeastForm.patchValue({
      ...yeast,
      laboratory: yeast.laboratory ?? '',
      imageUrl: yeast.imageUrl ?? '',
      brand: yeast.brand ?? '',
      distributorName: yeast.distributorName ?? '',
      distributorUrl: yeast.distributorUrl ?? ''
    });
  }

  private patchAdjunct(adjunct: Adjunct): void {
    this.adjunctForm.patchValue({
      ...adjunct,
      recommendedUse: adjunct.recommendedUse.join(', '),
      dosageGuidance: adjunct.dosageGuidance ?? '',
      fermentabilityPercent: adjunct.fermentabilityPercent ?? 0,
      allergens: adjunct.allergens ?? '',
      imageUrl: adjunct.imageUrl ?? '',
      brand: adjunct.brand ?? '',
      distributorName: adjunct.distributorName ?? '',
      distributorUrl: adjunct.distributorUrl ?? ''
    });
  }

  private patchAgingIngredient(agingIngredient: AgingIngredient): void {
    this.agingForm.patchValue({
      ...agingIngredient,
      brand: agingIngredient.brand ?? '',
      previousUse: agingIngredient.previousUse ?? '',
      origin: agingIngredient.origin ?? '',
      barrelDetails: agingIngredient.barrelDetails ?? '',
      intensity: agingIngredient.intensity ?? '',
      contactTimeDaysMin: agingIngredient.contactTimeDaysMin ?? 0,
      contactTimeDaysMax: agingIngredient.contactTimeDaysMax ?? 0,
      imageUrl: agingIngredient.imageUrl ?? '',
      distributorName: agingIngredient.distributorName ?? '',
      distributorUrl: agingIngredient.distributorUrl ?? ''
    });
  }

  private itemsForType(catalog: {
    hops: Hop[];
    malts: Malt[];
    yeasts: Yeast[];
    adjuncts: Adjunct[];
    agingIngredients: AgingIngredient[];
    salts:BrewingSalt[];
  }, type: IngredientType): CatalogIngredient[] {
    if (type === 'hops') {
      return catalog.hops;
    }

    if (type === 'malts') {
      return catalog.malts;
    }

    if (type === 'yeasts') {
      return catalog.yeasts;
    }

    if (type === 'adjuncts') {
      return catalog.adjuncts;
    }
    if(type==='salts')return catalog.salts;

    return catalog.agingIngredients;
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private importRequest(xml: string) {
    if (this.typeControl.value === 'hops') {
      return this.api.importHopsXml(xml);
    }

    if (this.typeControl.value === 'malts') {
      return this.api.importMaltsXml(xml);
    }

    if (this.typeControl.value === 'yeasts') {
      return this.api.importYeastsXml(xml);
    }

    if (this.typeControl.value === 'adjuncts') {
      return this.api.importAdjunctsXml(xml);
    }

    return this.api.importAgingIngredientsXml(xml);
  }

  private csv(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}
