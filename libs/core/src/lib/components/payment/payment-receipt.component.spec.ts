import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentReceiptComponent } from './payment-receipt.component';
import type { Invoice } from '../../services/invoice.service';

describe('PaymentReceiptComponent', () => {
  let fixture: ComponentFixture<PaymentReceiptComponent>;
  let component: PaymentReceiptComponent;

  const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
    invoiceRef: 'INV-2026-0001',
    issuedAt: '2026-06-14',
    dueDate: '2026-06-14',
    status: 'paid',
    paymentIntentId: 'pi_123456',
    propertyTitle: 'Apartamento T2 na Graça',
    propertyAddress: 'Rua da Voz do Operário 12, Lisboa',
    tenantName: 'Maria João',
    landlordName: 'Carlos Ferreira',
    bookingRef: 'BK-2026-0007',
    checkIn: '2026-07-01',
    checkOut: '2026-12-31',
    lineItems: [
      { description: 'Renda mensal', quantity: 6, unitPrice: 1200, total: 7200 },
      { description: 'Taxa de serviço', quantity: 1, unitPrice: 80, total: 80 },
    ],
    subtotal: 7280,
    taxRate: 0.23,
    taxAmount: 1674.4,
    total: 8954.4,
    currency: 'EUR',
    pdfUrl: 'https://example.com/inv.pdf',
    ...overrides,
  });

  async function setup(invoice: Invoice | null = makeInvoice()): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PaymentReceiptComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentReceiptComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('invoice', invoice);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Empty state ─────────────────────────────────────────────────────────────
  it('shows an empty state when no invoice is provided', async () => {
    await setup(null);
    expect(fixture.nativeElement.querySelector('.receipt')).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain(
      'Nenhum recibo disponível',
    );
  });

  // ── Header / meta ───────────────────────────────────────────────────────────
  it('renders the invoice and booking references', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('INV-2026-0001');
    expect(text).toContain('BK-2026-0007');
    expect(text).toContain('pi_123456');
  });

  it('renders the property title and address', () => {
    const title = fixture.nativeElement.querySelector(
      '.receipt__property-title',
    ) as HTMLElement;
    const address = fixture.nativeElement.querySelector(
      '.receipt__property-address',
    ) as HTMLElement;
    expect(title.textContent).toContain('Apartamento T2 na Graça');
    expect(address.textContent).toContain('Rua da Voz do Operário 12, Lisboa');
  });

  it('renders both parties', () => {
    const names = fixture.nativeElement.querySelectorAll(
      '.receipt__party-name',
    );
    const text = Array.from(names).map((n) => (n as HTMLElement).textContent);
    expect(text.some((t) => t?.includes('Carlos Ferreira'))).toBe(true);
    expect(text.some((t) => t?.includes('Maria João'))).toBe(true);
  });

  it('omits the tenant party when tenantName is absent', async () => {
    await setup(makeInvoice({ tenantName: undefined }));
    const names = fixture.nativeElement.querySelectorAll(
      '.receipt__party-name',
    );
    expect(names.length).toBe(1);
  });

  // ── Status badge ────────────────────────────────────────────────────────────
  it('statusClass reflects a paid invoice', () => {
    expect(component.statusClass()).toContain('receipt__status--paid');
    const badge = fixture.nativeElement.querySelector(
      '.receipt__status',
    ) as HTMLElement;
    expect(badge.textContent).toContain('Pago');
  });

  it('statusClass reflects a pending invoice', async () => {
    await setup(makeInvoice({ status: 'pending' }));
    expect(component.statusClass()).toContain('receipt__status--pending');
    const badge = fixture.nativeElement.querySelector(
      '.receipt__status',
    ) as HTMLElement;
    expect(badge.textContent).toContain('Pendente');
  });

  it('statusClass is the bare base class when there is no invoice', async () => {
    await setup(null);
    expect(component.statusClass()).toBe('receipt__status');
  });

  // ── Line items ──────────────────────────────────────────────────────────────
  it('renders one row per line item', () => {
    const rows = fixture.nativeElement.querySelectorAll(
      '.receipt__line-items tbody tr',
    );
    expect(rows.length).toBe(2);
  });

  it('renders line item descriptions', () => {
    const body = fixture.nativeElement.querySelector(
      '.receipt__line-items tbody',
    ) as HTMLElement;
    expect(body.textContent).toContain('Renda mensal');
    expect(body.textContent).toContain('Taxa de serviço');
  });

  it('renders the tax rate as a percentage', () => {
    const subtotals = fixture.nativeElement.querySelector(
      '.receipt__subtotals',
    ) as HTMLElement;
    expect(subtotals.textContent).toContain('23%');
  });

  // ── Computeds / formatting ──────────────────────────────────────────────────
  it('formattedDate() formats the issue date', () => {
    expect(component.formattedDate()).toContain('2026');
  });

  it('formattedDate() returns empty string when there is no invoice', async () => {
    await setup(null);
    expect(component.formattedDate()).toBe('');
  });

  it('fmtAmount formats a number as a EUR currency string', () => {
    const formatted = component.fmtAmount(1200);
    expect(formatted).toContain('1');
    expect(formatted).toContain('200');
    expect(formatted).toContain('€');
  });

  // ── Actions / outputs ───────────────────────────────────────────────────────
  it('shows the download button only when a pdfUrl is set', async () => {
    await setup(makeInvoice({ pdfUrl: undefined }));
    expect(
      fixture.nativeElement.querySelector('.receipt__btn--primary'),
    ).toBeFalsy();
  });

  it('onClose emits when "Fechar" is clicked', () => {
    const spy = jest.fn();
    component.onClose.subscribe(spy);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.receipt__btn'),
    ) as HTMLButtonElement[];
    const closeBtn = buttons.find((b) => b.textContent?.includes('Fechar'))!;
    closeBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onDownload emits onDownloadPdf with the pdf url', () => {
    const spy = jest.fn();
    component.onDownloadPdf.subscribe(spy);
    component.onDownload();
    expect(spy).toHaveBeenCalledWith('https://example.com/inv.pdf');
  });

  it('onDownload does nothing when there is no pdf url', async () => {
    await setup(makeInvoice({ pdfUrl: undefined }));
    const spy = jest.fn();
    component.onDownloadPdf.subscribe(spy);
    component.onDownload();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onPrint triggers the browser print dialog', () => {
    const printSpy = jest
      .spyOn(window, 'print')
      .mockImplementation(() => undefined);
    component.onPrint();
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
