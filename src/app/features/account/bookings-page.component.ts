import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

interface AccountBookingRecord {
  id: string;
  paymentIntentId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  createdAt: string;
}

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [PageTitleComponent, CurrencyPipe, DatePipe],
  templateUrl: './bookings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsPageComponent {
  private readonly http = inject(HttpClient);

  protected readonly bookings = toSignal(
    this.http
      .get<readonly AccountBookingRecord[]>('/account/bookings')
      .pipe(catchError(() => of([] as readonly AccountBookingRecord[]))),
    { initialValue: [] as readonly AccountBookingRecord[] },
  );
}
