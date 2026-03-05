import { vi } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  const currentRoute = {} as ActivatedRouteSnapshot;
  const currentState = { url: '/checkout' } as RouterStateSnapshot;
  const nextState = { url: '/catalog' } as RouterStateSnapshot;

  it('allows navigation when there are no pending changes', () => {
    const result = unsavedChangesGuard(
      { hasPendingChanges: () => false },
      currentRoute,
      currentState,
      nextState,
    );

    expect(result).toBe(true);
  });

  it('prompts when there are pending changes', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const result = unsavedChangesGuard(
      { hasPendingChanges: () => true },
      currentRoute,
      currentState,
      nextState,
    );

    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved checkout details. Leave this page?');
    expect(result).toBe(false);
  });
});
