import { FormControl, FormGroup } from '@angular/forms';
import { firstValueFrom, from, of } from 'rxjs';
import { vi } from 'vitest';
import {
  forbiddenWordsValidator,
  promoCodeAsyncValidator,
  promoDisposableEmailDomainValidator,
} from './checkout-form.validators';
import { PromoCodeService } from '../data/promo-code.service';

describe('checkout form validators', () => {
  describe('forbiddenWordsValidator', () => {
    it('returns an error when value contains forbidden words', () => {
      const control = new FormControl('This is a dummy value');
      const validator = forbiddenWordsValidator(['dummy']);

      expect(validator(control)).toEqual({ forbiddenWords: { matchedWord: 'dummy' } });
    });

    it('returns null when value is allowed', () => {
      const control = new FormControl('Legitimate attendee');
      const validator = forbiddenWordsValidator(['dummy']);

      expect(validator(control)).toBeNull();
    });
  });

  describe('promoDisposableEmailDomainValidator', () => {
    it('returns a cross-field error for disposable email when promo exists', () => {
      const validator = promoDisposableEmailDomainValidator();
      const form = new FormGroup({
        email: new FormControl('person@mailinator.com'),
        promoCode: new FormControl('SAVE10'),
      });

      expect(validator(form)).toEqual({ promoRequiresNonDisposableEmail: true });
    });

    it('returns null when promo code is not set', () => {
      const validator = promoDisposableEmailDomainValidator();
      const form = new FormGroup({
        email: new FormControl('person@mailinator.com'),
        promoCode: new FormControl(''),
      });

      expect(validator(form)).toBeNull();
    });
  });

  describe('promoCodeAsyncValidator', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('marks promo code as invalid when service returns false', async () => {
      const promoCodeService = {
        validatePromoCode: vi.fn().mockReturnValue(of(false)),
      } as Pick<PromoCodeService, 'validatePromoCode'> as PromoCodeService;
      const control = new FormControl('UNKNOWN', { nonNullable: true });
      const validator = promoCodeAsyncValidator(promoCodeService);
      const validationResultPromise = firstValueFrom(from(validator(control)));

      await vi.advanceTimersByTimeAsync(250);

      expect(promoCodeService.validatePromoCode).toHaveBeenCalledWith('unknown');
      await expect(validationResultPromise).resolves.toEqual({ invalidPromoCode: true });
    });

    it('cancels in-flight validation and only validates latest value', async () => {
      const promoCodeService = {
        validatePromoCode: vi.fn().mockReturnValue(of(true)),
      } as Pick<PromoCodeService, 'validatePromoCode'> as PromoCodeService;
      const control = new FormControl('', {
        nonNullable: true,
        asyncValidators: [promoCodeAsyncValidator(promoCodeService as PromoCodeService)],
      });

      control.setValue('FIRST');
      control.setValue('SECOND');

      await vi.advanceTimersByTimeAsync(250);

      expect(promoCodeService.validatePromoCode).toHaveBeenCalledTimes(1);
      expect(promoCodeService.validatePromoCode).toHaveBeenCalledWith('second');
      expect(control.errors).toBeNull();
    });
  });
});
