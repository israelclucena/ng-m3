import type { Meta, StoryObj } from '@storybook/angular';
import { YieldCalculatorComponent } from '@israel-ui/core';

const meta: Meta<YieldCalculatorComponent> = {
  title: 'Sprint 040/YieldCalculator',
  component: YieldCalculatorComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Calculadora de rentabilidade para senhorios PT — yield bruto, líquido (após custos + IRS) e payback. Inclui presets para casos típicos Lisboa e Porto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<YieldCalculatorComponent>;

/** Estado inicial — Porto-like preset (~€300k, €1100 renda). User pode editar. */
export const Default: Story = {
  args: {
    purchasePrice: 300000,
    monthlyRent: 1100,
    monthlyCosts: 120,
    taxRatePct: 28,
  },
};

/** Caso Lisboa — apartamento T2 75m² a €8.191/m² (intel Q1 2026), renda €1600. Yield bruto baixo (~3.1%) típico do mercado lisboeta. */
export const LisboaCase: Story = {
  args: {
    purchasePrice: 614000,
    monthlyRent: 1600,
    monthlyCosts: 220,
    taxRatePct: 28,
  },
};

/** Caso Porto — T2 75m² a €4.000/m², renda €1100. Yield bruto ~4.4% — melhor cash-flow mas menor valorização. */
export const PortoCase: Story = {
  args: {
    purchasePrice: 300000,
    monthlyRent: 1100,
    monthlyCosts: 140,
    taxRatePct: 28,
  },
};
