import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }

  const router = inject(Router);
  return router.createUrlTree(['/account/login'], {
    queryParams: { returnUrl: state.url },
  });
};
