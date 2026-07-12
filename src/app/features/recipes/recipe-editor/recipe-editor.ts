//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize, map, startWith, switchMap, take, timeout } from 'rxjs';
import { BrewingCalculatorService } from '../../../core/services/brewing-calculator.service';
import { ApiRepositoryService } from '../../../core/services/api-repository.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { RecipeStoreService } from '../../../core/services/recipe-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BjcpStyle, EquipmentProfile, Malt, Recipe, RecipeImage, RecipeMetrics, StyleComparison, Yeast } from '../../../models/brewing.models';
import { BEER_GLASSWARE } from './beer-glassware';

@Component({
  selector: 'app-recipe-editor',
  imports: [AsyncPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.scss'
})
export class RecipeEditor implements OnInit {
  readonly glassware = BEER_GLASSWARE;
  private readonly srmColorScale = [
    { srm: 1, color: '#FFE699', label: 'Pajiza muy clara' },
    { srm: 2, color: '#FFD878', label: 'Pajiza' },
    { srm: 3, color: '#FFCA5A', label: 'Dorada clara' },
    { srm: 4, color: '#FFBF42', label: 'Dorada' },
    { srm: 6, color: '#FBB123', label: 'Dorada intensa' },
    { srm: 8, color: '#F49B00', label: 'Ámbar clara' },
    { srm: 10, color: '#E58500', label: 'Ámbar' },
    { srm: 13, color: '#CB6200', label: 'Cobriza' },
    { srm: 17, color: '#8D3B00', label: 'Marrón clara' },
    { srm: 20, color: '#5D2900', label: 'Marrón' },
    { srm: 24, color: '#3B1D00', label: 'Marrón oscura' },
    { srm: 29, color: '#261716', label: 'Muy oscura' },
    { srm: 35, color: '#16100F', label: 'Negra' },
    { srm: 40, color: '#0F0B0A', label: 'Negra opaca' }
  ];

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly recipes = inject(RecipeStoreService);
  private readonly calculator = inject(BrewingCalculatorService);
  private readonly api = inject(ApiRepositoryService);
  private readonly notifications = inject(NotificationService);
  recipeImage?: RecipeImage;
  imageStatus = '';
  uploadingImage = false;
  imageUploadProgress = 0;
  imageViewerOpen = false;
  canUploadImage = false;
  updatedAt?: string;
  recipeActionStatus = '';
  scaleOpen = false;
  equipmentProfiles: EquipmentProfile[] = [];
  private catalogMalts: Malt[] = [];
  private catalogYeasts: Yeast[] = [];

  readonly catalog$ = this.catalog.catalog$;
  readonly form = this.fb.nonNullable.group({
    id: ['draft'],
    name: ['Nueva receta', Validators.required],
    brewer: [''],
    untappdUrl: ['', Validators.pattern(/^https:\/\/(www\.)?untappd\.com\/b\/[A-Za-z0-9_-]+\/\d+\/?$/)],
    equipmentProfileId: ['pilot-20l'],
    mashProfileId: ['single-infusion-66'],
    carbonationProfileId: ['bottle-standard'],
    fermentationProfileId: ['ale-standard'],
    glasswareId: ['american-pint'],
    version: [1, [Validators.required, Validators.min(1)]],
    styleId: ['american-ipa', Validators.required],
    batchVolumeL: [20, [Validators.required, Validators.min(1)]],
    efficiencyPercent: [72, [Validators.required, Validators.min(1), Validators.max(100)]],
    boilVolumeL: [24, [Validators.required, Validators.min(1)]],
    malts: this.fb.array([
      this.createMaltGroup('pale-ale', 4.8),
      this.createMaltGroup('caramel-40', 0.35)
    ]),
    hops: this.fb.array([
      this.createHopGroup('cascade', 30, 5.5, 60, 'hervido'),
      this.createHopGroup('citra', 40, 12, 10, 'whirlpool')
    ]),
    yeastId: ['us-05', Validators.required],
    waterProfileId: ['balanced', Validators.required],
    waterTreatment: this.fb.nonNullable.group({
      calcium:[0], magnesium:[0], sodium:[0], sulfate:[0], chloride:[0], bicarbonate:[0],
      mashPh:[5.3], spargePh:[5.6], notes:['']
    }),
    waterAdditions: this.fb.array([this.createWaterAdditionGroup('Gypsum', 3)]),
    processAdditions: this.fb.array([]),
    mashSteps: this.fb.array([this.createMashStepGroup('Sacarificacion', 66, 60)]),
    boilSteps: this.fb.array([this.createBoilStepGroup('Hervido vigoroso', 60, 'Añadir lúpulos según programa')]),
    fermentation: this.fb.nonNullable.group({
      primaryDays: [10, Validators.min(0)],
      primaryTempC: [19],
      secondaryDays: [0, Validators.min(0)],
      secondaryTempC: [18]
    }),
    dryHop: this.fb.nonNullable.group({
      enabled: [true],
      days: [3, Validators.min(0)],
      temperatureC: [16]
    }),
    packaging: this.fb.nonNullable.group({
      maturationDays: [14, Validators.min(0)],
      carbonationVolumes: [2.4],
      method: ['Botella']
    }),
    notes: ['Primera version editable con calculos en tiempo real.']
  });

  readonly scaleForm = this.fb.nonNullable.group({
    equipmentProfileId:['production-500l'], batchVolumeL:[500,[Validators.required,Validators.min(1)]],
    efficiencyPercent:[80,[Validators.required,Validators.min(1),Validators.max(100)]], boilVolumeL:[570,[Validators.required,Validators.min(1)]],
    createCopy:[true]
  });

  readonly summary$ = combineLatest([
    this.catalog$,
    this.form.valueChanges.pipe(startWith(this.form.getRawValue()))
  ]).pipe(
    map(([catalog]) => {
      const recipe = this.toRecipe();
      const style = catalog.styles.find((item) => item.id === recipe.styleId);
      const yeast = catalog.yeasts.find((item) => item.id === recipe.yeastId);
      const equipment = catalog.equipmentProfiles.find((item) => item.id === recipe.equipmentProfileId);
      const metrics = this.calculator.calculate(recipe, catalog.malts, yeast, equipment?.hopUtilizationPercent ?? 100);
      const srmVisual = this.getSrmVisual(metrics.srm);
      return {
        recipe,
        style,
        yeast,
        water: catalog.waterProfiles.find((item) => item.id === recipe.waterProfileId),
        metrics,
        srmVisual,
        comparison: style ? this.calculator.compareToStyle(metrics, style) : []
        ,glass: this.glassware.find(item => item.id === recipe.glasswareId) ?? this.glassware[0]
      };
    })
  );

  get maltsArray(): FormArray {
    return this.form.controls.malts;
  }

  get hopsArray(): FormArray {
    return this.form.controls.hops;
  }

  get waterAdditionsArray(): FormArray {
    return this.form.controls.waterAdditions;
  }

  get processAdditionsArray(): FormArray { return this.form.controls.processAdditions; }

  maltPercent(index: number): number {
    const total = this.maltsArray.controls.reduce((sum, control) => sum + Number(control.get('amountKg')?.value || 0), 0);
    return total ? Number(this.maltsArray.at(index).get('amountKg')?.value || 0) / total * 100 : 0;
  }

  get mashStepsArray(): FormArray {
    return this.form.controls.mashSteps;
  }

  get boilStepsArray(): FormArray {
    return this.form.controls.boilSteps;
  }

  ngOnInit(): void {
    this.catalog$.pipe(take(1)).subscribe((catalog)=>{this.equipmentProfiles=catalog.equipmentProfiles;this.catalogMalts=catalog.malts;this.catalogYeasts=catalog.yeasts;});
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => id ? this.recipes.getRecipe(id) : this.catalog$.pipe(map(() => undefined))),
      take(1)
    ).subscribe((recipe) => {
      if (recipe) {
        this.patchRecipe(recipe);
        this.canUploadImage = true;
      } else {
        this.form.controls.id.setValue(`recipe-${Date.now()}`);
      }
    });
  }

  addMalt(defaultMaltId: string): void {
    this.maltsArray.push(this.createMaltGroup(defaultMaltId, 0.25));
  }

  addHop(defaultHopId: string): void {
    this.hopsArray.push(this.createHopGroup(defaultHopId, 25, 5, 10, 'hervido'));
  }

  addWaterAddition(): void {
    this.waterAdditionsArray.push(this.createWaterAdditionGroup('Calcium chloride', 1));
  }

  addProcessAddition(): void { this.processAdditionsArray.push(this.createProcessAdditionGroup()); }

  addMashStep(): void {
    this.mashStepsArray.push(this.createMashStepGroup('Descanso', 67, 20));
  }

  addBoilStep(): void {
    this.boilStepsArray.push(this.createBoilStepGroup('Proceso', 15, 'Ajuste de hervido'));
  }

  removeAt(array: FormArray, index: number): void {
    if (array.length > 1) {
      array.removeAt(index);
    }
  }

  syncHopAlpha(index: number, alphaAcids: number): void {
    this.hopsArray.at(index).get('alphaAcids')?.setValue(alphaAcids);
  }

  applyEquipmentProfile(id: string): void {
    this.catalog$.pipe(take(1)).subscribe(({equipmentProfiles}) => {
      const profile = equipmentProfiles.find(item => item.id === id);
      if (profile) this.form.patchValue({batchVolumeL: profile.batchVolumeL, boilVolumeL: profile.boilVolumeL, efficiencyPercent: profile.efficiencyPercent});
    });
  }

  applyMashProfile(id: string): void {
    this.catalog$.pipe(take(1)).subscribe(({mashProfiles}) => {
      const profile = mashProfiles.find(item => item.id === id);
      if (!profile) return;
      this.mashStepsArray.clear();
      this.mashStepsArray.push(this.createMashStepGroup('Macerado', profile.mashTempC, profile.mashTimeMin));
      if (profile.mashOutTimeMin > 0) this.mashStepsArray.push(this.createMashStepGroup('Mash out', profile.mashOutTempC, profile.mashOutTimeMin));
    });
  }

  applyFermentationProfile(id: string): void {
    this.catalog$.pipe(take(1)).subscribe(({fermentationProfiles}) => {
      const profile = fermentationProfiles.find(item => item.id === id);
      if (profile) this.form.controls.fermentation.patchValue({primaryDays: profile.primaryDays, primaryTempC: profile.primaryTempC, secondaryDays: profile.secondaryDays, secondaryTempC: profile.secondaryTempC});
      if (profile) this.form.controls.packaging.controls.maturationDays.setValue(profile.maturationDays);
    });
  }

  applyCarbonationProfile(id: string): void {
    this.catalog$.pipe(take(1)).subscribe(({carbonationProfiles}) => {
      const profile = carbonationProfiles.find(item => item.id === id);
      if (profile) this.form.controls.packaging.patchValue({carbonationVolumes: profile.targetVolumes, method: profile.method});
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.error('No se ha guardado: revisa los campos marcados de la receta.');
      return;
    }

    const recipe = this.toRecipe();
    this.recipes.saveRecipe(recipe).pipe(take(1)).subscribe({
      next:(savedRecipe) => {
        this.canUploadImage = true;
        this.updatedAt=savedRecipe.updatedAt;
        this.notifications.success(`Receta “${savedRecipe.name}” guardada correctamente en v${savedRecipe.version ?? 1}.`);
        void this.router.navigate(['/recipes', savedRecipe.id]);
      },
      error:()=>this.notifications.error('No se pudo guardar la receta. Revisa los campos e inténtalo de nuevo.')
    });
  }

  duplicate(): void {
    const duplicate: Recipe = { ...this.toRecipe(), id: `recipe-${Date.now()}`, name: `Copia de ${this.form.controls.name.value}`, version: 1, updatedAt: undefined, image: undefined };
    this.recipes.saveRecipe(duplicate).pipe(take(1)).subscribe({next:(saved)=>{this.notifications.success(`Copia “${saved.name}” creada correctamente en v1.`);void this.router.navigate(['/recipes',saved.id]);},error:()=>this.notifications.error('No se pudo duplicar la receta.')});
  }

  openScale(): void {
    const current=this.form.controls.equipmentProfileId.value;
    const target=this.equipmentProfiles.find(item=>item.id!==current) ?? this.equipmentProfiles[0];
    if(target) this.selectScaleProfile(target.id);
    this.scaleOpen=true;
  }

  selectScaleProfile(id:string):void {
    const profile=this.equipmentProfiles.find(item=>item.id===id); if(!profile)return;
    this.scaleForm.patchValue({equipmentProfileId:id,batchVolumeL:profile.batchVolumeL,efficiencyPercent:profile.efficiencyPercent,boilVolumeL:profile.boilVolumeL});
  }

  get scalePreview(): {before:RecipeMetrics;after:RecipeMetrics;grainFactor:number;hopFactor:number}|undefined {
    if(!this.catalogMalts.length)return undefined;
    const before=this.toRecipe(), after=this.scaledRecipe();
    const yeast=this.catalogYeasts.find(item=>item.id===before.yeastId);
    const volumeRatio=after.batchVolumeL/before.batchVolumeL;
    const beforeUtil=this.equipmentProfiles.find(item=>item.id===before.equipmentProfileId)?.hopUtilizationPercent ?? 100;
    const afterUtil=this.equipmentProfiles.find(item=>item.id===after.equipmentProfileId)?.hopUtilizationPercent ?? 100;
    return {before:this.calculator.calculate(before,this.catalogMalts,yeast,beforeUtil),after:this.calculator.calculate(after,this.catalogMalts,yeast,afterUtil),grainFactor:volumeRatio*before.efficiencyPercent/after.efficiencyPercent,hopFactor:this.hopScaleFactor(before,after)};
  }

  applyScale():void {
    const scaled=this.scaledRecipe();
    if(this.scaleForm.controls.createCopy.value){
      scaled.id=`recipe-${Date.now()}`; scaled.name=`${scaled.name} · ${scaled.batchVolumeL} L`; scaled.version=1; scaled.updatedAt=undefined; scaled.image=undefined;
      this.recipes.saveRecipe(scaled).pipe(take(1)).subscribe({next:saved=>{this.notifications.success(`Receta escalada a ${saved.batchVolumeL} L y guardada como copia.`);void this.router.navigate(['/recipes',saved.id]);},error:()=>this.notifications.error('No se pudo crear la copia escalada.')});
    } else { this.patchRecipe(scaled); this.scaleOpen=false; this.notifications.info(`Escalado a ${scaled.batchVolumeL} L aplicado. Pulsa “Guardar receta” para conservarlo.`); }
  }

  private scaledRecipe():Recipe {
    const source=this.toRecipe(); const target=this.scaleForm.getRawValue();
    const volumeRatio=target.batchVolumeL/source.batchVolumeL;
    const grainFactor=volumeRatio*source.efficiencyPercent/target.efficiencyPercent;
    const base={...source,batchVolumeL:target.batchVolumeL,boilVolumeL:target.boilVolumeL,efficiencyPercent:target.efficiencyPercent,equipmentProfileId:target.equipmentProfileId};
    const hopFactor=this.hopScaleFactor(source,base);
    return {...base,
      malts:source.malts.map(item=>({...item,amountKg:this.roundScale(item.amountKg*grainFactor,3)})),
      hops:source.hops.map(item=>({...item,amountG:this.roundScale(item.amountG*hopFactor,1)})),
      waterAdditions:source.waterAdditions.map(item=>({...item,amountG:this.roundScale(item.amountG*volumeRatio,2)})),
      processAdditions:source.processAdditions.map(item=>({...item,amountG:this.roundScale(item.amountG*volumeRatio,1)}))};
  }

  private hopScaleFactor(source:Recipe,target:Recipe):number {
    const sourceProfile=this.equipmentProfiles.find(item=>item.id===source.equipmentProfileId);
    const targetProfile=this.equipmentProfiles.find(item=>item.id===target.equipmentProfileId);
    return target.batchVolumeL/source.batchVolumeL*(sourceProfile?.hopUtilizationPercent??100)/(targetProfile?.hopUtilizationPercent??100);
  }

  private roundScale(value:number,decimals:number):number {const factor=10**decimals;return Math.round(value*factor)/factor;}

  deleteRecipe(): void {
    if (!this.canUploadImage || !window.confirm(`¿Eliminar definitivamente “${this.form.controls.name.value}”?`)) return;
    this.recipeActionStatus = 'Eliminando…';
    this.recipes.deleteRecipe(this.form.controls.id.value).pipe(take(1)).subscribe({
      next: () => {this.notifications.success(`Receta “${this.form.controls.name.value}” eliminada correctamente.`);void this.router.navigate(['/recipes']);},
      error: (error: { status?: number }) => {
        this.recipeActionStatus = error.status === 409 ? 'No se puede eliminar porque tiene elaboraciones asociadas.' : 'No se pudo eliminar la receta.';
        this.notifications.error(this.recipeActionStatus);
      }
    });
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.imageStatus = 'Selecciona un JPG o PNG de hasta 5 MB.';
      input.value = '';
      return;
    }
    this.uploadingImage = true;
    this.imageUploadProgress = 0;
    this.imageStatus = 'Subiendo imagen…';
    this.api.uploadRecipeImage(this.form.controls.id.value, file).pipe(
      timeout(60_000),
      finalize(() => {
        this.uploadingImage = false;
        input.value = '';
      })
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.imageUploadProgress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          this.imageStatus = `Subiendo imagen… ${this.imageUploadProgress}%`;
        }
        if (event instanceof HttpResponse && event.body) {
          const image = event.body;
          this.recipeImage = { ...image, url: `${image.url}?v=${Date.now()}` };
          this.imageUploadProgress = 100;
          this.imageStatus = 'Imagen guardada correctamente.';
        }
      },
      error: (error: { status?: number; name?: string }) => {
        this.imageStatus = error.name === 'TimeoutError'
          ? 'La subida ha tardado demasiado y se ha cancelado. Inténtalo de nuevo.'
          : error.status === 413
          ? 'La imagen supera el límite permitido de 5 MB.'
          : 'No se pudo subir. Comprueba que sea un JPG o PNG válido de hasta 6000 × 6000 px.';
      }
    });
  }

  private createMaltGroup(maltId: string, amountKg: number) {
    return this.fb.nonNullable.group({
      maltId: [maltId, Validators.required],
      amountKg: [amountKg, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  private createHopGroup(hopId: string, amountG: number, alphaAcids: number, timeMin: number, use: Recipe['hops'][number]['use']) {
    return this.fb.nonNullable.group({
      hopId: [hopId, Validators.required],
      amountG: [amountG, [Validators.required, Validators.min(0)]],
      alphaAcids: [alphaAcids, [Validators.required, Validators.min(0)]],
      timeMin: [timeMin, [Validators.required, Validators.min(0)]],
      use: [use, Validators.required]
    });
  }

  private createWaterAdditionGroup(name: string, amountG: number) {
    return this.fb.nonNullable.group({
      name: [name],
      amountG: [amountG, Validators.min(0)]
    });
  }

  private createMashStepGroup(name: string, temperatureC: number, timeMin: number) {
    return this.fb.nonNullable.group({
      name: [name, Validators.required],
      temperatureC: [temperatureC],
      timeMin: [timeMin, Validators.min(0)]
    });
  }

  private createBoilStepGroup(name: string, timeMin: number, description: string) {
    return this.fb.nonNullable.group({
      name: [name, Validators.required],
      timeMin: [timeMin, Validators.min(0)],
      description: [description]
    });
  }

  private createProcessAdditionGroup(item?: Recipe['processAdditions'][number]) {
    return this.fb.nonNullable.group({
      name:[item?.name ?? ''], brand:[item?.brand ?? ''], amountG:[item?.amountG ?? 0],
      stage:[item?.stage ?? 'hervido'], timeMin:[item?.timeMin ?? 0], temperatureC:[item?.temperatureC ?? 0],
      dayLabel:[item?.dayLabel ?? ''], notes:[item?.notes ?? '']
    });
  }

  private patchRecipe(recipe: Recipe): void {
    this.recipeImage = recipe.image;
    this.updatedAt = recipe.updatedAt;
    this.maltsArray.clear();
    recipe.malts.forEach((malt) => {
      const group = this.createMaltGroup(malt.maltId, malt.amountKg);
      group.controls.notes.setValue(malt.notes ?? '');
      this.maltsArray.push(group);
    });
    this.hopsArray.clear();
    recipe.hops.forEach((hop) => this.hopsArray.push(this.createHopGroup(hop.hopId, hop.amountG, hop.alphaAcids, hop.timeMin, hop.use)));
    this.waterAdditionsArray.clear();
    recipe.waterAdditions.forEach((addition) => this.waterAdditionsArray.push(this.createWaterAdditionGroup(addition.name, addition.amountG)));
    this.mashStepsArray.clear();
    recipe.mashSteps.forEach((step) => this.mashStepsArray.push(this.createMashStepGroup(step.name, step.temperatureC, step.timeMin)));
    this.boilStepsArray.clear();
    recipe.boilSteps.forEach((step) => this.boilStepsArray.push(this.createBoilStepGroup(step.name, step.timeMin, step.description)));
    this.processAdditionsArray.clear();
    (recipe.processAdditions ?? []).forEach((item) => this.processAdditionsArray.push(this.createProcessAdditionGroup(item)));
    recipe.waterTreatment ??= { calcium:0, magnesium:0, sodium:0, sulfate:0, chloride:0, bicarbonate:0, mashPh:5.3, spargePh:5.6, notes:'' };
    this.form.patchValue({ ...recipe, brewer: recipe.brewer ?? '', untappdUrl: recipe.untappdUrl ?? '', glasswareId: recipe.glasswareId ?? 'american-pint', version: recipe.version ?? 1 });
  }

  private toRecipe(): Recipe {
    return { ...this.form.getRawValue(), image: this.recipeImage } as Recipe;
  }

  private getSrmVisual(srm: number): { color: string; label: string; opacity: number } {
    const boundedSrm = Math.min(Math.max(srm || 1, this.srmColorScale[0].srm), this.srmColorScale[this.srmColorScale.length - 1].srm);
    const upperIndex = this.srmColorScale.findIndex((point) => point.srm >= boundedSrm);
    const upper = this.srmColorScale[upperIndex];
    const lower = this.srmColorScale[Math.max(upperIndex - 1, 0)];

    if (upper.srm === lower.srm) {
      return { color: upper.color, label: upper.label, opacity: this.getSrmOpacity(boundedSrm) };
    }

    const ratio = (boundedSrm - lower.srm) / (upper.srm - lower.srm);
    return {
      color: this.interpolateHex(lower.color, upper.color, ratio),
      label: upper.label,
      opacity: this.getSrmOpacity(boundedSrm)
    };
  }

  private getSrmOpacity(srm: number): number {
    return Math.min(0.96, Math.max(0.42, 0.34 + srm / 42));
  }

  private interpolateHex(from: string, to: string, ratio: number): string {
    const start = this.hexToRgb(from);
    const end = this.hexToRgb(to);
    const rgb = start.map((channel, index) => Math.round(channel + (end[index] - channel) * ratio));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const value = hex.replace('#', '');
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16)
    ];
  }
}
