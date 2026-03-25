/**
 * @fileoverview PaymentReceiptComponent — Sprint 030
 *
 * Post-payment receipt screen. Displays invoice details after a successful
 * PaymentService.processPayment() call. Printable layout with M3 design tokens.
 *
 * Feature flag: PAYMENT_RECEIPT
 *
 * @example
 * ```html
 * <iu-payment-receipt [invoice]="myInvoice" />
 * ```
 */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService, type Invoice } from '../../services/invoice.service';

@Component({
  selector: 'iu-payment-receipt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styles: [`
    :host {
      display: block;
      font-family: var(--md-sys-typescale-body-large-font, system-ui);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .receipt {
      max-width: 640px;
      margin: 0 auto;
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 16px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      overflow: hidden;
    }

    /* ── Header ─────────────────────────────────── */
    .receipt__header {
      background: var(--md-sys-color-primary-container, #eaddff);
      padding: 32px 24px 24px;
      text-align: center;
    }
    .receipt__icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 12px;
    }
    .receipt__title {
      font-size: var(--md-sys-typescale-headline-small-size, 24px);
      font-weight: 600;
      color: var(--md-sys-color-on-primary-container, #21005d);
      margin: 0 0 4px;
    }
    .receipt__subtitle {
      font-size: var(--md-sys-typescale-body-medium-size, 14px);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }

    /* ── Status badge ────────────────────────────── */
    .receipt__status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 500;
      margin-top: 12px;
    }
    .receipt__status--paid {
      background: var(--md-sys-color-tertiary-container, #d4edda);
      color: var(--md-sys-color-on-tertiary-container, #0a3022);
    }
    .receipt__status--pending {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }

    /* ── Meta row ────────────────────────────────── */
    .receipt__meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .receipt__meta-item {
      background: var(--md-sys-color-surface-variant, #f4eff4);
      padding: 14px 20px;
    }
    .receipt__meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 4px;
    }
    .receipt__meta-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      word-break: break-all;
    }

    /* ── Body ────────────────────────────────────── */
    .receipt__body {
      padding: 24px;
    }
    .receipt__section {
      margin-bottom: 24px;
    }
    .receipt__section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-primary, #6750a4);
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }

    /* Property section */
    .receipt__property-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    .receipt__property-address {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0 0 8px;
    }
    .receipt__checkin {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* Parties */
    .receipt__parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .receipt__party-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 4px;
    }
    .receipt__party-name {
      font-size: 14px;
      font-weight: 600;
    }

    /* Line items */
    .receipt__line-items { width: 100%; border-collapse: collapse; }
    .receipt__line-items th,
    .receipt__line-items td {
      padding: 10px 8px;
      text-align: left;
      font-size: 14px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .receipt__line-items th {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .receipt__line-items td:last-child,
    .receipt__line-items th:last-child { text-align: right; }
    .receipt__subtotals { margin-top: 8px; }
    .receipt__subtotal-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .receipt__total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 8px;
      margin-top: 8px;
      border-top: 2px solid var(--md-sys-color-outline, #79747e);
      font-size: 18px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    /* ── Actions ─────────────────────────────────── */
    .receipt__actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding: 0 24px 24px;
    }
    .receipt__btn {
      flex: 1;
      min-width: 140px;
      padding: 12px 20px;
      border-radius: 100px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: opacity 0.15s;
    }
    .receipt__btn:hover { opacity: 0.88; }
    .receipt__btn--primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .receipt__btn--outlined {
      background: transparent;
      color: var(--md-sys-color-primary, #6750a4);
      border: 1.5px solid var(--md-sys-color-outline, #79747e);
    }

    /* ── Print ───────────────────────────────────── */
    @media print {
      .receipt__actions { display: none; }
      .receipt { border: none; box-shadow: none; }
    }
  `],
  template: `
    @if (invoice()) {
      <article class="receipt" [attr.aria-label]="'Receipt ' + invoice()!.invoiceRef">

        <!-- Header -->
        <header class="receipt__header">
          <div class="receipt__icon" aria-hidden="true">✓</div>
          <h2 class="receipt__title">Pagamento Confirmado</h2>
          <p class="receipt__subtitle">Recibo de pagamento — {{ invoice()!.bookingRef }}</p>
          <span class="receipt__status" [class]="statusClass()">
            {{ invoice()!.status === 'paid' ? '✅ Pago' : '⏳ Pendente' }}
          </span>
        </header>

        <!-- Meta row -->
        <div class="receipt__meta">
          <div class="receipt__meta-item">
            <div class="receipt__meta-label">Nº Fatura</div>
            <div class="receipt__meta-value">{{ invoice()!.invoiceRef }}</div>
          </div>
          <div class="receipt__meta-item">
            <div class="receipt__meta-label">Data</div>
            <div class="receipt__meta-value">{{ formattedDate() }}</div>
          </div>
          <div class="receipt__meta-item">
            <div class="receipt__meta-label">Ref. Pagamento</div>
            <div class="receipt__meta-value">{{ invoice()!.paymentIntentId }}</div>
          </div>
          <div class="receipt__meta-item">
            <div class="receipt__meta-label">Check-in</div>
            <div class="receipt__meta-value">{{ invoice()!.checkIn }}</div>
          </div>
        </div>

        <!-- Body -->
        <div class="receipt__body">

          <!-- Property -->
          <section class="receipt__section">
            <h3 class="receipt__section-title">Propriedade</h3>
            <p class="receipt__property-title">{{ invoice()!.propertyTitle }}</p>
            <p class="receipt__property-address">{{ invoice()!.propertyAddress }}</p>
            @if (invoice()!.checkOut) {
              <span class="receipt__checkin">Check-out: {{ invoice()!.checkOut }}</span>
            }
          </section>

          <!-- Parties -->
          <section class="receipt__section">
            <h3 class="receipt__section-title">Partes</h3>
            <div class="receipt__parties">
              <div>
                <div class="receipt__party-label">Senhorio</div>
                <div class="receipt__party-name">{{ invoice()!.landlordName }}</div>
              </div>
              @if (invoice()!.tenantName) {
                <div>
                  <div class="receipt__party-label">Inquilino</div>
                  <div class="receipt__party-name">{{ invoice()!.tenantName }}</div>
                </div>
              }
            </div>
          </section>

          <!-- Line items -->
          <section class="receipt__section">
            <h3 class="receipt__section-title">Detalhes do Pagamento</h3>
            <table class="receipt__line-items">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of invoice()!.lineItems; track item.description) {
                  <tr>
                    <td>{{ item.description }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ fmtAmount(item.total) }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="receipt__subtotals">
              <div class="receipt__subtotal-row">
                <span>Subtotal</span>
                <span>{{ fmtAmount(invoice()!.subtotal) }}</span>
              </div>
              <div class="receipt__subtotal-row">
                <span>IVA ({{ invoice()!.taxRate * 100 }}%)</span>
                <span>{{ fmtAmount(invoice()!.taxAmount) }}</span>
              </div>
            </div>

            <div class="receipt__total-row">
              <span>Total Pago</span>
              <span>{{ fmtAmount(invoice()!.total) }}</span>
            </div>
          </section>
        </div>

        <!-- Actions -->
        <footer class="receipt__actions">
          @if (invoice()!.pdfUrl) {
            <button class="receipt__btn receipt__btn--primary" (click)="onDownload()">
              ⬇ Descarregar PDF
            </button>
          }
          <button class="receipt__btn receipt__btn--outlined" (click)="onPrint()">
            🖨 Imprimir
          </button>
          <button class="receipt__btn receipt__btn--outlined" (click)="onClose.emit()">
            Fechar
          </button>
        </footer>

      </article>
    } @else {
      <div style="padding: 32px; text-align: center; color: var(--md-sys-color-on-surface-variant, #49454f);">
        Nenhum recibo disponível.
      </div>
    }
  `,
})
export class PaymentReceiptComponent {
  private readonly invoiceService = inject(InvoiceService);

  /** The invoice to display. Pass null/undefined to show empty state. */
  readonly invoice = input<Invoice | null>(null);

  /** Emitted when the user clicks "Fechar" */
  readonly onClose = output<void>();

  /** Emitted when the user clicks "Descarregar PDF" */
  readonly onDownloadPdf = output<string>();

  /** CSS class for the status badge */
  readonly statusClass = computed(() => {
    const inv = this.invoice();
    if (!inv) return 'receipt__status';
    return `receipt__status receipt__status--${inv.status === 'paid' ? 'paid' : 'pending'}`;
  });

  /** Formatted issue date */
  readonly formattedDate = computed(() => {
    const inv = this.invoice();
    if (!inv) return '';
    return new Date(inv.issuedAt).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  /**
   * Format a monetary amount using InvoiceService.
   */
  fmtAmount(amount: number): string {
    return this.invoiceService.formatAmount(amount, this.invoice()?.currency ?? 'EUR');
  }

  /** Trigger browser print dialog */
  onPrint(): void {
    window.print();
  }

  /** Emit PDF URL for parent to handle download */
  onDownload(): void {
    const url = this.invoice()?.pdfUrl;
    if (url) this.onDownloadPdf.emit(url);
  }
}
