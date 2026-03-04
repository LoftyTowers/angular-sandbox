import { CanDeactivateFn } from '@angular/router';
import { CheckoutPageComponent } from '../../features/checkout/checkout-page.component';

export const unsavedChangesGuard: CanDeactivateFn<CheckoutPageComponent> = (component) => {
  if (!component.hasPendingChanges()) {
    return true;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  return window.confirm('You have unsaved checkout details. Leave this page?');
};
