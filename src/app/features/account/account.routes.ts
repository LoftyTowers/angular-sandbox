import { Routes } from '@angular/router';
import { accountChildGuard } from '../../core/guards/account-child.guard';
import { authGuard } from '../../core/guards/auth.guard';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [accountChildGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
      {
        path: 'login',
        data: { animation: 'AccountLogin' },
        loadComponent: () => import('./login-page.component').then((m) => m.LoginPageComponent),
      },
      {
        path: 'bookings',
        canActivate: [authGuard],
        data: { requiresAuth: true, animation: 'AccountBookings' },
        loadComponent: () =>
          import('./bookings-page.component').then((m) => m.BookingsPageComponent),
      },
      {
        path: 'bookings/:bookingId/confirmation',
        data: { animation: 'AccountBookingConfirmation' },
        loadComponent: () =>
          import('./booking-confirmation-page.component').then(
            (m) => m.BookingConfirmationPageComponent,
          ),
      },
    ],
  },
];
