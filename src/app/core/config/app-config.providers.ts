import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { APP_CONFIG, AppConfig } from './app-config.token';

const developmentConfig: AppConfig = {
  apiBaseUrl: environment.apiBaseUrl,
  environmentName: 'development',
  currency: environment.defaultCurrency,
  mockApi: environment.mockApi,
};

function createProductionConfig(): AppConfig {
  return {
    apiBaseUrl: environment.apiBaseUrl,
    environmentName: environment.production ? 'production' : 'development',
    currency: environment.defaultCurrency,
    mockApi: environment.mockApi,
  };
}

export function provideAppConfig(): Provider {
  if (environment.production) {
    return {
      provide: APP_CONFIG,
      useFactory: createProductionConfig,
    };
  }

  return {
    provide: APP_CONFIG,
    useValue: developmentConfig,
  };
}
