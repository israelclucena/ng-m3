/**
 * @fileoverview PaymentService — Sprint 029
 *
 * Mock Stripe-compatible payment gateway service using Angular Signals.
 * Provides a real interface (matching Stripe's API shape) with mock data —
 * ready for real Stripe SDK swap without changing callers.
 *
 * Feature flag: PAYMENT_GATEWAY
 */
import { Injectable, signal, computed } from '@angular/core';
import { PaymentFormData, PaymentMethodType, BookingConfirmationData } from '../components/payment/payment.types';

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'cancelled';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  created: number;
  metadata: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  confirmation?: BookingConfirmationData;
}

export interface ProcessPaymentOptions {
  amount: number;
  currency: string;
  bookingRef: string;
  propertyTitle: string;
  propertyAddress: string;
  checkIn: string;
  landlordName: string;
  landlordPhone?: string;
  formData: PaymentFormData;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  /** Current payment processing status */
  readonly status = signal<PaymentStatus>('idle');

  /** Last payment result */
  readonly lastResult = signal<PaymentResult | null>(null);

  /** Whether the service is currently processing */
  readonly isProcessing = computed(() => this.status() === 'processing');

  /** Whether the last attempt succeeded */
  readonly isSuccess = computed(() => this.status() === 'success');

  /** Whether the last attempt failed */
  readonly isFailed = computed(() => this.status() === 'failed');

  /**
   * Create a mock PaymentIntent (mirrors Stripe's createPaymentIntent).
   * In production: replace with real Stripe SDK call.
   */
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>): PaymentIntent {
    return {
      id: 'pi_mock_' + Math.random().toString(36).slice(2, 18),
      amount,
      currency,
      status: 'requires_payment_method',
      clientSecret: 'pi_mock_secret_' + Math.random().toString(36).slice(2, 18),
      created: Date.now(),
      metadata,
    };
  }

  /**
   * Process a payment for a booking.
   * Mock implementation: simulates network delay + success/failure.
   * Success rate: 90% (10% simulated decline for realistic testing).
   *
   * @param options Payment processing options
   * @returns Promise resolving to PaymentResult
   */
  async processPayment(options: ProcessPaymentOptions): Promise<PaymentResult> {
    this.status.set('processing');
    this.lastResult.set(null);

    // Simulate gateway latency (800–1200ms)
    await this._delay(800 + Math.random() * 400);

    // Simulate 10% decline rate (for testing error states)
    const declined = options.formData.cardNumber?.startsWith('4000') ?? false;
    const networkError = Math.random() < 0.02; // 2% network error

    if (networkError) {
      const result: PaymentResult = { success: false, error: 'Network error — please retry' };
      this.status.set('failed');
      this.lastResult.set(result);
      return result;
    }

    if (declined) {
      const result: PaymentResult = { success: false, error: 'Card declined — please use a different payment method' };
      this.status.set('failed');
      this.lastResult.set(result);
      return result;
    }

    const paymentIntentId = 'pi_' + Math.random().toString(36).slice(2, 18);

    const confirmation: BookingConfirmationData = {
      bookingRef: options.bookingRef,
      status: 'confirmed',
      propertyTitle: options.propertyTitle,
      propertyAddress: options.propertyAddress,
      checkIn: options.checkIn,
      landlordName: options.landlordName,
      landlordPhone: options.landlordPhone,
      total: options.amount / 100, // Stripe amounts are in cents
      currency: options.currency,
      message: 'Pagamento processado com sucesso. O senhorio foi notificado.',
    };

    const result: PaymentResult = { success: true, paymentIntentId, confirmation };
    this.status.set('success');
    this.lastResult.set(result);
    return result;
  }

  /**
   * Validate payment form data before submission.
   * Returns an array of validation errors (empty = valid).
   */
  validatePaymentForm(formData: PaymentFormData): string[] {
    const errors: string[] = [];

    if (!formData.termsAccepted) {
      errors.push('Deve aceitar os termos e condições');
    }

    if (formData.method === 'card') {
      if (!formData.cardHolder?.trim()) errors.push('Nome no cartão é obrigatório');
      if (!formData.cardNumber?.trim()) errors.push('Número do cartão é obrigatório');
      if (!formData.cardExpiry?.trim()) errors.push('Data de validade é obrigatória');
    }

    if (formData.method === 'mbway') {
      if (!formData.mbwayPhone?.trim()) errors.push('Número de telemóvel é obrigatório');
      if (formData.mbwayPhone && !/^9[1236]\d{7}$/.test(formData.mbwayPhone.replace(/\s/g, ''))) {
        errors.push('Número de telemóvel inválido (formato: 9X XXX XXXX)');
      }
    }

    return errors;
  }

  /**
   * Reset the service state back to idle.
   * Call before starting a new payment flow.
   */
  reset(): void {
    this.status.set('idle');
    this.lastResult.set(null);
  }

  /**
   * Get human-readable label for a payment method type.
   */
  getMethodLabel(method: PaymentMethodType): string {
    const labels: Record<PaymentMethodType, string> = {
      card: 'Cartão de Débito/Crédito',
      mbway: 'MB WAY',
      bank_transfer: 'Transferência Bancária',
      paypal: 'PayPal',
    };
    return labels[method] ?? method;
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
