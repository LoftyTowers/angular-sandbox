import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const accountChildGuard: CanActivateChildFn = (childRoute, state) => {
  if (!childRoute.data?.['requiresAuth']) {
    return true;
  }

  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }

  const router = inject(Router);
  return router.createUrlTree(['/account/login'], {
    queryParams: { returnUrl: state.url },
  });
};
