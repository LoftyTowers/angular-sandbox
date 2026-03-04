import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG);

  if (/^https?:\/\//.test(request.url)) {
    return next(request);
  }

  const url = `${config.apiBaseUrl}${request.url}`;
  const updatedRequest = request.clone({
    url,
    setHeaders: {
      'X-Environment': config.environmentName,
    },
  });

  return next(updatedRequest);
};
