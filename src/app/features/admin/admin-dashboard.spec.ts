import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminDashboard } from './admin-dashboard';

describe('AdminDashboard', () => {
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let notifications: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  const summary = { users: 2, recipes: 5, ingredients: 120, brewDays: 1, activeUsers: 1 };
  const user = { id: 'u1', role: 'USER', enabled: true } as never;
  const recipe = { id: 'r1', name: 'Community IPA', publicRecipe: false, template: false } as never;

  beforeEach(() => {
    api = {
      getAdminSummary: vi.fn(() => of(summary)),
      getAdminUsers: vi.fn(() => of([user])),
      getAdminRecipes: vi.fn(() => of([recipe])),
      setUserAccess: vi.fn(),
      setAdminRecipeSharing: vi.fn(),
    };
    notifications = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({ imports: [AdminDashboard], providers: [
      { provide: ApiRepositoryService, useValue: api }, { provide: NotificationService, useValue: notifications }
    ] }).overrideComponent(AdminDashboard, { set: { template: '' } });
  });

  it('loads metrics and refreshes after an access change', () => {
    const component = TestBed.createComponent(AdminDashboard).componentInstance;
    component.ngOnInit();
    expect(component.summary()).toEqual(summary); expect(component.users()).toEqual([user]);
    expect(component.recipes()).toEqual([recipe]);
    api['setUserAccess'].mockReturnValue(of(void 0));
    component.update(user);
    expect(notifications.success).toHaveBeenCalled();
    expect(api['getAdminSummary']).toHaveBeenCalledTimes(2);
  });

  it('publishes recipes and official baselines', () => {
    api['setAdminRecipeSharing'].mockReturnValue(of(void 0));
    const component = TestBed.createComponent(AdminDashboard).componentInstance;
    component.sharing(recipe, true, true);
    expect(api['setAdminRecipeSharing']).toHaveBeenCalledWith('r1', true, true);
    expect(notifications.success).toHaveBeenCalled();
  });

  it('reports loading and update errors', () => {
    api['getAdminSummary'].mockReturnValue(throwError(() => new Error('failed')));
    const component = TestBed.createComponent(AdminDashboard).componentInstance;
    component.ngOnInit();
    expect(component.loading()).toBe(false); expect(notifications.error).toHaveBeenCalled();
    api['setUserAccess'].mockReturnValue(throwError(() => new Error('failed')));
    component.update(user);
    expect(notifications.error).toHaveBeenCalledTimes(2);
    api['setAdminRecipeSharing'].mockReturnValue(throwError(() => new Error('failed')));
    component.sharing(recipe, true, false);
    expect(notifications.error).toHaveBeenCalledTimes(3);
  });
});
