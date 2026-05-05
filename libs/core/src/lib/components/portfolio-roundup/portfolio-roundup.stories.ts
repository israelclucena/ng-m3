import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { PortfolioRoundupComponent } from './portfolio-roundup.component';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

const meta: Meta<PortfolioRoundupComponent> = {
  title: 'Sprint 045 (Dashboard Consumer)/PortfolioRoundup',
  component: PortfolioRoundupComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact 3-card widget that summarizes Sprint 045 trilogy outputs ' +
          '(yield / fiscal / compliance) for the dashboard. Each card emits a ' +
          '`detail` event with its key so the host can navigate to the full-screen ' +
          'trilogy component on CTA click.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PortfolioRoundupComponent>;

function withProperties(mut: (props: PortfolioProperty[]) => PortfolioProperty[]) {
  return applicationConfig({
    providers: [
      {
        provide: PortfolioMockService,
        useFactory: () => {
          const base = new PortfolioMockService();
          const next = mut(base.properties());
          return {
            ...base,
            properties: signal(next),
          } as unknown as PortfolioMockService;
        },
      },
    ],
  });
}

export const Default: Story = {
  render: () => ({
    template: `<iu-portfolio-roundup (detail)="onDetail($event)" />`,
    props: {
      onDetail: (key: string) => {
        // Storybook action
        // eslint-disable-next-line no-console
        console.log('detail clicked:', key);
      },
    },
  }),
};

export const WithIssues: Story = {
  decorators: [
    withProperties((props) =>
      props.map((p, i) => {
        if (i === 0) {
          return {
            ...p,
            energy: { ...p.energy, state: 'expired' },
            insurance: { ...p.insurance, state: 'expired' },
          };
        }
        if (i === 1) {
          return { ...p, insurance: { ...p.insurance, state: 'expired' } };
        }
        return p;
      }),
    ),
  ],
  render: () => ({
    template: `<iu-portfolio-roundup (detail)="onDetail($event)" />`,
    props: { onDetail: () => undefined },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Override: 2 properties forced to expired energy/insurance — compliance card flips to critical tone.',
      },
    },
  },
};

export const Empty: Story = {
  decorators: [withProperties(() => [])],
  render: () => ({
    template: `<iu-portfolio-roundup (detail)="onDetail($event)" />`,
    props: { onDetail: () => undefined },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Override: zero properties — empty state placeholder.',
      },
    },
  },
};
