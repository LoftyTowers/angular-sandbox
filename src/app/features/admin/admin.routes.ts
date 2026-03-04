import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    data: { animation: 'Admin' },
    loadComponent: () => import('./admin-page.component').then((m) => m.AdminPageComponent),
  },
];
