import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  private readonly currencyPipe = new CurrencyPipe('en-GB');

  transform(
    value: number | null | undefined,
    currencyCode = 'GBP',
    display: 'code' | 'symbol' | 'symbol-narrow' | string | boolean = 'symbol',
    digitsInfo = '1.0-0',
    locale = 'en-GB',
  ): string {
    return this.currencyPipe.transform(value ?? 0, currencyCode, display, digitsInfo, locale) ?? '';
  }
}
