import { CanDeactivateFn } from '@angular/router';

export interface HasPendingChanges {
  hasPendingChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => {
  if (!component.hasPendingChanges()) {
    return true;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  return window.confirm('You have unsaved checkout details. Leave this page?');
};
