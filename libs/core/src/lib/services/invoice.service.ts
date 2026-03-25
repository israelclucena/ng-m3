/**
 * @fileoverview InvoiceService — Sprint 030
 *
 * Generates invoice references and mock invoice/receipt data for completed payments.
 * Designed as a companion to PaymentService — call after processPayment() succeeds.
 *
 * Feature flag: PAYMENT_RECEIPT
 */
import { Injectable, signal, computed } from '@angular/core';
import type { BookingConfirmationData } from '../components/payment/payment.types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A line item on the invoice */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** Full invoice / receipt document */
export interface Invoice {
  /** Unique invoice reference (e.g. INV-2026-0001) */
  invoiceRef: string;
  /** ISO date the invoice was generated */
  issuedAt: string;
  /** Due date (same as issued for paid invoices) */
  dueDate: string;
  /** Status */
  status: 'paid' | 'pending' | 'cancelled';
  /** Payment intent id from PaymentService */
  paymentIntentId: string;
  /** Property details */
  propertyTitle: string;
  propertyAddress: string;
  /** Tenant / guest name */
  tenantName?: string;
  /** Landlord details */
  landlordName: string;
  /** Booking details */
  bookingRef: string;
  checkIn: string;
  checkOut?: string;
  /** Line items */
  lineItems: InvoiceLineItem[];
  /** Totals */
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  /** Optional PDF download URL (mock) */
  pdfUrl?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private _invoiceCounter = signal(1);
  private _invoices = signal<Invoice[]>([]);

  /** All generated invoices */
  readonly invoices = this._invoices.asReadonly();

  /** Count of paid invoices */
  readonly paidCount = computed(() => this._invoices().filter(i => i.status === 'paid').length);

  /** Total revenue from paid invoices */
  readonly totalRevenue = computed(() =>
    this._invoices()
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0)
  );

  /**
   * Generate a unique invoice reference in the format INV-YYYY-NNNN.
   */
  generateRef(): string {
    const year = new Date().getFullYear();
    const n = this._invoiceCounter();
    this._invoiceCounter.update(v => v + 1);
    return `INV-${year}-${String(n).padStart(4, '0')}`;
  }

  /**
   * Create an invoice from a booking confirmation.
   * Calculates standard line items: rent, cleaning fee, service fee, IVA.
   *
   * @param confirmation Confirmed booking data from PaymentService
   * @param paymentIntentId Stripe-style intent id
   * @param tenantName Optional tenant name
   * @returns Generated Invoice object (also stored internally)
   */
  createFromConfirmation(
    confirmation: BookingConfirmationData,
    paymentIntentId: string,
    tenantName?: string
  ): Invoice {
    const now = new Date();
    const issuedAt = now.toISOString();
    const total = confirmation.total;
    const currency = confirmation.currency ?? 'EUR';

    // Derive line items from total (reverse-engineer realistic breakdown)
    const serviceFeePct = 0.05; // 5% service fee
    const ivaRate = 0.06;       // IVA 6% (Portugal — reduced rate for housing)
    const cleaningFee = 40;     // Fixed cleaning fee

    const serviceFee = +(total * serviceFeePct).toFixed(2);
    const taxableAmount = +(total - serviceFee - cleaningFee).toFixed(2);
    const taxAmount = +(taxableAmount * ivaRate).toFixed(2);
    const subtotal = +(total - taxAmount).toFixed(2);

    const lineItems: InvoiceLineItem[] = [
      {
        description: `Arrendamento — ${confirmation.propertyTitle}`,
        quantity: 1,
        unitPrice: taxableAmount,
        total: taxableAmount,
      },
      {
        description: 'Taxa de limpeza',
        quantity: 1,
        unitPrice: cleaningFee,
        total: cleaningFee,
      },
      {
        description: 'Taxa de serviço (5%)',
        quantity: 1,
        unitPrice: serviceFee,
        total: serviceFee,
      },
    ];

    const invoice: Invoice = {
      invoiceRef: this.generateRef(),
      issuedAt,
      dueDate: issuedAt,
      status: confirmation.status === 'confirmed' ? 'paid' : 'pending',
      paymentIntentId,
      propertyTitle: confirmation.propertyTitle,
      propertyAddress: confirmation.propertyAddress,
      tenantName,
      landlordName: confirmation.landlordName,
      bookingRef: confirmation.bookingRef,
      checkIn: confirmation.checkIn,
      lineItems,
      subtotal,
      taxRate: ivaRate,
      taxAmount,
      total,
      currency,
      pdfUrl: `https://api.lisboarent.pt/invoices/${paymentIntentId}.pdf`,
    };

    this._invoices.update(list => [invoice, ...list]);
    return invoice;
  }

  /**
   * Get an invoice by its reference number.
   */
  getByRef(ref: string): Invoice | undefined {
    return this._invoices().find(i => i.invoiceRef === ref);
  }

  /**
   * Format a currency amount for display.
   */
  formatAmount(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(amount);
  }
}
