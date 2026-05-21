import { TestBed } from '@angular/core/testing';
import { InvoiceService } from './invoice.service';
import type { BookingConfirmationData } from '../components/payment/payment.types';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceService);
  });

  const makeConfirmation = (
    overrides: Partial<BookingConfirmationData> = {}
  ): BookingConfirmationData => ({
    bookingRef: 'BK-2026-0001',
    status: 'confirmed',
    propertyTitle: 'T2 Bairro Alto',
    propertyAddress: 'Rua das Flores 42, Lisboa',
    checkIn: '2026-04-01',
    landlordName: 'Maria Senhoria',
    total: 1000,
    currency: 'EUR',
    ...overrides,
  });

  // ─── Initial state ───────────────────────────────────────────────────────

  it('starts with an empty invoice list', () => {
    expect(service.invoices()).toEqual([]);
    expect(service.paidCount()).toBe(0);
    expect(service.totalRevenue()).toBe(0);
  });

  // ─── generateRef ─────────────────────────────────────────────────────────

  it('generateRef produces a stable INV-YYYY-NNNN format', () => {
    const ref = service.generateRef();
    const year = new Date().getFullYear();
    expect(ref).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(ref.startsWith(`INV-${year}-`)).toBe(true);
  });

  it('generateRef pads the counter to 4 digits', () => {
    const ref = service.generateRef();
    expect(ref).toContain('-0001');
  });

  it('generateRef increments monotonically', () => {
    const a = service.generateRef();
    const b = service.generateRef();
    const c = service.generateRef();
    expect(a).toContain('-0001');
    expect(b).toContain('-0002');
    expect(c).toContain('-0003');
  });

  // ─── createFromConfirmation — invoice shape ──────────────────────────────

  it('createFromConfirmation returns an Invoice with the booking metadata copied over', () => {
    const c = makeConfirmation();
    const inv = service.createFromConfirmation(c, 'pi_abc123', 'João Inquilino');
    expect(inv.invoiceRef).toMatch(/^INV-\d{4}-0001$/);
    expect(inv.paymentIntentId).toBe('pi_abc123');
    expect(inv.propertyTitle).toBe(c.propertyTitle);
    expect(inv.propertyAddress).toBe(c.propertyAddress);
    expect(inv.tenantName).toBe('João Inquilino');
    expect(inv.landlordName).toBe(c.landlordName);
    expect(inv.bookingRef).toBe(c.bookingRef);
    expect(inv.checkIn).toBe(c.checkIn);
    expect(inv.currency).toBe('EUR');
    expect(inv.total).toBe(c.total);
  });

  it('createFromConfirmation works without a tenant name', () => {
    const inv = service.createFromConfirmation(makeConfirmation(), 'pi_abc');
    expect(inv.tenantName).toBeUndefined();
  });

  it('createFromConfirmation marks paid when status is confirmed', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ status: 'confirmed' }), 'pi_x');
    expect(inv.status).toBe('paid');
  });

  it('createFromConfirmation marks pending when status is not confirmed', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ status: 'pending' }), 'pi_x');
    expect(inv.status).toBe('pending');
  });

  it('createFromConfirmation defaults currency to EUR when not provided', () => {
    const c = makeConfirmation();
    // Force missing currency at runtime to exercise the ?? fallback
    (c as Partial<BookingConfirmationData>).currency = undefined;
    const inv = service.createFromConfirmation(c, 'pi_x');
    expect(inv.currency).toBe('EUR');
  });

  it('issuedAt and dueDate are ISO strings and equal (paid invoices have no future due)', () => {
    const inv = service.createFromConfirmation(makeConfirmation(), 'pi_x');
    expect(new Date(inv.issuedAt).toISOString()).toBe(inv.issuedAt);
    expect(inv.dueDate).toBe(inv.issuedAt);
  });

  it('attaches a mock pdfUrl derived from the payment intent id', () => {
    const inv = service.createFromConfirmation(makeConfirmation(), 'pi_xyz789');
    expect(inv.pdfUrl).toBe('https://api.lisboarent.pt/invoices/pi_xyz789.pdf');
  });

  // ─── createFromConfirmation — line items + totals ────────────────────────

  it('produces exactly 3 line items: rent, cleaning, service fee', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ total: 1000 }), 'pi_x');
    expect(inv.lineItems.length).toBe(3);
    expect(inv.lineItems[0].description).toContain('Arrendamento');
    expect(inv.lineItems[1].description).toBe('Taxa de limpeza');
    expect(inv.lineItems[2].description).toContain('Taxa de serviço');
  });

  it('cleaning fee is fixed at 40 EUR regardless of total', () => {
    const small = service.createFromConfirmation(makeConfirmation({ total: 200 }), 'pi_a');
    const big = service.createFromConfirmation(makeConfirmation({ total: 5000 }), 'pi_b');
    expect(small.lineItems[1].total).toBe(40);
    expect(big.lineItems[1].total).toBe(40);
  });

  it('service fee is 5% of total', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ total: 1000 }), 'pi_x');
    expect(inv.lineItems[2].total).toBe(50);
  });

  it('IVA (tax) rate is 6%', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ total: 1000 }), 'pi_x');
    expect(inv.taxRate).toBe(0.06);
  });

  it('subtotal + taxAmount equals the original total', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ total: 1234.56 }), 'pi_x');
    expect(+(inv.subtotal + inv.taxAmount).toFixed(2)).toBe(1234.56);
  });

  it('taxableAmount line item equals total - serviceFee - cleaning', () => {
    const inv = service.createFromConfirmation(makeConfirmation({ total: 1000 }), 'pi_x');
    // total 1000 - 50 service - 40 cleaning = 910
    expect(inv.lineItems[0].total).toBe(910);
    expect(inv.lineItems[0].unitPrice).toBe(910);
    expect(inv.lineItems[0].quantity).toBe(1);
  });

  // ─── Stored signals ──────────────────────────────────────────────────────

  it('stores generated invoices newest-first in invoices()', () => {
    const a = service.createFromConfirmation(makeConfirmation({ bookingRef: 'BK-A' }), 'pi_a');
    const b = service.createFromConfirmation(makeConfirmation({ bookingRef: 'BK-B' }), 'pi_b');
    expect(service.invoices().length).toBe(2);
    expect(service.invoices()[0].invoiceRef).toBe(b.invoiceRef);
    expect(service.invoices()[1].invoiceRef).toBe(a.invoiceRef);
  });

  it('paidCount only counts paid invoices', () => {
    service.createFromConfirmation(makeConfirmation({ status: 'confirmed' }), 'pi_a');
    service.createFromConfirmation(makeConfirmation({ status: 'pending' }), 'pi_b');
    service.createFromConfirmation(makeConfirmation({ status: 'confirmed' }), 'pi_c');
    expect(service.paidCount()).toBe(2);
  });

  it('totalRevenue sums the totals of paid invoices only', () => {
    service.createFromConfirmation(makeConfirmation({ total: 500, status: 'confirmed' }), 'pi_a');
    service.createFromConfirmation(makeConfirmation({ total: 700, status: 'pending' }), 'pi_b');
    service.createFromConfirmation(makeConfirmation({ total: 300, status: 'confirmed' }), 'pi_c');
    expect(service.totalRevenue()).toBe(800);
  });

  // ─── getByRef ────────────────────────────────────────────────────────────

  it('getByRef returns the invoice for an existing reference', () => {
    const inv = service.createFromConfirmation(makeConfirmation(), 'pi_x');
    expect(service.getByRef(inv.invoiceRef)).toBe(inv);
  });

  it('getByRef returns undefined for an unknown reference', () => {
    expect(service.getByRef('INV-0000-9999')).toBeUndefined();
  });

  // ─── formatAmount ────────────────────────────────────────────────────────

  it('formatAmount renders EUR by default in pt-PT locale', () => {
    const out = service.formatAmount(1234.5);
    // Locale formatting may vary by ICU build — strip non-digits and compare
    expect(out.replace(/\D/g, '')).toContain('1234');
    expect(out).toContain('€');
  });

  it('formatAmount honours an explicit currency code', () => {
    const out = service.formatAmount(100, 'USD');
    expect(out.replace(/\D/g, '')).toContain('100');
    // pt-PT renders USD as "US$" or "$US" depending on ICU build
    expect(out).toMatch(/\$|USD/);
  });
});
