import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AccountProfile } from './account-profile';

describe('AccountProfile', () => {
  let auth: {
    user: WritableSignal<{ displayName: string; avatarValue: string } | null>;
    updateProfile: ReturnType<typeof vi.fn>;
    uploadAvatar: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
  };
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = {
      user: signal<{ displayName: string; avatarValue: string } | null>({ displayName: 'Brewer', avatarValue: 'hop-pirate' }),
      updateProfile: vi.fn(() => of({})), uploadAvatar: vi.fn(() => of({})), changePassword: vi.fn(() => of(void 0))
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({ imports: [AccountProfile], providers: [
      { provide: AuthService, useValue: auth }, { provide: NotificationService, useValue: notifications }
    ] }).overrideComponent(AccountProfile, { set: { template: '' } });
  });

  it('saves profile choices and uploads a selected image', () => {
    const component = TestBed.createComponent(AccountProfile).componentInstance;
    expect(component.avatars).toHaveLength(15);
    component.profile.patchValue({ displayName: 'New Brewer', avatarValue: 'brew-wizard' });
    component.save();
    expect(auth['updateProfile']).toHaveBeenCalledWith('New Brewer', 'gallery', 'brew-wizard');
    expect(notifications.success).toHaveBeenCalled();

    const input = document.createElement('input');
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    component.upload({ target: input } as unknown as Event);
    expect(auth['uploadAvatar']).toHaveBeenCalledWith(file);
  });

  it('validates forms and reports backend failures', () => {
    const component = TestBed.createComponent(AccountProfile).componentInstance;
    component.profile.controls.displayName.setValue(''); component.save();
    expect(auth['updateProfile']).not.toHaveBeenCalled();
    auth['updateProfile'].mockReturnValue(throwError(() => new Error('failed')));
    component.profile.controls.displayName.setValue('Brewer'); component.save();
    expect(notifications.error).toHaveBeenCalled();

    component.changePassword();
    expect(auth['changePassword']).not.toHaveBeenCalled();
    auth['changePassword'].mockReturnValue(throwError(() => new Error('failed')));
    component.password.patchValue({ currentPassword: 'password123', newPassword: 'different123' });
    component.changePassword();
    expect(notifications.error).toHaveBeenCalledTimes(2);
  });
});
