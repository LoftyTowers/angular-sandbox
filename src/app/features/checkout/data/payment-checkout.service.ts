import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
}

export interface CreatePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  clientSecret: string;
  paymentMethod: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
  };
}

export interface ConfirmPaymentResponse {
  status: 'succeeded' | 'declined';
  paymentIntentId: string;
  message: string;
}

export interface PaymentWebhookRequest {
  eventId: string;
  eventType: 'payment_intent.succeeded';
  paymentIntentId: string;
}

export interface PaymentWebhookResponse {
  bookingId: string;
  duplicateEvent: boolean;
  duplicateDeliverySimulated: boolean;
}

export interface BookingRecord {
  id: string;
  paymentIntentId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentCheckoutService {
  private readonly http = inject(HttpClient);

  createPaymentIntent(
    payload: CreatePaymentIntentRequest,
  ): Observable<CreatePaymentIntentResponse> {
    return this.http.post<CreatePaymentIntentResponse>('/payments/intent', payload);
  }

  confirmPayment(payload: ConfirmPaymentRequest): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>('/payments/confirm', payload);
  }

  deliverWebhook(payload: PaymentWebhookRequest): Observable<PaymentWebhookResponse> {
    return this.http.post<PaymentWebhookResponse>('/payments/webhook', payload);
  }

  getBookingById(bookingId: string): Observable<BookingRecord> {
    return this.http.get<BookingRecord>(`/bookings/${encodeURIComponent(bookingId)}`);
  }

  getBookings(): Observable<readonly BookingRecord[]> {
    return this.http.get<readonly BookingRecord[]>('/bookings');
  }
}
