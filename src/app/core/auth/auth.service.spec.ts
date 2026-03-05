import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { apiErrorInterceptor } from '../interceptors/api-error.interceptor';
import { AuthService } from './auth.service';
import { SESSION_STORAGE } from './session-storage.token';
import { apiBaseUrlInterceptor } from '../interceptors/api-base-url.interceptor';
import { authHeaderInterceptor } from '../interceptors/auth-header.interceptor';
import { mockApiInterceptor } from '../interceptors/mock-api.interceptor';

class StorageStub implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpClient;
  let storage: StorageStub;

  beforeEach(() => {
    storage = new StorageStub();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            apiErrorInterceptor,
            apiBaseUrlInterceptor,
            authHeaderInterceptor,
            mockApiInterceptor,
          ]),
        ),
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: '/api',
            environmentName: 'test',
            currency: 'GBP',
            mockApi: {
              enabled: true,
              minLatencyMs: 0,
              maxLatencyMs: 0,
              transientFailureRate: 0,
            },
          },
        },
        {
          provide: SESSION_STORAGE,
          useValue: storage,
        },
      ],
    });

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
  });

  it('logs in and stores a session token in memory and session storage', async () => {
    const session = await firstValueFrom(
      auth.login({ email: 'demo@workshops.test', password: 'password123' }),
    );

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentRole()).toBe('user');
    expect(storage.getItem('auth_token')).toBe(session.token);
  });

  it('grants admin role for admin user login', async () => {
    await firstValueFrom(auth.login({ email: 'admin@workshops.test', password: 'password123' }));

    expect(auth.hasRole('admin')).toBe(true);
  });

  it('attaches auth header to protected requests through interceptor', async () => {
    await firstValueFrom(auth.login({ email: 'demo@workshops.test', password: 'password123' }));

    const bookings = await firstValueFrom(http.get<readonly unknown[]>('/account/bookings'));

    expect(Array.isArray(bookings)).toBe(true);
  });

  it('rejects protected requests when unauthenticated', async () => {
    await expect(firstValueFrom(http.get('/account/bookings'))).rejects.toMatchObject({
      status: 401,
    });
  });

  it('logs out and clears session state', async () => {
    await firstValueFrom(auth.login({ email: 'demo@workshops.test', password: 'password123' }));
    await firstValueFrom(auth.logout());

    expect(auth.isAuthenticated()).toBe(false);
    expect(storage.getItem('auth_token')).toBeNull();
  });
});
