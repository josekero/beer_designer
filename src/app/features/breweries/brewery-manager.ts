import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { Brewery } from '../../models/brewing.models';

@Component({
  selector: 'app-brewery-manager',
  imports: [ReactiveFormsModule],
  templateUrl: './brewery-manager.html',
  styleUrl: './brewery-manager.scss',
})
export class BreweryManager implements OnInit {
  private readonly api = inject(ApiRepositoryService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  breweries: Brewery[] = [];
  selected?: Brewery;
  persisted = false;
  uploading = false;
  uploadProgress = 0;
  readonly form = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[a-z0-9][a-z0-9-]{0,79}$/)]],
    name: ['', Validators.required],
    untappdUrl: [''],
  });

  ngOnInit(): void { this.load(); }

  create(): void {
    this.selected = undefined;
    this.persisted = false;
    this.uploadProgress = 0;
    this.form.reset({ id: '', name: '', untappdUrl: '' });
  }

  select(brewery: Brewery): void {
    this.selected = brewery;
    this.persisted = true;
    this.form.reset({ id: brewery.id, name: brewery.name, untappdUrl: brewery.untappdUrl ?? '' });
  }

  suggestId(): void {
    if (this.persisted) return;
    const id = (this.form.controls.name.value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    this.form.controls.id.setValue(id);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const brewery = { ...this.form.getRawValue() } as Brewery;
    this.api.saveBrewery(brewery).pipe(take(1)).subscribe({
      next: saved => { this.notifications.success(`Brewery “${saved.name}” guardada.`); this.persisted = true; this.selected = saved; this.load(saved.id); },
      error: () => this.notifications.error('No se pudo guardar la brewery.'),
    });
  }

  remove(): void {
    const brewery = this.selected;
    if (!brewery || !window.confirm(`¿Eliminar la brewery ${brewery.name}? Las elaboraciones conservarán el resto de sus datos.`)) return;
    this.api.deleteBrewery(brewery.id).pipe(take(1)).subscribe({
      next: () => { this.notifications.success(`Brewery “${brewery.name}” eliminada.`); this.create(); this.load(); },
      error: () => this.notifications.error('No se pudo eliminar la brewery.'),
    });
  }

  uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.form.controls.id.value;
    if (!file || !id || !this.persisted) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 3 * 1024 * 1024) {
      this.notifications.error('Selecciona un JPG o PNG de hasta 3 MB.'); input.value = ''; return;
    }
    this.uploading = true;
    this.uploadProgress = 0;
    this.api.uploadBreweryLogo(id, file).subscribe({
      next: upload => {
        if (upload.type === HttpEventType.UploadProgress) this.uploadProgress = upload.total ? Math.round(upload.loaded * 100 / upload.total) : 0;
        if (upload.type === HttpEventType.Response && upload.body) {
          this.uploading = false;
          this.selected = { ...upload.body, logoUrl: `${upload.body.logoUrl}?v=${Date.now()}` };
          this.notifications.success('Logo guardado correctamente.');
          this.load(id);
        }
      },
      error: () => { this.uploading = false; this.notifications.error('No se pudo subir el logo.'); },
    });
    input.value = '';
  }

  private load(selectedId?: string): void {
    this.api.getBreweries().pipe(take(1)).subscribe({
      next: breweries => {
        this.breweries = breweries;
        const targetId = selectedId ?? this.selected?.id ?? breweries[0]?.id;
        const selected = breweries.find(item => item.id === targetId);
        if (selected) this.select(selected);
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifications.error('No se pudo cargar el catálogo de breweries.');
        this.cdr.detectChanges();
      },
    });
  }
}
