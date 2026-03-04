import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authMatchGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }

  const returnUrl = `/${segments.map((segment) => segment.path).join('/')}`;
  const router = inject(Router);
  return router.createUrlTree(['/account/login'], {
    queryParams: { returnUrl },
  });
};
