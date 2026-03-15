import type { Meta, StoryObj } from '@storybook/angular';
import { AdminPanelComponent } from '@israel-ui/core';
import type {
  AdminInquiry, AdminBooking, AdminReview, AdminProperty,
} from '@israel-ui/core';

// ── Mock Data ────────────────────────────────────────────────────────────

const MOCK_INQUIRIES: AdminInquiry[] = [
  {
    id: 'i1',
    tenantName: 'Maria João Ferreira',
    tenantEmail: 'maria@example.com',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyId: 'p1',
    message: 'Olá! Estou interessada no apartamento. Seria possível agendar uma visita para o próximo fim de semana? Prefiro sábado à tarde.',
    receivedAt: '2026-03-14T10:30:00Z',
    status: 'new',
    unread: true,
  },
  {
    id: 'i2',
    tenantName: 'Pedro Alves',
    tenantEmail: 'pedro.alves@email.pt',
    propertyTitle: 'Studio em Alfama',
    propertyId: 'p2',
    message: 'Bom dia. O estúdio ainda está disponível? Tenho interesse em arrendar a partir de Abril.',
    receivedAt: '2026-03-13T14:15:00Z',
    status: 'replied',
    unread: false,
  },
  {
    id: 'i3',
    tenantName: 'Sophie Martin',
    tenantEmail: 'sophie.martin@paris.fr',
    propertyTitle: 'Moradia T3 na Ajuda',
    propertyId: 'p3',
    message: 'Hi, I am a French expat moving to Lisbon in May. I would love to visit this property.',
    receivedAt: '2026-03-12T09:00:00Z',
    status: 'new',
    unread: true,
  },
  {
    id: 'i4',
    tenantName: 'Carlos Mendes',
    tenantEmail: 'carlos@mendes.pt',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyId: 'p1',
    message: 'Tenho algumas perguntas sobre o condomínio e as despesas incluídas na renda.',
    receivedAt: '2026-03-10T16:45:00Z',
    status: 'archived',
    unread: false,
  },
];

const MOCK_BOOKINGS: AdminBooking[] = [
  {
    id: 'b1',
    tenantName: 'Maria João Ferreira',
    tenantEmail: 'maria@example.com',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyId: 'p1',
    bookingType: 'visit',
    requestedDate: '2026-03-22',
    status: 'pending_approval',
    submittedAt: '2026-03-14T11:00:00Z',
    notes: 'Prefere visita entre as 14h e as 17h.',
  },
  {
    id: 'b2',
    tenantName: 'Sophie Martin',
    tenantEmail: 'sophie.martin@paris.fr',
    propertyTitle: 'Studio em Alfama',
    propertyId: 'p2',
    bookingType: 'rental',
    requestedDate: '2026-05-01',
    durationMonths: 12,
    monthlyRent: 850,
    currency: 'EUR',
    status: 'approved',
    submittedAt: '2026-03-12T09:30:00Z',
  },
  {
    id: 'b3',
    tenantName: 'Pedro Alves',
    tenantEmail: 'pedro.alves@email.pt',
    propertyTitle: 'Moradia T3 na Ajuda',
    propertyId: 'p3',
    bookingType: 'visit',
    requestedDate: '2026-03-18',
    status: 'pending_approval',
    submittedAt: '2026-03-11T12:00:00Z',
  },
  {
    id: 'b4',
    tenantName: 'Carlos Mendes',
    tenantEmail: 'carlos@mendes.pt',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyId: 'p1',
    bookingType: 'rental',
    requestedDate: '2026-04-01',
    durationMonths: 6,
    monthlyRent: 1200,
    currency: 'EUR',
    status: 'completed',
    submittedAt: '2026-02-20T10:00:00Z',
  },
];

const MOCK_REVIEWS: AdminReview[] = [
  {
    id: 'r1',
    authorName: 'Maria João Ferreira',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyId: 'p1',
    rating: 5,
    body: 'Apartamento fantástico! Senhorio muito atencioso e rápido a resolver problemas. Recomendo vivamente.',
    submittedAt: '2026-03-10T08:00:00Z',
    status: 'pending',
    flagged: false,
    landlordReplied: false,
  },
  {
    id: 'r2',
    authorName: 'João Costa',
    propertyTitle: 'Studio em Alfama',
    propertyId: 'p2',
    rating: 2,
    body: 'O apartamento tinha humidade e o aquecimento não funcionava. Muito dececionante para o preço pedido.',
    submittedAt: '2026-03-08T14:30:00Z',
    status: 'pending',
    flagged: true,
    landlordReplied: true,
  },
  {
    id: 'r3',
    authorName: 'Sophie Martin',
    propertyTitle: 'Moradia T3 na Ajuda',
    propertyId: 'p3',
    rating: 4,
    body: 'Very nice property in a quiet area. The garden is beautiful. Minor issues with the kitchen appliances.',
    submittedAt: '2026-03-05T10:15:00Z',
    status: 'approved',
    flagged: false,
    landlordReplied: false,
  },
];

