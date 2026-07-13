import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileManager } from './profile-manager';

describe('ProfileManager', () => {
  const equipment = { id: 'eq-20', name: 'Equipo 20 L', batchVolumeL: 20 };
  const mash = { id: 'mash-1', name: 'Infusión', mashTempC: 66 };
  const carbonation = { id: 'carb-1', name: 'Botella', method: 'Botella' };
  const fermentation = { id: 'ferm-1', name: 'Ale', primaryDays: 10 };
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let manager: ProfileManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00Z'));
    api = {
      getEquipmentProfiles: vi.fn(() => of([equipment])),
      getMashProfiles: vi.fn(() => of([mash])),
      getCarbonationProfiles: vi.fn(() => of([carbonation])),
      getFermentationProfiles: vi.fn(() => of([fermentation])),
      saveEquipmentProfile: vi.fn((value) => of(value)),
      saveMashProfile: vi.fn((value) => of(value)),
      saveCarbonationProfile: vi.fn((value) => of(value)),
      saveFermentationProfile: vi.fn((value) => of(value)),
      deleteProfile: vi.fn(() => of(undefined)),
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ApiRepositoryService, useValue: api },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    manager = TestBed.runInInjectionContext(() => new ProfileManager());
  });

  it('carga los perfiles y selecciona inicialmente el equipo', () => {
    manager.ngOnInit();
    expect(manager.equipment).toEqual([equipment]);
    expect(manager.mash).toEqual([mash]);
    expect(manager.equipmentForm.controls.id.value).toBe('eq-20');
  });

  it('cambia entre formularios, crea y duplica perfiles', () => {
    manager.load();
    manager.changeType('mash');
    expect(manager.form()).toBe(manager.mashForm);
    expect(manager.items()).toEqual([mash]);
    manager.changeType('carbonation');
    expect(manager.form()).toBe(manager.carbonationForm);
    manager.changeType('fermentation');
    expect(manager.form()).toBe(manager.fermentationForm);

    manager.create();
    expect(manager.form().controls.id.value).toBe('profile-1783944000000');
    manager.form().controls.name.setValue('Personalizado');
    manager.duplicate();
    expect(manager.form().controls.name.value).toBe('Copia de Personalizado');
  });

  it('guarda los cuatro tipos y comunica éxito y error', () => {
    manager.load();
    for (const type of ['equipment', 'mash', 'carbonation', 'fermentation'] as const) {
      manager.changeType(type);
      manager.save();
    }
    expect(api['saveEquipmentProfile']).toHaveBeenCalledOnce();
    expect(api['saveMashProfile']).toHaveBeenCalledOnce();
    expect(api['saveCarbonationProfile']).toHaveBeenCalledOnce();
    expect(api['saveFermentationProfile']).toHaveBeenCalledOnce();
    expect(notifications.success).toHaveBeenCalledTimes(4);

    api['saveMashProfile'].mockReturnValueOnce(throwError(() => new Error('fallo')));
    manager.changeType('mash');
    manager.save();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo guardar el perfil.');
  });

  it('elimina perfiles y diferencia conflictos de otros errores', () => {
    manager.load();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    manager.remove();
    expect(api['deleteProfile']).toHaveBeenCalledWith('equipment', 'eq-20');
    expect(notifications.success).toHaveBeenCalledWith('Perfil eliminado.');

    manager.select('equipment', equipment);
    api['deleteProfile'].mockReturnValueOnce(throwError(() => ({ status: 409 })));
    manager.remove();
    expect(notifications.error).toHaveBeenCalledWith('El perfil está utilizado por una receta.');
    manager.select('equipment', equipment);
    api['deleteProfile'].mockReturnValueOnce(throwError(() => ({ status: 500 })));
    manager.remove();
    expect(notifications.error).toHaveBeenCalledWith('No se pudo eliminar el perfil.');
  });
});
