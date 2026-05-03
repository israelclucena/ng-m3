import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  RentEscalationCalculatorComponent,
  RentEscalationService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-re-story-default',
  standalone: true,
  imports: [RentEscalationCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-rent-escalation-calculator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(RentEscalationService);
    svc.reset();
    svc.setRenda(800);
    svc.setAnos(2024, 2026);
  }
}

@Component({
  selector: 'iu-re-story-long',
  standalone: true,
  imports: [RentEscalationCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-rent-escalation-calculator />`,
})
class WrapperLongRange {
  constructor() {
    const svc = inject(RentEscalationService);
    svc.reset();
    svc.setRenda(650);
    svc.setAnos(2018, 2026);
  }
}

@Component({
  selector: 'iu-re-story-override',
  standalone: true,
  imports: [RentEscalationCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-rent-escalation-calculator />`,
})
class WrapperWithOverride {
  constructor() {
    const svc = inject(RentEscalationService);
    svc.reset();
    svc.setRenda(950);
    svc.setAnos(2023, 2026);
    svc.applyCoeficienteOverride(2026, 1.0500);
  }
}

const meta: Meta = {
  title: 'Sprint 043/RentEscalationCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calcula o valor legal máximo de actualização anual de renda em PT (NRAU art. 24.º) ' +
          'usando os coeficientes anuais publicados em Portaria. Tabela ano-a-ano editável ' +
          'permite simular cenários alternativos. Built only with `--md-sys-*` tokens.',
      },
    },
  },
};
export default meta;

/** Caso típico — renda 800€ em 2024, projecção até 2026 (~+9.4% acumulado). */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-re-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Contrato longo 2018→2026 — mostra acumulação de 8 anos de coeficientes. */
export const LongRange: StoryObj = {
  render: () => ({ template: `<iu-re-story-long />` }),
  decorators: [moduleMetadata({ imports: [WrapperLongRange] })],
};

/** Override do coeficiente 2026 (cenário hipotético 1.0500 vs 1.0216 oficial). */
export const WithOverride: StoryObj = {
  render: () => ({ template: `<iu-re-story-override />` }),
  decorators: [moduleMetadata({ imports: [WrapperWithOverride] })],
};