const MOCK_PROPERTIES: AdminProperty[] = [
  {
    id: 'p1',
    title: 'Apartamento T2 no Chiado',
    location: 'Rua do Alecrim 45, Lisboa',
    landlordName: 'António Ferreira',
    landlordEmail: 'antonio@lisboarent.pt',
    monthlyRent: 1200,
    currency: 'EUR',
    status: 'active',
    listedAt: '2026-01-15',
    inquiryCount: 34,
    bookingCount: 8,
    viewCount: 1420,
  },
  {
    id: 'p2',
    title: 'Studio em Alfama',
    location: 'Beco do Espírito Santo 8, Lisboa',
    landlordName: 'Luísa Rodrigues',
    landlordEmail: 'luisa@lisboarent.pt',
    monthlyRent: 850,
    currency: 'EUR',
    status: 'pending_review',
    listedAt: '2026-03-12',
    inquiryCount: 4,
    bookingCount: 1,
    viewCount: 120,
  },
  {
    id: 'p3',
    title: 'Moradia T3 na Ajuda',
    location: 'Calçada da Ajuda 120, Lisboa',
    landlordName: 'Miguel Santos',
    landlordEmail: 'miguel@lisboarent.pt',
    monthlyRent: 1600,
    currency: 'EUR',
    status: 'paused',
    listedAt: '2026-02-01',
    inquiryCount: 8,
    bookingCount: 2,
    viewCount: 320,
  },
];

// ── Story Config ──────────────────────────────────────────────────────────

const meta: Meta<AdminPanelComponent> = {
  title: 'LisboaRent/AdminPanel',
  component: AdminPanelComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**iu-admin-panel** — Centralised landlord/admin moderation panel.

Four tabs:
- **Inquéritos** — incoming tenant messages, mark-read / reply / archive
- **Reservas** — booking requests with approve / reject / cancel
- **Reviews** — user review moderation (approve / reject / flag)
- **Imóveis** — property status management (approve / pause / activate)

Angular Signals only. M3 design tokens. No RxJS.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<AdminPanelComponent>;

// ── Stories ───────────────────────────────────────────────────────────────

/** Default — all four tabs populated with realistic data */
export const Default: Story = {
  args: {
    inquiries: MOCK_INQUIRIES,
    bookings: MOCK_BOOKINGS,
    reviews: MOCK_REVIEWS,
    properties: MOCK_PROPERTIES,
  },
};

/** Busy — multiple items pending moderation in every tab */
export const BusyDashboard: Story = {
  name: 'Busy — Multiple Pending Items',
  args: {
    inquiries: [
      ...MOCK_INQUIRIES,
      {
        id: 'i5',
        tenantName: 'Ana Ribeiro',
        tenantEmail: 'ana.ribeiro@exemplo.pt',
        propertyTitle: 'Moradia T3 na Ajuda',
        propertyId: 'p3',
        message: 'Olá! Já visitei o imóvel e tenho interesse em avançar com o arrendamento. Podemos falar?',
        receivedAt: '2026-03-15T07:30:00Z',
        status: 'new',
        unread: true,
      },
    ],
    bookings: [
      ...MOCK_BOOKINGS,
      {
        id: 'b5',
        tenantName: 'Ana Ribeiro',
        tenantEmail: 'ana.ribeiro@exemplo.pt',
        propertyTitle: 'Moradia T3 na Ajuda',
        propertyId: 'p3',
        bookingType: 'rental' as const,
        requestedDate: '2026-04-15',
        durationMonths: 24,
        monthlyRent: 1600,
        currency: 'EUR',
        status: 'pending_approval' as const,
        submittedAt: '2026-03-15T08:00:00Z',
        notes: 'Casal sem animais. Referências disponíveis.',
      },
    ],
    reviews: MOCK_REVIEWS,
    properties: [
      ...MOCK_PROPERTIES,
      {
        id: 'p4',
        title: 'Penthouse com Vista Tejo',
        location: 'Mouraria, Lisboa',
        landlordName: 'Ricardo Lima',
        landlordEmail: 'ricardo@lisboarent.pt',
        monthlyRent: 3200,
        currency: 'EUR',
        status: 'pending_review' as const,
        listedAt: '2026-03-14',
        inquiryCount: 2,
        bookingCount: 0,
        viewCount: 55,
      },
    ],
  },
};

/** Empty — all lists empty (zero state) */
export const EmptyState: Story = {
  name: 'Empty — No Items',
  args: {
    inquiries: [],
    bookings: [],
    reviews: [],
    properties: [],
  },
};
