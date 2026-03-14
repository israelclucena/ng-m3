/**
 * payment.types.ts — Shared types for the Payment/Checkout flow.
 * Feature flag: PAYMENT_MODULE
 */

// ─── Payment Method ───────────────────────────────────────────────────────────

/** Supported payment method types */
export type PaymentMethodType = 'card' | 'mbway' | 'bank_transfer' | 'paypal';

/** A payment method option displayed in the checkout */
export interface PaymentMethod {
  id: PaymentMethodType;
  label: string;
  icon: string;
  description: string;
}

// ─── Booking Summary ─────────────────────────────────────────────────────────

/** Line item for the payment summary breakdown */
export interface PaymentLineItem {
  label: string;
  amount: number;
  type: 'charge' | 'discount' | 'fee' | 'deposit';
}

/** Full booking payment summary */
export interface BookingPaymentSummary {
  propertyTitle: string;
  propertyAddress: string;
  propertyImage?: string;
  checkIn: string;    // ISO date
  checkOut?: string;  // ISO date (optional for long-term)
  months?: number;
  lineItems: PaymentLineItem[];
  total: number;
  currency: string;
  depositAmount: number;
}

// ─── Payment Form ─────────────────────────────────────────────────────────────

/** Data collected during checkout */
export interface PaymentFormData {
  method: PaymentMethodType;
  /** Card fields — only if method === 'card' */
  cardHolder?: string;
  cardNumber?: string;  // masked display only
  cardExpiry?: string;
  /** MBWay — only if method === 'mbway' */
  mbwayPhone?: string;
  /** Agreed to terms */
  termsAccepted: boolean;
}

/** Event emitted when checkout is submitted */
export interface PaymentSubmitEvent {
  summary: BookingPaymentSummary;
  form: PaymentFormData;
  timestamp: string;
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

/** Status of a booking confirmation */
export type BookingStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

/** Booking confirmation data shown on the confirmation screen */
export interface BookingConfirmationData {
  bookingRef: string;
  status: BookingStatus;
  propertyTitle: string;
  propertyAddress: string;
  checkIn: string;
  landlordName: string;
  landlordPhone?: string;
  total: number;
  currency: string;
  message?: string;
}
