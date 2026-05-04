import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  CreditoHabitacaoSimulatorComponent,
  CreditoHabitacaoService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-ch-story-default',
  standalone: true,
  imports: [CreditoHabitacaoSimulatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-credito-habitacao-simulator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(CreditoHabitacaoService);
    svc.reset();
    svc.setValorImovel(250_000);
    svc.setEntrada(25_000);
    svc.setPrazoAnos(30);
    svc.setIndexante('euribor6m');
    svc.setSpread(0.01);
  }
}

@Component({
  selector: 'iu-ch-story-investidor',
  standalone: true,
  imports: [CreditoHabitacaoSimulatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-credito-habitacao-simulator />`,
})
class WrapperInvestidor {
  constructor() {
    const svc = inject(CreditoHabitacaoService);
    svc.reset();
    svc.setValorImovel(200_000);
    svc.setEntrada(40_000);
    svc.setPrazoAnos(35);
    svc.setIndexante('euribor12m');
    svc.setSpread(0.012);
  }
}

@Component({
  selector: 'iu-ch-story-taxa-fixa',
  standalone: true,
  imports: [CreditoHabitacaoSimulatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-credito-habitacao-simulator />`,
})
class WrapperTaxaFixa {
  constructor() {
    const svc = inject(CreditoHabitacaoService);
    svc.reset();
    svc.setValorImovel(280_000);
    svc.setEntrada(56_000);
    svc.setPrazoAnos(30);
    svc.setIndexante('taxaFixa');
    svc.setTanFixa(0.035);
  }
}

const meta: Meta = {
  title: 'Sprint 044/CreditoHabitacaoSimulator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Simulador Crédito Habitação (PT mortgage) — fórmula Price standard, TAEG aproximada via ' +
          'Newton-Raphson, LTV, juros totais e tabela de amortização (12 primeiros + 12 últimos meses). ' +
          'Suporte indexantes Euribor 3M/6M/12M (defaults Maio 2026, override-able) ou taxa fixa.',
      },
    },
  },
};
export default meta;

/** T2 Lisboa 250k, entrada 25k (LTV 90%), 30 anos, Euribor 6M+1.0%. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-ch-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Landlord 1ª aquisição investimento — 200k LTV 80%, 35 anos, Euribor 12M+1.2%. */
export const Investidor: StoryObj = {
  render: () => ({ template: `<iu-ch-story-investidor />` }),
  decorators: [moduleMetadata({ imports: [WrapperInvestidor] })],
};

/** Taxa fixa 3.5% 30 anos — comparação para quem prefere previsibilidade. */
export const TaxaFixa: StoryObj = {
  render: () => ({ template: `<iu-ch-story-taxa-fixa />` }),
  decorators: [moduleMetadata({ imports: [WrapperTaxaFixa] })],
};
