import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map, startWith, switchMap, take } from 'rxjs';
import { BrewingCalculatorService } from '../../../core/services/brewing-calculator.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { RecipeStoreService } from '../../../core/services/recipe-store.service';
import { BjcpStyle, Malt, Recipe, RecipeMetrics, StyleComparison, Yeast } from '../../../models/brewing.models';

@Component({
  selector: 'app-recipe-editor',
  imports: [AsyncPipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.scss'
})
export class RecipeEditor implements OnInit {
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

  readonly catalog$ = this.catalog.catalog$;
  readonly form = this.fb.nonNullable.group({
    id: ['draft'],
    name: ['Nueva receta', Validators.required],
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
    waterAdditions: this.fb.array([this.createWaterAdditionGroup('Gypsum', 3)]),
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

  readonly summary$ = combineLatest([
    this.catalog$,
    this.form.valueChanges.pipe(startWith(this.form.getRawValue()))
  ]).pipe(
    map(([catalog]) => {
      const recipe = this.toRecipe();
      const style = catalog.styles.find((item) => item.id === recipe.styleId);
      const yeast = catalog.yeasts.find((item) => item.id === recipe.yeastId);
      const metrics = this.calculator.calculate(recipe, catalog.malts, yeast);
      const srmVisual = this.getSrmVisual(metrics.srm);
      return {
        recipe,
        style,
        yeast,
        water: catalog.waterProfiles.find((item) => item.id === recipe.waterProfileId),
        metrics,
        srmVisual,
        comparison: style ? this.calculator.compareToStyle(metrics, style) : []
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

  get mashStepsArray(): FormArray {
    return this.form.controls.mashSteps;
  }

  get boilStepsArray(): FormArray {
    return this.form.controls.boilSteps;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => id ? this.recipes.getRecipe(id) : this.catalog$.pipe(map(() => undefined))),
      take(1)
    ).subscribe((recipe) => {
      if (recipe) {
        this.patchRecipe(recipe);
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const recipe = this.toRecipe();
    this.recipes.saveRecipe(recipe);
    void this.router.navigate(['/recipes', recipe.id]);
  }

  private createMaltGroup(maltId: string, amountKg: number) {
    return this.fb.nonNullable.group({
      maltId: [maltId, Validators.required],
      amountKg: [amountKg, [Validators.required, Validators.min(0)]]
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

  private patchRecipe(recipe: Recipe): void {
    this.maltsArray.clear();
    recipe.malts.forEach((malt) => this.maltsArray.push(this.createMaltGroup(malt.maltId, malt.amountKg)));
    this.hopsArray.clear();
    recipe.hops.forEach((hop) => this.hopsArray.push(this.createHopGroup(hop.hopId, hop.amountG, hop.alphaAcids, hop.timeMin, hop.use)));
    this.waterAdditionsArray.clear();
    recipe.waterAdditions.forEach((addition) => this.waterAdditionsArray.push(this.createWaterAdditionGroup(addition.name, addition.amountG)));
    this.mashStepsArray.clear();
    recipe.mashSteps.forEach((step) => this.mashStepsArray.push(this.createMashStepGroup(step.name, step.temperatureC, step.timeMin)));
    this.boilStepsArray.clear();
    recipe.boilSteps.forEach((step) => this.boilStepsArray.push(this.createBoilStepGroup(step.name, step.timeMin, step.description)));
    this.form.patchValue(recipe);
  }

  private toRecipe(): Recipe {
    return this.form.getRawValue() as Recipe;
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
