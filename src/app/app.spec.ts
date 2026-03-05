import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { App } from './app';
import { routes } from './app.routes';
import { APP_CONFIG } from './core/config/app-config.token';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

describe('App', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor, mockApiInterceptor])),
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
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render shell navigation labels', async () => {
    const fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/catalog');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Catalog');
    expect(compiled.textContent).toContain('Basket');
    expect(compiled.textContent).toContain('Login');
    expect(compiled.textContent).toContain('Admin');
  });
});
