import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  IMICalculatorComponent,
  IMICalculatorService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-imi-story-default',
  standalone: true,
  imports: [IMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-imi-calculator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(IMICalculatorService);
    svc.reset();
    svc.setVpt(150_000);
    svc.setConcelho('Lisboa');
  }
}

@Component({
  selector: 'iu-imi-story-premium',
  standalone: true,
  imports: [IMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-imi-calculator />`,
})
class WrapperPremium {
  constructor() {
    const svc = inject(IMICalculatorService);
    svc.reset();
    svc.setVpt(600_000);
    svc.setConcelho('Cascais');
    svc.usoProprio.set(false);
    svc.agregadoFamiliar.set(0);
  }
}

@Component({
  selector: 'iu-imi-story-jovem',
  standalone: true,
  imports: [IMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-imi-calculator />`,
})
class WrapperIsencaoJovem {
  constructor() {
    const svc = inject(IMICalculatorService);
    svc.reset();
    svc.setVpt(120_000);
    svc.setConcelho('Porto');
    svc.usoProprio.set(true);
    svc.agregadoFamiliar.set(3);
  }
}

const meta: Meta = {
  title: 'Sprint 043/IMICalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calculadora IMI para senhorios PT — VPT × taxa concelhia, dedução agregado familiar ' +
          '(uso próprio) e calendário de prestações segundo regras AT (≤100€ → 1×, ≤500€ → 2×, >500€ → 3×). ' +
          'Tabela de taxas municipais (Lisboa, Porto, Cascais, Sintra, etc.) com override manual.',
      },
    },
  },
};
export default meta;

/** Apartamento Lisboa VPT 150k → ~450€/ano (3 prestações Maio/Ago/Nov). */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-imi-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Vivenda Cascais VPT 600k → ~2040€/ano (3 prestações), arrendamento. */
export const Premium: StoryObj = {
  render: () => ({ template: `<iu-imi-story-premium />` }),
  decorators: [moduleMetadata({ imports: [WrapperPremium] })],
};

/** Habitação própria Porto VPT 120k com 3 dependentes → −70€ rebate. */
export const IsencaoJovem: StoryObj = {
  render: () => ({ template: `<iu-imi-story-jovem />` }),
  decorators: [moduleMetadata({ imports: [WrapperIsencaoJovem] })],
};
