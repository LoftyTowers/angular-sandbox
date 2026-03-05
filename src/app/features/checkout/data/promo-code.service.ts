import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface PromoCodeResponse {
  valid: boolean;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly http = inject(HttpClient);

  validatePromoCode(code: string): Observable<boolean> {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      return of(true);
    }

    return of(normalizedCode).pipe(
      switchMap((promoCode) =>
        this.http.get<PromoCodeResponse>(`/promo/${encodeURIComponent(promoCode)}`),
      ),
      map((response) => response.valid),
    );
  }
}
