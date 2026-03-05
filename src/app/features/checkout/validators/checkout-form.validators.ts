import {
  AbstractControl,
  AsyncValidatorFn,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { PromoCodeService } from '../data/promo-code.service';

export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com',
  'guerrillamail.com',
  'temp-mail.org',
  '10minutemail.com',
]);

const PROMO_VALIDATION_DEBOUNCE_MS = 250;

export function forbiddenWordsValidator(forbiddenWords: readonly string[]): ValidatorFn {
  const normalizedWords = forbiddenWords.map((word) => word.trim().toLowerCase()).filter(Boolean);
  if (normalizedWords.length === 0) {
    return () => null;
  }

  return (control: AbstractControl): ValidationErrors | null => {
    const value = normalizeString(control.value);
    if (!value) {
      return null;
    }

    const matchedWord = normalizedWords.find((word) => value.includes(word));
    return matchedWord ? { forbiddenWords: { matchedWord } } : null;
  };
}

export function promoDisposableEmailDomainValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const promoCode = normalizeString(control.get('promoCode')?.value);
    if (!promoCode) {
      return null;
    }

    const email = normalizeString(control.get('email')?.value);
    const domain = getEmailDomain(email);
    if (!domain) {
      return null;
    }

    return DISPOSABLE_EMAIL_DOMAINS.has(domain) ? { promoRequiresNonDisposableEmail: true } : null;
  };
}

export function promoCodeAsyncValidator(promoCodeService: PromoCodeService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const promoCode = normalizeString(control.value);
    if (!promoCode) {
      return of(null);
    }

    return timer(PROMO_VALIDATION_DEBOUNCE_MS).pipe(
      switchMap(() => promoCodeService.validatePromoCode(promoCode)),
      map((isValid) => (isValid ? null : { invalidPromoCode: true })),
      catchError(() => of({ promoCodeValidationUnavailable: true })),
      take(1),
    );
  };
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getEmailDomain(email: string): string | null {
  const segments = email.split('@');
  if (segments.length !== 2 || !segments[1]) {
    return null;
  }

  return segments[1].toLowerCase();
}
