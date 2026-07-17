import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthPage } from './auth-page';

describe('AuthPage', () => {
  const user = { displayName: 'Brewer' } as never;
  let auth: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { login: vi.fn(), register: vi.fn() };
    notifications = { success: vi.fn(), error: vi.fn() };
    router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({ imports: [AuthPage], providers: [
      { provide: AuthService, useValue: auth }, { provide: NotificationService, useValue: notifications },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode: 'login' }, queryParamMap: { get: () => '/recipes' } } } }
    ] }).overrideComponent(AuthPage, { set: { template: '' } });
  });

  it('validates and completes login', () => {
    const component = TestBed.createComponent(AuthPage).componentInstance;
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
    component.form.patchValue({ email: 'brewer@example.com', password: 'password123' });
    auth.login.mockReturnValue(of(user));
    component.submit();
    expect(notifications.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
    expect(component.submitting()).toBe(false);
  });

  it('reports authentication failures', () => {
    const component = TestBed.createComponent(AuthPage).componentInstance;
    component.form.patchValue({ email: 'brewer@example.com', password: 'password123' });
    auth.login.mockReturnValue(throwError(() => ({ error: { detail: 'Denied' } })));
    component.submit();
    expect(notifications.error).toHaveBeenCalledWith('Denied');
  });
});
