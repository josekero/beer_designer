//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, take } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { BrewDay, Hop, Malt, Recipe } from '../../models/brewing.models';

interface CalendarDay {
  date: string;
  day: number;
  currentMonth: boolean;
  today: boolean;
  brewDays: BrewDay[];
}

@Component({
  selector: 'app-brew-day-planner',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './brew-day-planner.html',
  styleUrl: './brew-day-planner.scss'
})
export class BrewDayPlanner implements OnInit {
  private readonly api = inject(ApiRepositoryService);
  private readonly recipes = inject(RecipeStoreService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly today = new Date();
  readonly todayKey = this.toDateInput(this.today);
  currentMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  monthDays: CalendarDay[] = [];
  brewDays: BrewDay[] = [];
  recipeList: Recipe[] = [];
  malts: Malt[] = [];
  hops: Hop[] = [];
  selectedDate = this.todayKey;
  status = '';
  private monthLoadId = 0;

  readonly form = this.fb.group({
    id: ['', Validators.required],
    recipeId: ['', Validators.required],
    recipeName: [''],
    title: ['', Validators.required],
    batchNumber: ['', Validators.required],
    brewDate: [this.selectedDate, Validators.required],
    startTime: ['09:00', Validators.required],
    endTime: ['15:00', Validators.required],
    status: ['planificada' as BrewDay['status'], Validators.required],
    brewer: [''],
    targetVolumeL: [20],
    actualVolumeL: [0],
    targetOg: [0],
    actualOg: [0],
    targetFg: [0],
    actualFg: [0],
    actualAbv: [0],
    mashPh: [5.3],
    notes: [''],
    malts: this.fb.array([]),
    hops: this.fb.array([]),
    events: this.fb.array([])
  });

  get maltRows(): FormArray {
    return this.form.controls.malts as FormArray;
  }

  get hopRows(): FormArray {
    return this.form.controls.hops as FormArray;
  }

  get eventRows(): FormArray {
    return this.form.controls.events as FormArray;
  }

  ngOnInit(): void {
    this.recipes.loadInitialRecipes().pipe(
      filter((recipes) => recipes.length > 0),
      take(1)
    ).subscribe((recipes) => {
      this.recipeList = recipes;
      this.createNew(this.selectedDate);
    });

    this.catalog.catalog$.pipe(take(1)).subscribe((catalog) => {
      this.malts = catalog.malts;
      this.hops = catalog.hops;
    });

    this.loadMonth();
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.loadMonth();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.loadMonth();
  }

  goToday(): void {
    this.currentMonth = this.monthFromDateInput(this.todayKey);
    this.selectedDate = this.todayKey;
    this.createNew(this.todayKey);
    this.loadMonth();
  }

  selectDate(date: string): void {
    this.selectedDate = date;
    if (!this.isCurrentMonthDate(date)) {
      this.currentMonth = this.monthFromDateInput(date);
      this.loadMonth();
    }
    this.createNew(date);
  }

  selectBrewDay(brewDay: BrewDay): void {
    this.patchBrewDay(brewDay);
  }

  createNew(date = this.selectedDate): void {
    const recipe = this.recipeList[0];
    const id = `brew-${Date.now()}`;
    this.selectedDate = date;
    this.form.reset({
      id,
      recipeId: recipe?.id ?? '',
      recipeName: recipe?.name ?? '',
      title: recipe ? `Elaboración ${recipe.name}` : 'Nueva elaboración',
      batchNumber: `L-${date.replaceAll('-', '')}-01`,
      brewDate: date,
      startTime: '09:00',
      endTime: '15:00',
      status: 'planificada',
      brewer: '',
      targetVolumeL: recipe?.batchVolumeL ?? 20,
      actualVolumeL: 0,
      targetOg: 0,
      actualOg: 0,
      targetFg: 0,
      actualFg: 0,
      actualAbv: 0,
      mashPh: 5.3,
      notes: ''
    });
    this.status = '';
    this.loadRecipeSnapshot(recipe);
  }

  onRecipeChange(recipeId: string): void {
    const recipe = this.recipeList.find((item) => item.id === recipeId);
    if (!recipe) {
      return;
    }

    this.form.patchValue({
      recipeId: recipe.id,
      recipeName: recipe.name,
      title: `Elaboración ${recipe.name}`,
      targetVolumeL: recipe.batchVolumeL
    });
    this.loadRecipeSnapshot(recipe);
  }

  addMalt(): void {
    this.maltRows.push(this.maltGroup('', 0, 0, '', ''));
  }

  addHop(): void {
    this.hopRows.push(this.hopGroup('', 0, 0, 0, 0, '', '', ''));
  }

  addEvent(): void {
    this.eventRows.push(this.eventGroup('', 'medición', '', '', ''));
  }

  removeMalt(index: number): void {
    this.maltRows.removeAt(index);
  }

  removeHop(index: number): void {
    this.hopRows.removeAt(index);
  }

  removeEvent(index: number): void {
    this.eventRows.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const brewDay = this.form.getRawValue() as BrewDay;
    this.api.saveBrewDay(brewDay).pipe(take(1)).subscribe((saved) => {
      this.status = `Hoja guardada: ${saved.batchNumber}`;
      this.currentMonth = this.monthFromDateInput(saved.brewDate);
      this.selectedDate = saved.brewDate;
      this.patchBrewDay(saved);
      this.loadMonth();
    });
  }

  onBrewDateChange(date: string): void {
    if (!date) {
      return;
    }

    this.selectedDate = date;
    this.currentMonth = this.monthFromDateInput(date);
    this.loadMonth();
  }

  print(): void {
    window.print();
  }

  private loadMonth(): void {
    const month = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const loadId = ++this.monthLoadId;
    const from = this.calendarStartDate(month);
    const to = new Date(from);
    to.setDate(from.getDate() + 41);

    this.api.getBrewDays(this.toDateInput(from), this.toDateInput(to)).pipe(take(1)).subscribe((brewDays) => {
      if (loadId !== this.monthLoadId) {
        return;
      }

      this.brewDays = brewDays;
      this.monthDays = this.buildCalendar(month, brewDays);
    });
  }

  private buildCalendar(month: Date, brewDays: BrewDay[]): CalendarDay[] {
    const start = this.calendarStartDate(month);
    const brewDaysByDate = new Map<string, BrewDay[]>();
    brewDays.forEach((brewDay) => {
      const items = brewDaysByDate.get(brewDay.brewDate) ?? [];
      items.push(brewDay);
      brewDaysByDate.set(brewDay.brewDate, items);
    });

    return Array.from({ length: 42 }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const date = this.toDateInput(day);
      return {
        date,
        day: day.getDate(),
        currentMonth: day.getFullYear() === month.getFullYear() && day.getMonth() === month.getMonth(),
        today: date === this.todayKey,
        brewDays: brewDaysByDate.get(date) ?? []
      };
    });
  }

