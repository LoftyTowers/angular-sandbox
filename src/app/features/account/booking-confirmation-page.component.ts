import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DomainError, ResourceNotFoundError } from '../../core/error-handling/domain-errors';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { BookingRecord, PaymentCheckoutService } from '../checkout/data/payment-checkout.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-booking-confirmation-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent, DatePipe, CurrencyPipe],
  templateUrl: './booking-confirmation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentCheckoutService = inject(PaymentCheckoutService);
  private readonly seoService = inject(SeoService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly booking = signal<BookingRecord | null>(null);

  constructor() {
    this.seoService.setTitle('Booking Confirmation | Workshop Booking');
    this.seoService.setDescription('Your booking and payment confirmation details.');
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
      this.seoService.setTitle(`Booking ${booking.id} Confirmed | Workshop Booking`);
    } catch (error: unknown) {
      if (error instanceof ResourceNotFoundError) {
        this.errorMessage.set('Booking confirmation could not be found.');
      } else if (error instanceof DomainError) {
        this.errorMessage.set(error.userMessage);
      } else {
        this.errorMessage.set('Booking confirmation is unavailable right now.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
