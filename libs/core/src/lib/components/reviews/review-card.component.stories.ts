import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReviewCardComponent, PropertyReview } from '@israel-ui/core';

const REVIEW_VERIFIED_WITH_REPLY: PropertyReview = {
  id: 'r1',
  authorName: 'Maria João Ferreira',
  rating: 5,
  body: 'Apartamento fantástico no coração do Chiado. A localização é perfeita — a pé de tudo. O senhorio é muito atencioso e respondeu sempre rapidamente. Recomendo vivamente!',
  date: '2026-02-14',
  verified: true,
  landlordReply: 'Obrigado, Maria João! Foi um prazer tê-la como inquilina. Espero que volte a Lisboa em breve!',
};

const REVIEW_LONG_BODY: PropertyReview = {
  id: 'r2',
  authorName: 'Pedro Alves',
  rating: 4,
  body: 'Muito bom apartamento, espaçoso e luminoso, com vistas privilegiadas sobre o Tejo. A localização no Príncipe Real é excelente — perto de tudo, mas suficientemente tranquila à noite. O senhorio foi bastante atencioso, embora o tempo de resposta para questões de manutenção pudesse ser mais rápido. Tive um pequeno problema com a canalização que demorou cerca de uma semana a resolver. De resto, recomendo: a cozinha está bem equipada, as camas são confortáveis e o aquecimento central funciona perfeitamente no Inverno. Voltaria a alugar.',
  date: '2026-01-28',
  verified: true,
};

const REVIEW_NO_AVATAR_NO_REPLY: PropertyReview = {
  id: 'r3',
  authorName: 'Sophie Martin',
  rating: 5,
  body: 'Incrível! Fiquei 3 meses e não queria sair.',
  date: '2025-12-10',
  verified: false,
};

const REVIEW_LOW_RATING_WITH_REPLY: PropertyReview = {
  id: 'r4',
  authorName: 'João Costa',
  rating: 2,
  body: 'Infelizmente não correspondeu às expectativas. Havia humidade numa das paredes e o aquecimento central não funcionava bem no Inverno.',
  date: '2025-09-15',
  verified: false,
  landlordReply: 'Pedimos desculpa pelos inconvenientes, João. O problema de humidade foi entretanto resolvido com obras realizadas em Outubro.',
};

const meta: Meta<ReviewCardComponent> = {
  title: 'LisboaRent/ReviewCard',
  component: ReviewCardComponent,
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
**ReviewCard** — single property review for LisboaRent.

Shows reviewer avatar (or initials fallback), name, star rating, verified badge,
expandable body for long text, date, and optional landlord reply.

Feature flag: \`REVIEWS_MODULE\`
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<ReviewCardComponent>;

/**
 * Default — verified 5-star review with landlord reply.
 */
export const Default: Story = {
  args: {
    review: REVIEW_VERIFIED_WITH_REPLY,
  },
};

/**
 * LongBodyExpandable — body > 200 chars triggers "Ler mais / Mostrar menos" toggle.
 */
export const LongBodyExpandable: Story = {
  args: {
    review: REVIEW_LONG_BODY,
  },
};

/**
 * InitialsFallback — no avatar URL, falls back to author's initials.
 */
export const InitialsFallback: Story = {
  args: {
    review: REVIEW_NO_AVATAR_NO_REPLY,
  },
};

/**
 * LowRatingWithReply — 2-star review with landlord reply (de-escalation pattern).
 */
export const LowRatingWithReply: Story = {
  args: {
    review: REVIEW_LOW_RATING_WITH_REPLY,
  },
};
