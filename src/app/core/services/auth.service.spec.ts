import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApplicationUser } from '../../models/brewing.models';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const user: ApplicationUser = {
    id: 'user-1', email: 'brewer@example.com', displayName: 'Brewer', role: 'USER',
    avatarKind: 'gallery', avatarValue: 'hop-pirate', passwordChangeRequired: false,
    createdAt: '2026-07-17T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the current session once and handles an anonymous browser', () => {
    service.load().subscribe(value => expect(value).toEqual(user));
    service.load().subscribe();
    http.expectOne('/api/auth/me').flush(user);
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    expect(service.user()).toEqual(user);
    expect(service.ready()).toBe(true);

    const anonymous = TestBed.runInInjectionContext(() => new AuthService());
    anonymous.load().subscribe(value => expect(value).toBeNull());
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(anonymous.ready()).toBe(true);
  });

  it('supports registration, login, profile, password and logout', () => {
    service.register(user.email, 'password123', user.displayName).subscribe();
    const register = http.expectOne('/api/auth/register');
    expect(register.request.body).toEqual({ email: user.email, password: 'password123', displayName: user.displayName });
    register.flush(user);
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });

    service.login(user.email, 'password123').subscribe();
    http.expectOne('/api/auth/login').flush(user);
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    service.updateProfile('New Brewer', 'gallery', 'brew-wizard').subscribe();
    http.expectOne('/api/auth/profile').flush({ ...user, displayName: 'New Brewer', avatarValue: 'brew-wizard' });
    service.changePassword('password123', 'different123').subscribe();
    http.expectOne('/api/auth/password').flush(null);
    service.logout().subscribe();
    http.expectOne('/api/auth/logout').flush(null);
    expect(service.user()).toBeNull();
  });

  it('loads gallery choices and uploads a custom avatar', () => {
    service.avatars().subscribe(value => expect(value).toEqual(['hop-pirate', 'brew-wizard']));
    http.expectOne('/api/auth/avatars').flush(['hop-pirate', 'brew-wizard']);
    service.uploadAvatar(new File(['image'], 'avatar.png', { type: 'image/png' })).subscribe();
    const upload = http.expectOne('/api/auth/avatar');
    expect(upload.request.body).toBeInstanceOf(FormData);
    upload.flush({ ...user, avatarKind: 'upload', avatarValue: 'avatar.png' });
    expect(service.user()?.avatarKind).toBe('upload');
  });
});
