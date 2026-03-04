import { Routes } from '@angular/router';

export const BASKET_ROUTES: Routes = [
  {
    path: '',
    data: { animation: 'Basket' },
    loadComponent: () => import('./basket-page.component').then((m) => m.BasketPageComponent),
  },
];
