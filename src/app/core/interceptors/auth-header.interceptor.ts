import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authHeaderInterceptor: HttpInterceptorFn = (request, next) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/api/') || pathname.startsWith('/api/auth/')) {
    return next(request);
  }

  const session = inject(AuthService).authState();
  if (!session?.token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${session.token}`,
      },
    }),
  );
};
