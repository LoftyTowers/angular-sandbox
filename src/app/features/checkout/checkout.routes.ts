import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    canDeactivate: [unsavedChangesGuard],
    data: { animation: 'Checkout' },
    loadComponent: () => import('./checkout-page.component').then((m) => m.CheckoutPageComponent),
  },
];