  private loadRecipeSnapshot(recipe?: Recipe): void {
    this.maltRows.clear();
    this.hopRows.clear();
    this.eventRows.clear();

    recipe?.malts.forEach((item) => {
      const malt = this.malts.find((candidate) => candidate.id === item.maltId);
      this.maltRows.push(this.maltGroup(malt?.name ?? item.maltId, item.amountKg, item.amountKg, '', ''));
    });

    recipe?.hops.forEach((item) => {
      const hop = this.hops.find((candidate) => candidate.id === item.hopId);
      this.hopRows.push(this.hopGroup(hop?.name ?? item.hopId, item.amountG, item.amountG, item.timeMin, item.timeMin, item.use, '', ''));
    });

    this.eventRows.push(this.eventGroup('09:00', 'macerado', 'Inicio de macerado', '', ''));
    this.eventRows.push(this.eventGroup('10:00', 'medición', 'pH macerado', '', 'pH'));
    this.eventRows.push(this.eventGroup('12:00', 'hervido', 'Inicio de hervido', '', ''));
    this.eventRows.push(this.eventGroup('15:00', 'fermentador', 'Trasiego a fermentador', '', 'L'));
  }

  private patchBrewDay(brewDay: BrewDay): void {
    this.maltRows.clear();
    this.hopRows.clear();
    this.eventRows.clear();
    brewDay.malts.forEach((item) => this.maltRows.push(this.maltGroup(item.ingredientName, item.plannedAmountKg ?? 0, item.actualAmountKg ?? 0, item.substituteName, item.notes)));
    brewDay.hops.forEach((item) => this.hopRows.push(this.hopGroup(item.ingredientName, item.plannedAmountG ?? 0, item.actualAmountG ?? 0, item.plannedTimeMin ?? 0, item.actualTimeMin ?? 0, item.use, item.substituteName, item.notes)));
    brewDay.events.forEach((item) => this.eventRows.push(this.eventGroup(item.eventTime ?? '', item.type, item.description, item.value, item.unit)));
    this.selectedDate = brewDay.brewDate;
    this.form.patchValue(brewDay);
  }

  private calendarStartDate(month = this.currentMonth): Date {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return start;
  }

  private isCurrentMonthDate(date: string): boolean {
    const candidate = this.monthFromDateInput(date);
    return candidate.getFullYear() === this.currentMonth.getFullYear() && candidate.getMonth() === this.currentMonth.getMonth();
  }

  private monthFromDateInput(date: string): Date {
    const [year, month] = date.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  private maltGroup(ingredientName: string, plannedAmountKg: number, actualAmountKg: number, substituteName: string, notes: string) {
    return this.fb.group({
      ingredientName: [ingredientName],
      plannedAmountKg: [plannedAmountKg],
      actualAmountKg: [actualAmountKg],
      substituteName: [substituteName],
      notes: [notes]
    });
  }

  private hopGroup(ingredientName: string, plannedAmountG: number, actualAmountG: number, plannedTimeMin: number, actualTimeMin: number, use: string, substituteName: string, notes: string) {
    return this.fb.group({
      ingredientName: [ingredientName],
      plannedAmountG: [plannedAmountG],
      actualAmountG: [actualAmountG],
      plannedTimeMin: [plannedTimeMin],
      actualTimeMin: [actualTimeMin],
      use: [use],
      substituteName: [substituteName],
      notes: [notes]
    });
  }

  private eventGroup(eventTime: string, type: string, description: string, value: string, unit: string) {
    return this.fb.group({
      eventTime: [eventTime],
      type: [type],
      description: [description],
      value: [value],
      unit: [unit]
    });
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
