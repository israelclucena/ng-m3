import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { DepositReturnEstimatorComponent, DepositReturnService } from '@israel-ui/core';

@Component({
  selector: 'iu-dre-story-default',
  standalone: true,
  imports: [DepositReturnEstimatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-deposit-return-estimator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(DepositReturnService);
    svc.reset();
    svc.setCaucao(1500);
  }
}

@Component({
  selector: 'iu-dre-story-with-damages',
  standalone: true,
  imports: [DepositReturnEstimatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-deposit-return-estimator />`,
})
class WrapperWithDamages {
  constructor() {
    const svc = inject(DepositReturnService);
    svc.reset();
    svc.setCaucao(1500);
    svc.addItem({ label: 'Limpeza profissional pós-saída', cost: 120, category: 'cleaning' });
    svc.addItem({ label: 'Pintura do quarto principal',     cost: 180, category: 'repairs' });
    svc.addItem({ label: 'Última fatura EDP em dívida',     cost: 65,  category: 'unpaid_utilities' });
    svc.setWithholdingPct(2);
  }
}

@Component({
  selector: 'iu-dre-story-full',
  standalone: true,
  imports: [DepositReturnEstimatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-deposit-return-estimator />`,
})
class WrapperFullReturn {
  constructor() {
    const svc = inject(DepositReturnService);
    svc.reset();
    svc.setCaucao(2000);
  }
}

const meta: Meta = {
  title: 'Sprint 041/DepositReturnEstimator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Calculadora de devolução de caução para o mercado de arrendamento PT (NRAU art. 13.º). O senhorio declara o valor da caução, lista deduções por categoria e a componente devolve o montante a restituir ao inquilino. Construído só com tokens `--md-sys-*` (sem `@material/web`).',
      },
    },
  },
};

export default meta;

/** Estado inicial — caução de €1.500 (2x €750), sem deduções. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-dre-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Saída com deduções típicas (limpeza, pintura, fatura EDP) + 2% retenção administrativa. */
export const WithDamages: StoryObj = {
  render: () => ({ template: `<iu-dre-story-with-damages />` }),
  decorators: [moduleMetadata({ imports: [WrapperWithDamages] })],
};

/** Inquilino exemplar — caução €2.000 devolvida 100%. Sem deduções. */
export const FullReturn: StoryObj = {
  render: () => ({ template: `<iu-dre-story-full />` }),
  decorators: [moduleMetadata({ imports: [WrapperFullReturn] })],
};
