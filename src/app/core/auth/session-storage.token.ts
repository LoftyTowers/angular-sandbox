import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

export const SESSION_STORAGE = new InjectionToken<Storage | null>('SESSION_STORAGE', {
  factory: () => inject(DOCUMENT).defaultView?.sessionStorage ?? null,
});
