import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PropertyReviewsComponent, PropertyReview, RatingDisplayComponent } from '@israel-ui/core';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REVIEWS: PropertyReview[] = [
  {
    id: 'r1',
    authorName: 'Maria João Ferreira',
    rating: 5,
    body: 'Apartamento fantástico no coração do Chiado. A localização é perfeita — a pé de tudo. O senhorio é muito atencioso e respondeu sempre rapidamente. Recomendo vivamente!',
    date: '2026-02-14',
    verified: true,
    landlordReply: 'Obrigado, Maria João! Foi um prazer tê-la como inquilina. Espero que volte a Lisboa em breve!',
  },
  {
    id: 'r2',
    authorName: 'Pedro Alves',
    rating: 4,
    body: 'Muito bom apartamento. Espaçoso, luminoso e com boas vistas. O único ponto negativo foi um pequeno problema com a canalização que demorou uns dias a resolver.',
    date: '2026-01-28',
    verified: true,
  },
  {
    id: 'r3',
    authorName: 'Sophie Martin',
    rating: 5,
    body: 'Incrível! Fiquei 3 meses e não queria sair. O bairro é tranquilo mas animado, transporte público excelente. O apartamento tem tudo o que precisas.',
    date: '2025-12-10',
    verified: false,
  },
  {
    id: 'r4',
    authorName: 'Carlos Mendes',
    rating: 3,
    body: 'Razoável. A localização é boa mas o apartamento precisa de algumas renovações. A cozinha é pequena e os electrodomésticos são antigos.',
    date: '2025-11-05',
    verified: true,
  },
  {
    id: 'r5',
    authorName: 'Ana Ribeiro',
    rating: 5,
    body: 'Adorei! Tudo conforme descrito. Muito limpo, bem equipado e o senhorio foi super simpático. A vizinhança é segura e acolhedora.',
    date: '2025-10-20',
    verified: true,
  },
  {
    id: 'r6',
    authorName: 'João Costa',
    rating: 2,
    body: 'Infelizmente não correspondeu às expectativas. Havia humidade numa das paredes e o aquecimento central não funcionava bem no Inverno.',
    date: '2025-09-15',
    verified: false,
    landlordReply: 'Pedimos desculpa pelos inconvenientes, João. O problema de humidade foi entretanto resolvido com obras realizadas em Outubro.',
  },
];

const meta: Meta<PropertyReviewsComponent> = {
  title: 'LisboaRent/PropertyReviews',
  component: PropertyReviewsComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**PropertyReviews** — Full reviews section for LisboaRent property detail pages.

Includes:
- **RatingSummary** — average score + animated breakdown bars per star level
- **Sort controls** — Mais recentes / Melhor nota / Pior nota
- **ReviewCards** — avatar (or initials fallback), verified badge, expand/collapse long text, landlord reply
- **Paginated** — load more in batches
- **RatingDisplay** — reusable star widget (sm/md/lg sizes)

Feature flag: \`REVIEWS_MODULE\`
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<PropertyReviewsComponent>;

/**
 * Default — full review list with 6 sample reviews.
 */
export const Default: Story = {
  args: {
    reviews: MOCK_REVIEWS,
    propertyTitle: 'Apartamento T2 no Chiado',
    pageSize: 5,
  },
};

/**
 * SingleHighRating — a property with a single perfect 5-star review.
 */
export const SingleHighRating: Story = {
  args: {
    reviews: [MOCK_REVIEWS[0]],
    propertyTitle: 'Estúdio em Alfama',
    pageSize: 5,
  },
};

/**
 * EmptyState — property with no reviews yet.
 */
export const EmptyState: Story = {
  args: {
    reviews: [],
    propertyTitle: 'Nova Moradia em Cascais',
    pageSize: 5,
  },
};
