import { Routes } from '@angular/router';
import { workshopDetailsResolver } from '../../core/resolvers/workshop-details.resolver';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    data: { animation: 'CatalogList' },
    loadComponent: () =>
      import('./containers/catalog-page.component').then((m) => m.CatalogPageComponent),
  },
  {
    path: ':workshopId',
    resolve: {
      workshop: workshopDetailsResolver,
    },
    data: { animation: 'CatalogDetail' },
    loadComponent: () =>
      import('./containers/workshop-detail-page.component').then(
        (m) => m.WorkshopDetailPageComponent,
      ),
  },
];
