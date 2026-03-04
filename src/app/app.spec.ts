import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { App } from './app';
import { routes } from './app.routes';
import { provideAppConfig } from './core/config/app-config.providers';

describe('App', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideNoopAnimations(), provideAppConfig()],
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
