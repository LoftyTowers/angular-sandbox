import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

export const adminGuard: CanActivateFn = () => {
  const config = inject(APP_CONFIG);
  return config.environmentName !== 'production';
};
