import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  ENABLE_GET_RETRY,
  INLINE_ERROR_HANDLING,
} from '../../../core/error-handling/http-error-context';

interface PromoCodeResponse {
  valid: boolean;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly http = inject(HttpClient);
  private readonly validationContext = new HttpContext()
    .set(INLINE_ERROR_HANDLING, true)
    .set(ENABLE_GET_RETRY, false);

  validatePromoCode(code: string): Observable<boolean> {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      return of(true);
    }

    return of(normalizedCode).pipe(
      switchMap((promoCode) =>
        this.http.get<PromoCodeResponse>(`/promo/${encodeURIComponent(promoCode)}`, {
          context: this.validationContext,
        }),
      ),
      map((response) => response.valid),
    );
  }
}
