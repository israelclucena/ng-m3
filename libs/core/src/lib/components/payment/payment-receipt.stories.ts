import type { Meta, StoryObj } from '@storybook/angular';
import { PaymentReceiptComponent } from '@israel-ui/core';
import type { Invoice } from '@israel-ui/core';

// ─── Shared mock invoice ──────────────────────────────────────────────────────

const mockPaidInvoice: Invoice = {
  invoiceRef: 'INV-2026-0001',
  issuedAt: '2026-03-25T01:00:00.000Z',
  dueDate: '2026-03-25T01:00:00.000Z',
  status: 'paid',
  paymentIntentId: 'pi_mock_abc123def456',
  propertyTitle: 'Apartamento T2 — Bairro Alto',
  propertyAddress: 'Rua do Norte, 42, 1200-000 Lisboa',
  tenantName: 'Maria Santos',
  landlordName: 'João Silva',
  bookingRef: 'LR-2026-0042',
  checkIn: '2026-04-01',
  checkOut: '2026-05-01',
  lineItems: [
    { description: 'Arrendamento — Apartamento T2 — Bairro Alto', quantity: 1, unitPrice: 1063.60, total: 1063.60 },
    { description: 'Taxa de limpeza', quantity: 1, unitPrice: 40.00, total: 40.00 },
    { description: 'Taxa de serviço (5%)', quantity: 1, unitPrice: 60.00, total: 60.00 },
  ],
  subtotal: 1100.00,
  taxRate: 0.06,
  taxAmount: 63.82,
  total: 1200.00,
  currency: 'EUR',
  pdfUrl: 'https://api.lisboarent.pt/invoices/pi_mock_abc123def456.pdf',
};

const mockPendingInvoice: Invoice = {
  ...mockPaidInvoice,
  invoiceRef: 'INV-2026-0002',
  status: 'pending',
  paymentIntentId: 'pi_mock_pending999',
  bookingRef: 'LR-2026-0043',
  pdfUrl: undefined,
  tenantName: undefined,
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<PaymentReceiptComponent> = {
  title: 'Payment/PaymentReceipt',
  component: PaymentReceiptComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**PaymentReceiptComponent** — Sprint 030.

Post-payment receipt display. Shows invoice details, line items, totals, and PDF download link.
Used after \`PaymentService.processPayment()\` succeeds.

Feature flag: \`PAYMENT_RECEIPT\`
        `,
      },
    },
  },
  argTypes: {
    invoice: { control: 'object', description: 'Invoice object from InvoiceService' },
  },
};

export default meta;
type Story = StoryObj<PaymentReceiptComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Paid invoice with PDF download and tenant name */
export const Default: Story = {
  args: {
    invoice: mockPaidInvoice,
  },
};

/** Pending invoice — no PDF link, no tenant name */
export const PendingPayment: Story = {
  args: {
    invoice: mockPendingInvoice,
  },
  parameters: {
    docs: {
      description: { story: 'Pending invoice — status badge shows "Pendente", no PDF download button.' },
    },
  },
};

/** Empty state — no invoice passed */
export const EmptyState: Story = {
  args: {
    invoice: null,
  },
  parameters: {
    docs: {
      description: { story: 'When no invoice is provided, shows a friendly empty state message.' },
    },
  },
};
