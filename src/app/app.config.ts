import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideAppConfig } from './core/config/app-config.providers';
import { GlobalErrorHandler } from './core/error-handling/global-error-handler';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { authHeaderInterceptor } from './core/interceptors/auth-header.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([apiBaseUrlInterceptor, authHeaderInterceptor, mockApiInterceptor]),
    ),
    provideAppConfig(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
