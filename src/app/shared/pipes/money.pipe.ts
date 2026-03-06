import { CurrencyPipe } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  private readonly localeId = inject(LOCALE_ID);
  private readonly currencyPipe = new CurrencyPipe(this.localeId);

  transform(
    value: number | null | undefined,
    currencyCode = 'GBP',
    display: 'code' | 'symbol' | 'symbol-narrow' | string | boolean = 'symbol',
    digitsInfo = '1.0-0',
    locale = this.localeId,
  ): string {
    return this.currencyPipe.transform(value ?? 0, currencyCode, display, digitsInfo, locale) ?? '';
  }
}
