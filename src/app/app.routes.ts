import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog',
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./features/catalog/containers/catalog-page.component').then(
        (m) => m.CatalogPageComponent,
      ),
  },
  {
    path: 'basket',
    loadComponent: () =>
      import('./features/basket/basket-page.component').then((m) => m.BasketPageComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout-page.component').then((m) => m.CheckoutPageComponent),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./features/account/account-page.component').then((m) => m.AccountPageComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-page.component').then((m) => m.AdminPageComponent),
  },
  {
    path: '**',
    redirectTo: 'catalog',
  },
];
