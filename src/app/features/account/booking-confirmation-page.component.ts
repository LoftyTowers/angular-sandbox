import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { BookingRecord, PaymentCheckoutService } from '../checkout/data/payment-checkout.service';

@Component({
  selector: 'app-booking-confirmation-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent],
  templateUrl: './booking-confirmation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentCheckoutService = inject(PaymentCheckoutService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly booking = signal<BookingRecord | null>(null);

  constructor() {
    void this.loadBooking();
  }

  private async loadBooking(): Promise<void> {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) {
      this.errorMessage.set('Booking reference is missing.');
      this.loading.set(false);
      return;
    }

    try {
      const booking = await firstValueFrom(this.paymentCheckoutService.getBookingById(bookingId));
      this.booking.set(booking);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.errorMessage.set('Booking confirmation could not be found.');
      } else {
        this.errorMessage.set('Booking confirmation is unavailable right now.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
