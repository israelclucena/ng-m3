import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  PropertyTransactionCostCalculatorComponent,
  PropertyTransactionCostService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-ptcc-story-default',
  standalone: true,
  imports: [PropertyTransactionCostCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-property-transaction-cost-calculator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(PropertyTransactionCostService);
    svc.reset();
  }
}

@Component({
  selector: 'iu-ptcc-story-jovem',
  standalone: true,
  imports: [PropertyTransactionCostCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-property-transaction-cost-calculator />`,
})
class WrapperJovemBuyer {
  constructor() {
    const svc = inject(PropertyTransactionCostService);
    svc.reset();
    svc.setPrecoVenda(220_000);
    svc.setBuyerFinalidade('hpp');
    svc.setBuyerResidencia('residente');
    svc.setBuyerJovem(true);
    svc.setSellerValorAquisicaoOriginal(140_000);
    svc.setSellerAnoAquisicao(2012);
  }
}

@Component({
  selector: 'iu-ptcc-story-nao-residente',
  standalone: true,
  imports: [PropertyTransactionCostCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-property-transaction-cost-calculator />`,
})
class WrapperNaoResidenteSeller {
  constructor() {
    const svc = inject(PropertyTransactionCostService);
    svc.reset();
    svc.setPrecoVenda(450_000);
    svc.setBuyerFinalidade('outros');
    svc.setSellerResidencia('naoResidente');
    svc.setSellerValorAquisicaoOriginal(200_000);
    svc.setSellerAnoAquisicao(2008);
    svc.setSellerDespesasValorizacao(25_000);
  }
}

const meta: Meta = {
  title: 'Sprint 052/PropertyTransactionCostCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calculadora meta-consumer que combina IMT (compra) + Mais-Valias Imobiliárias (venda) ' +
          'numa única transacção. Mostra side-by-side o custo total do comprador (preço + IMT + IS + ' +
          'notário/registo) vs líquido recebido pelo vendedor (preço − IRS Cat. G 28% sobre mais-valia), ' +
          'expondo a fricção total do negócio. Fecha o quadrado: compra (IMT+IS) × venda (Mais-Valias) ' +
          '× titularidade (IMI+AIMI) × disposição operacional (Lifecycle).',
      },
    },
  },
};
export default meta;

/** Default — HPP residente, ano aquisição 2010, transacção €280k. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-ptcc-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Comprador jovem 1ª HPP a €220k → IMT isento, só IS 0.8% + notário. */
export const JovemBuyer: StoryObj = {
  render: () => ({ template: `<iu-ptcc-story-jovem />` }),
  decorators: [moduleMetadata({ imports: [WrapperJovemBuyer] })],
};

/** Vendedor não-residente · 100% tributável · comprador "outros fins". */
export const NaoResidenteSeller: StoryObj = {
  render: () => ({ template: `<iu-ptcc-story-nao-residente />` }),
  decorators: [moduleMetadata({ imports: [WrapperNaoResidenteSeller] })],
};
