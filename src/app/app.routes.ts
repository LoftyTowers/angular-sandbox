import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { authMatchGuard } from './core/guards/auth-match.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ShellLayoutComponent } from './features/shell/shell-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'catalog',
      },
      {
        path: 'catalog',
        loadChildren: () =>
          import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
      },
      {
        path: 'basket',
        loadChildren: () => import('./features/basket/basket.routes').then((m) => m.BASKET_ROUTES),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES),
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES),
      },
      {
        path: 'admin',
        canMatch: [authMatchGuard],
        canActivate: [authGuard, adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'catalog',
  },
];
