import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { Brewery } from '../../models/brewing.models';
import { BreweryManager } from './brewery-manager';

describe('BreweryManager', () => {
  const brewery: Brewery = { id: 'guaja', name: 'Guaja Brewery', untappdUrl: 'https://untappd.com/guaja', logoUrl: '/api/breweries/guaja/logo' };
  let manager: BreweryManager;
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      getBreweries: vi.fn(() => of([brewery])),
      saveBrewery: vi.fn((value: Brewery) => of(value)),
      deleteBrewery: vi.fn(() => of(undefined)),
      uploadBreweryLogo: vi.fn(() => of({ type: 4, body: brewery })),
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({ providers: [
      FormBuilder,
      { provide: ApiRepositoryService, useValue: api },
      { provide: NotificationService, useValue: notifications },
      { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } },
    ] });
    manager = TestBed.runInInjectionContext(() => new BreweryManager());
  });

  it('carga, selecciona y prepara nuevas breweries', () => {
    manager.ngOnInit();
    expect(manager.breweries).toEqual([brewery]);
    expect(manager.selected?.id).toBe('guaja');
    expect(manager.persisted).toBe(true);
    manager.select(brewery);
    expect(manager.form.getRawValue()).toMatchObject({ id: 'guaja', name: 'Guaja Brewery' });
    manager.create();
    expect(manager.persisted).toBe(false);
  });

  it('genera un identificador seguro y guarda la ficha', () => {
    manager.form.controls.name.setValue('Fábrica Ñ del Río');
    manager.suggestId();
    expect(manager.form.controls.id.value).toBe('fabrica-n-del-rio');
    manager.save();
    expect(api['saveBrewery']).toHaveBeenCalled();
    expect(notifications.success).toHaveBeenCalled();
  });

  it('valida y sube el logo de una brewery guardada', () => {
    manager.select(brewery);
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    manager.uploadLogo({ target: input } as unknown as Event);
    expect(api['uploadBreweryLogo']).toHaveBeenCalledWith('guaja', file);
    expect(manager.uploading).toBe(false);
    expect(notifications.success).toHaveBeenCalledWith('Logo guardado correctamente.');
  });

  it('elimina la brewery únicamente tras confirmación', () => {
    manager.select(brewery);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    manager.remove();
    expect(api['deleteBrewery']).toHaveBeenCalledWith('guaja');
    expect(notifications.success).toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('does not persist incomplete forms or delete without confirmation', () => {
    manager.create();
    manager.save();
    expect(manager.form.touched).toBe(true);
    expect(api['saveBrewery']).not.toHaveBeenCalled();

    manager.select(brewery);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    manager.remove();
    expect(api['deleteBrewery']).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('reports invalid logos and upload progress without losing the selected brewery', () => {
    manager.select(brewery);
    const invalid = new File(['logo'], 'logo.svg', { type: 'image/svg+xml' });
    const invalidInput = document.createElement('input');
    Object.defineProperty(invalidInput, 'files', { value: [invalid] });
    manager.uploadLogo({ target: invalidInput } as unknown as Event);
    expect(notifications.error).toHaveBeenCalledWith('Selecciona un JPG o PNG de hasta 3 MB.');

    const events = new Subject<unknown>();
    api['uploadBreweryLogo'].mockReturnValue(events);
    const valid = new File(['logo'], 'logo.jpg', { type: 'image/jpeg' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [valid] });
    manager.uploadLogo({ target: input } as unknown as Event);
    events.next({ type: 1, loaded: 25, total: 100 });
    expect(manager.uploadProgress).toBe(25);
    events.error(new Error('network'));
    expect(manager.uploading).toBe(false);
    expect(notifications.error).toHaveBeenCalledWith('No se pudo subir el logo.');
  });

  it('reports catalog, save and delete failures', () => {
    api['getBreweries'].mockReturnValueOnce(throwError(() => new Error('network')));
    manager.ngOnInit();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo cargar el catálogo de breweries.');

    manager.form.setValue({ id: 'guaja', name: 'Guaja', untappdUrl: '' });
    api['saveBrewery'].mockReturnValueOnce(throwError(() => new Error('save')));
    manager.save();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo guardar la brewery.');

    manager.select(brewery);
    api['deleteBrewery'].mockReturnValueOnce(throwError(() => new Error('delete')));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    manager.remove();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo eliminar la brewery.');
    confirm.mockRestore();
  });
});
