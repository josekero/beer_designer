import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminGuard, authGuard, guestGuard } from './auth.guard';
import { AuthService } from './services/auth.service';

describe('authentication guards', () => {
  const user = { id: 'u1', role: 'USER' } as never;
  const admin = { id: 'a1', role: 'ADMIN' } as never;
  let current: unknown;
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    current = null;
    router = { createUrlTree: vi.fn((commands) => ({ commands })) };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { load: () => of(current) } },
      { provide: Router, useValue: router }
    ] });
  });

  it('protects private routes and preserves the destination', async () => {
    const denied = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/recipes' } as never));
    expect(await firstValueFrom(denied as never)).toEqual({ commands: ['/login'] });
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/recipes' } });
    current = user;
    expect(await firstValueFrom(TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/' } as never)) as never)).toBe(true);
  });

  it('allows an authenticated account to navigate while recommending a password change', async () => {
    current = { id: 'u1', role: 'USER', passwordChangeRequired: true };
    expect(await firstValueFrom(TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/recipes' } as never)) as never)).toBe(true);
  });

  it('restricts administration to administrators', async () => {
    current = user;
    expect(await firstValueFrom(TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never)) as never))
      .toEqual({ commands: ['/'] });
    current = admin;
    expect(await firstValueFrom(TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never)) as never)).toBe(true);
  });

  it('keeps guests on access pages and redirects active sessions', async () => {
    expect(await firstValueFrom(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as never)).toBe(true);
    current = user;
    expect(await firstValueFrom(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as never))
      .toEqual({ commands: ['/'] });
  });
});
