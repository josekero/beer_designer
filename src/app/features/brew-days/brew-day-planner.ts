//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 11 July 2026
//
//------------------------------------------------

import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, take } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { CatalogService } from '../../core/services/catalog.service';
import { RecipeStoreService } from '../../core/services/recipe-store.service';
import { Adjunct, BrewDay, BrewDayTask, Brewery, EquipmentProfile, Hop, Malt, Recipe, Yeast } from '../../models/brewing.models';
import { NotificationService } from '../../core/services/notification.service';
import { BrewingCalculatorService } from '../../core/services/brewing-calculator.service';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';

interface CalendarDay {
  date: string;
  day: number;
  currentMonth: boolean;
  today: boolean;
  brewDays: BrewDay[];
  tasks: { task: BrewDayTask; brewDay: BrewDay }[];
}

@Component({
  selector: 'app-brew-day-planner',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, UiTranslatePipe],
  templateUrl: './brew-day-planner.html',
  styleUrl: './brew-day-planner.scss'
})
export class BrewDayPlanner implements OnInit {
  private readonly api = inject(ApiRepositoryService);
  private readonly recipes = inject(RecipeStoreService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notifications=inject(NotificationService);
  private readonly calculator=inject(BrewingCalculatorService);

  readonly today = new Date();
  readonly printGeneratedAt = new Date();
  readonly fermentationPrintRows = Array.from({ length: 7 });
  readonly dryHopPrintRows = Array.from({ length: 4 });
  readonly packagingFormats = ['Corni 19 L', 'KeyKeg 20 L', 'KeyKeg 30 L', 'Inox 30 L', 'Inox 20 L', 'Botella 33 cl', 'Lata 33 cl', 'Lata 44 cl'];
  readonly todayKey = this.toDateInput(this.today);
  currentMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  monthDays: CalendarDay[] = [];
  brewDays: BrewDay[] = [];
  recipeList: Recipe[] = [];
  malts: Malt[] = [];
  hops: Hop[] = [];
  yeasts:Yeast[]=[];
  adjuncts:Adjunct[]=[];
  equipmentProfiles:EquipmentProfile[]=[];
  breweries:Brewery[]=[];
  persistedBrewDay=false;
  selectedDate = this.todayKey;
  status = '';
  calendarCollapsed = false;
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
    breweryId: [''],
    targetVolumeL: [20],
    actualVolumeL: [0],
    targetOg: [0],
    actualOg: [0],
    targetFg: [0],
    actualFg: [0],
    actualAbv: [0],
    mashPh: [5.3],
    spargePh: [5.6], waterCalcium:[0], waterMagnesium:[0], waterSodium:[0], waterSulfate:[0],
    waterChloride:[0], waterBicarbonate:[0], waterNotes:[''],
    notes: [''],
    malts: this.fb.array([]),
    hops: this.fb.array([]),
    yeasts:this.fb.array([]),
    additions: this.fb.array([]),
    events: this.fb.array([])
    ,tasks: this.fb.array([])
  });

  get maltRows(): FormArray {
    return this.form.controls.malts as FormArray;
  }

  get hopRows(): FormArray {
    return this.form.controls.hops as FormArray;
  }
  get yeastRows():FormArray{return this.form.controls.yeasts as FormArray;}

  get eventRows(): FormArray {
    return this.form.controls.events as FormArray;
  }
  get additionRows(): FormArray { return this.form.controls.additions as FormArray; }
  get taskRows(): FormArray { return this.form.controls.tasks as FormArray; }
  get fermentationTasks() {
    return this.taskRows.controls.filter(row => !['dry hop', 'envasado'].includes(row.get('type')?.value));
  }
  get dryHopTasks() { return this.taskRows.controls.filter(row => row.get('type')?.value === 'dry hop'); }
  get packagingTask() { return this.taskRows.controls.find(row => row.get('type')?.value === 'envasado'); }

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
      this.yeasts=catalog.yeasts;
      this.adjuncts=catalog.adjuncts;
      this.equipmentProfiles=catalog.equipmentProfiles;
      if(!this.persistedBrewDay){const recipe=this.recipeList.find(item=>item.id===this.form.controls.recipeId.value);if(recipe)this.loadRecipeSnapshot(recipe);}
    });

    this.api.getBreweries().pipe(take(1)).subscribe({
      next: breweries => this.breweries = breweries,
      error: () => this.breweries = [],
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
    this.persistedBrewDay=true;
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
      brewer: recipe?.brewer ?? '',
      breweryId: '',
      targetVolumeL: recipe?.batchVolumeL ?? 20,
      actualVolumeL: 0,
      targetOg: 0,
      actualOg: 0,
      targetFg: 0,
      actualFg: 0,
      actualAbv: 0,
      mashPh: recipe?.waterTreatment?.mashPh ?? 5.3,
      spargePh: recipe?.waterTreatment?.spargePh ?? 5.6,
      waterCalcium:recipe?.waterTreatment?.calcium ?? 0, waterMagnesium:recipe?.waterTreatment?.magnesium ?? 0,
      waterSodium:recipe?.waterTreatment?.sodium ?? 0, waterSulfate:recipe?.waterTreatment?.sulfate ?? 0,
      waterChloride:recipe?.waterTreatment?.chloride ?? 0, waterBicarbonate:recipe?.waterTreatment?.bicarbonate ?? 0,
      waterNotes:recipe?.waterTreatment?.notes ?? '',
      notes: ''
    });
    this.status = '';
    this.persistedBrewDay=false;
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
    this.hopRows.push(this.hopGroup('',0,0,0,0,100,100,'hervido','',''));
  }
  addYeast():void{this.yeastRows.push(this.yeastGroup('',0,0,'g','',20,''));}

  addEvent(): void {
    this.eventRows.push(this.eventGroup('', 'medición', '', '', ''));
  }
  addAddition(): void { this.additionRows.push(this.additionGroup('', '', 0, 0, '', 0, 0, 0, '', '')); }
  addTask(type: BrewDayTask['type']='tarea', offsetDays=3): void {
    const base=this.form.controls.brewDate.value || this.selectedDate;
    const date=new Date(`${base}T12:00:00`); date.setDate(date.getDate()+offsetDays);
    const titles:Record<BrewDayTask['type'],string>={'dry hop':'Añadir dry hop','adjunto':'Añadir adjunto','cold crash':'Iniciar cold crash','trasiego':'Realizar trasiego','envasado':'Enlatar / embotellar','tarea':'Nueva tarea'};
    const times:Record<BrewDayTask['type'],string>={'dry hop':'10:00','adjunto':'10:00','cold crash':'09:00','trasiego':'09:00','envasado':'08:00','tarea':'09:00'};
    this.taskRows.push(this.taskGroup(this.toDateInput(date),times[type],type,titles[type],'pendiente',''));
  }

  removeMalt(index: number): void {
    this.maltRows.removeAt(index);
  }

  removeHop(index: number): void {
    this.hopRows.removeAt(index);
  }
  removeYeast(index:number):void{this.yeastRows.removeAt(index);}

  removeEvent(index: number): void {
    this.eventRows.removeAt(index);
  }
  removeAddition(index:number):void { this.additionRows.removeAt(index); }
  removeTask(index:number):void { this.taskRows.removeAt(index); }

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
      this.persistedBrewDay=true;
      this.notifications.success(`Elaboración “${saved.batchNumber}” guardada.`);
      this.loadMonth();
    },()=>this.notifications.error('No se pudo guardar la elaboración.'));
  }

  deleteBrewDay():void{const id=this.form.controls.id.value,batch=this.form.controls.batchNumber.value;if(!this.persistedBrewDay||!id||!window.confirm(`¿Eliminar definitivamente la elaboración ${batch}? También se borrarán su registro y tareas posteriores.`))return;this.api.deleteBrewDay(id).pipe(take(1)).subscribe({next:()=>{this.notifications.success(`Elaboración “${batch}” eliminada.`);this.createNew(this.selectedDate);this.loadMonth();},error:()=>this.notifications.error('No se pudo eliminar la elaboración.')});}

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

  get selectedBrewery(): Brewery | undefined {
    return this.breweries.find(item => item.id === this.form.controls.breweryId.value);
  }

  printField(value: unknown, suffix = ''): string {
    if (value === null || value === undefined || value === '' || value === '—' || value === '-' || value === 0 || value === '0') return '';
    return `${value}${suffix}`;
  }

  printAttenuation(): string {
    const og = Number(this.form.controls.actualOg.value || this.form.controls.targetOg.value);
    const fg = Number(this.form.controls.actualFg.value || this.form.controls.targetFg.value);
    if (og <= 1 || fg <= 0 || fg >= og) return '';
    return `${(((og - fg) / (og - 1)) * 100).toFixed(1)} %`;
  }

  printColdAdditionIngredient(title: unknown, notes: unknown): string {
    const taskTitle = String(title ?? '').trim();
    const taskNotes = String(notes ?? '').trim();
    if (this.isGenericColdAdditionTitle(taskTitle) && this.looksLikeIngredientName(taskNotes)) return taskNotes;
    return taskTitle.replace(/^añadir\s+/i, '').trim();
  }

  printColdAdditionNotes(title: unknown, notes: unknown): string {
    const taskTitle = String(title ?? '').trim();
    const taskNotes = String(notes ?? '').trim();
    return this.isGenericColdAdditionTitle(taskTitle) && this.looksLikeIngredientName(taskNotes) ? taskTitle : taskNotes;
  }

  private isGenericColdAdditionTitle(title: string): boolean {
    return /^añadir(?:\s+dry\s*hop)?$/i.test(title);
  }

  private looksLikeIngredientName(notes: string): boolean {
    return notes.length > 0 && notes.length <= 80 && !/[·;:°]/.test(notes) && !/^\d/.test(notes);
  }

  private loadMonth(): void {
    const month = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      1
    );
    const loadId = ++this.monthLoadId;
    const from = this.calendarStartDate(month);
    const to = new Date(from);
    to.setDate(from.getDate() + 41);

    // Renderiza inmediatamente la cuadrícula correcta. De este modo:
    // 1. La primera entrada nunca muestra un calendario vacío.
    // 2. Al cambiar de mes no se conserva temporalmente la cuadrícula anterior.
    this.brewDays = [];
    this.monthDays = this.buildCalendar(month, []);

    this.api
      .getBrewDays(this.toDateInput(from), this.toDateInput(to))
      .pipe(take(1))
      .subscribe({
        next: (brewDays) => {
          // Ignora respuestas antiguas si el usuario ha cambiado de mes
          // antes de que terminase la petición anterior.
          if (loadId !== this.monthLoadId) {
            return;
          }

          this.brewDays = brewDays;
          this.monthDays = this.buildCalendar(month, brewDays);
          this.cdr.detectChanges();
        },
        error: (error) => {
          if (loadId !== this.monthLoadId) {
            return;
          }

          console.error('No se pudieron cargar las elaboraciones del mes', error);
          this.brewDays = [];
          this.monthDays = this.buildCalendar(month, []);
          this.status = 'No se pudieron cargar las elaboraciones del calendario.';
          this.cdr.detectChanges();
        }
      });
  }

  private buildCalendar(month: Date, brewDays: BrewDay[]): CalendarDay[] {
    const start = this.calendarStartDate(month);
      const brewDaysByDate = new Map<string, BrewDay[]>();
    const tasksByDate = new Map<string, {task:BrewDayTask;brewDay:BrewDay}[]>();
    brewDays.forEach((brewDay) => {
      const items = brewDaysByDate.get(brewDay.brewDate) ?? [];
      items.push(brewDay);
      brewDaysByDate.set(brewDay.brewDate, items);
      (brewDay.tasks ?? []).filter(task=>task.status!=='cancelada').forEach(task=>{
        const tasks=tasksByDate.get(task.taskDate) ?? []; tasks.push({task,brewDay}); tasksByDate.set(task.taskDate,tasks);
      });
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
        ,tasks: tasksByDate.get(date) ?? []
      };
    });
  }

  private loadRecipeSnapshot(recipe?: Recipe): void {
    this.maltRows.clear();
    this.hopRows.clear();
    this.yeastRows.clear();
    this.eventRows.clear();
    this.additionRows.clear();
    this.taskRows.clear();
    if (recipe?.waterTreatment) this.form.patchValue({mashPh:recipe.waterTreatment.mashPh,spargePh:recipe.waterTreatment.spargePh,waterCalcium:recipe.waterTreatment.calcium,waterMagnesium:recipe.waterTreatment.magnesium,waterSodium:recipe.waterTreatment.sodium,waterSulfate:recipe.waterTreatment.sulfate,waterChloride:recipe.waterTreatment.chloride,waterBicarbonate:recipe.waterTreatment.bicarbonate,waterNotes:recipe.waterTreatment.notes});
    if(recipe){const yeast=this.yeasts.find(item=>item.id===recipe.yeastId),equipment=this.equipmentProfiles.find(item=>item.id===recipe.equipmentProfileId),metrics=this.calculator.calculate(recipe,this.malts,yeast,equipment?.hopUtilizationPercent??100);this.form.patchValue({targetVolumeL:recipe.batchVolumeL,targetOg:metrics.og,targetFg:metrics.fg,brewer:recipe.brewer??this.form.controls.brewer.value});}

    const totalMalt = recipe?.malts.reduce((sum,item)=>sum+item.amountKg,0) ?? 0;
    recipe?.malts.forEach((item) => {
      const malt = this.malts.find((candidate) => candidate.id === item.maltId);
      this.maltRows.push(this.maltGroup(malt?.name ?? item.maltId, item.amountKg, item.amountKg, '', item.notes ?? '', totalMalt ? item.amountKg / totalMalt * 100 : 0,''));
    });

    recipe?.hops.forEach((item) => {
      if(item.use==='dry hop')return;
      if(item.type==='adjunto'){const adjunct=this.adjuncts.find(candidate=>candidate.id===item.adjunctId);this.additionRows.push(this.additionGroup(adjunct?.name??item.adjunctId??'Adjunto','',item.amountG,item.amountG,item.use,item.timeMin,item.timeMin,item.temperatureC??(item.use==='whirlpool'?80:100),'',item.notes??'',''));return;}
      const hop = this.hops.find((candidate) => candidate.id === item.hopId);
      const temperature=item.temperatureC??(item.use==='whirlpool'?80:100);
      this.hopRows.push(this.hopGroup(hop?.name ?? item.hopId,item.amountG,item.amountG,item.timeMin,item.timeMin,temperature,temperature,item.use,'',item.notes??'',''));
    });
    recipe?.yeasts?.forEach(item=>{const yeast=this.yeasts.find(candidate=>candidate.id===item.yeastId);this.yeastRows.push(this.yeastGroup(yeast?.name??item.yeastId,item.amount,item.amount,item.unit,'',item.pitchTempC,item.notes));});
    recipe?.processAdditions?.forEach((item)=>this.additionRows.push(this.additionGroup(item.name,item.brand,item.amountG,item.amountG,item.stage,item.timeMin??0,item.timeMin??0,item.temperatureC??0,item.dayLabel,item.notes,'')));
    recipe?.maturationAdditions?.forEach(item=>{const base=new Date(`${this.form.controls.brewDate.value||this.selectedDate}T12:00:00`);base.setDate(base.getDate()+item.addDay);const notes=[`${item.amount} ${item.unit}`,item.batch,item.contactDays?`${item.contactDays} días de contacto`:'',item.temperatureC?`${item.temperatureC} °C`:'',item.notes].filter(Boolean).join(' · ');this.taskRows.push(this.taskGroup(this.toDateInput(base),'10:00',item.type==='lúpulo'?'dry hop':'adjunto',`Añadir ${item.name}`,'pendiente',notes));});

    this.eventRows.push(this.eventGroup('09:00', 'macerado', 'Inicio de macerado', '', ''));
    this.eventRows.push(this.eventGroup('10:00', 'medición', 'pH macerado', '', 'pH'));
    this.eventRows.push(this.eventGroup('12:00', 'hervido', 'Inicio de hervido', '', ''));
    this.eventRows.push(this.eventGroup('15:00', 'fermentador', 'Trasiego a fermentador', '', 'L'));
  }

  private patchBrewDay(brewDay: BrewDay): void {
    this.maltRows.clear();
    this.hopRows.clear();
    this.yeastRows.clear();
    this.eventRows.clear();
    this.additionRows.clear();
    this.taskRows.clear();
    brewDay.malts.forEach((item) => this.maltRows.push(this.maltGroup(item.ingredientName, item.plannedAmountKg ?? 0, item.actualAmountKg ?? 0, item.substituteName, item.notes, item.plannedPercent ?? 0,item.lotNumber??'')));
    brewDay.hops.forEach((item) => {const temperature=item.use==='whirlpool'?80:100;this.hopRows.push(this.hopGroup(item.ingredientName,item.plannedAmountG??0,item.actualAmountG??0,item.plannedTimeMin??0,item.actualTimeMin??0,item.plannedTemperatureC??temperature,item.actualTemperatureC??item.plannedTemperatureC??temperature,item.use,item.substituteName,item.notes,item.lotNumber??''));});
    (brewDay.yeasts??[]).forEach(item=>this.yeastRows.push(this.yeastGroup(item.ingredientName,item.plannedAmount??0,item.actualAmount??0,item.unit,item.lotNumber??'',item.pitchTempC??0,item.notes)));
    brewDay.events.forEach((item) => this.eventRows.push(this.eventGroup(item.eventTime ?? '', item.type, item.description, item.value, item.unit)));
    (brewDay.additions ?? []).forEach((item)=>this.additionRows.push(this.additionGroup(item.ingredientName,item.brand,item.plannedAmountG??0,item.actualAmountG??0,item.stage,item.plannedTimeMin??0,item.actualTimeMin??0,item.temperatureC??0,item.dayLabel,item.notes,item.lotNumber??'')));
    (brewDay.tasks ?? []).forEach(item=>this.taskRows.push(this.taskGroup(item.taskDate,item.taskTime ?? '09:00',item.type,item.title,item.status,item.notes)));
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

  private maltGroup(ingredientName: string, plannedAmountKg: number, actualAmountKg: number, substituteName: string, notes: string, plannedPercent = 0,lotNumber='') {
    return this.fb.group({
      ingredientName: [ingredientName],
      plannedAmountKg: [plannedAmountKg],
      actualAmountKg: [actualAmountKg],
      substituteName: [substituteName],
      notes: [notes]
      ,plannedPercent:[plannedPercent]
      ,lotNumber:[lotNumber]
    });
  }

  private additionGroup(ingredientName:string,brand:string,plannedAmountG:number,actualAmountG:number,stage:string,plannedTimeMin:number,actualTimeMin:number,temperatureC:number,dayLabel:string,notes:string,lotNumber=''){
    return this.fb.group({ingredientName:[ingredientName],brand:[brand],plannedAmountG:[plannedAmountG],actualAmountG:[actualAmountG],stage:[stage],plannedTimeMin:[plannedTimeMin],actualTimeMin:[actualTimeMin],temperatureC:[temperatureC],dayLabel:[dayLabel],notes:[notes],lotNumber:[lotNumber]});
  }

  private taskGroup(taskDate:string,taskTime:string,type:BrewDayTask['type'],title:string,status:BrewDayTask['status'],notes:string){return this.fb.group({taskDate:[taskDate],taskTime:[taskTime],type:[type],title:[title],status:[status],notes:[notes]});}

  private hopGroup(ingredientName:string,plannedAmountG:number,actualAmountG:number,plannedTimeMin:number,actualTimeMin:number,plannedTemperatureC:number,actualTemperatureC:number,use:string,substituteName:string,notes:string,lotNumber='') {
    return this.fb.group({
      ingredientName: [ingredientName],
      plannedAmountG: [plannedAmountG],
      actualAmountG: [actualAmountG],
      plannedTimeMin: [plannedTimeMin],
      actualTimeMin: [actualTimeMin],
      plannedTemperatureC:[plannedTemperatureC],
      actualTemperatureC:[actualTemperatureC],
      use: [use],
      substituteName: [substituteName],
      notes: [notes]
      ,lotNumber:[lotNumber]
    });
  }

  private yeastGroup(ingredientName:string,plannedAmount:number,actualAmount:number,unit:string,lotNumber:string,pitchTempC:number,notes:string){return this.fb.group({ingredientName:[ingredientName],plannedAmount:[plannedAmount],actualAmount:[actualAmount],unit:[unit],lotNumber:[lotNumber],pitchTempC:[pitchTempC],notes:[notes]});}

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
