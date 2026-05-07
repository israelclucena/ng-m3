import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  MaisValiasImobiliariasCalculatorComponent,
  MaisValiasImobiliariasService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-mv-story-default',
  standalone: true,
  imports: [MaisValiasImobiliariasCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-mais-valias-imobiliarias-calculator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(MaisValiasImobiliariasService);
    svc.reset();
    svc.setValorRealizacao(280_000);
    svc.setValorAquisicao(150_000);
    svc.setAnoAquisicao(2010);
    svc.setEncargos(8_000);
    svc.setValorizacao(15_000);
  }
}

@Component({
  selector: 'iu-mv-story-nao-residente',
  standalone: true,
  imports: [MaisValiasImobiliariasCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-mais-valias-imobiliarias-calculator />`,
})
class WrapperNaoResidente {
  constructor() {
    const svc = inject(MaisValiasImobiliariasService);
    svc.reset();
    svc.setResidencia('naoResidente');
    svc.setValorRealizacao(420_000);
    svc.setValorAquisicao(260_000);
    svc.setAnoAquisicao(2015);
    svc.setEncargos(12_000);
    svc.setValorizacao(8_000);
  }
}

@Component({
  selector: 'iu-mv-story-aquisicao-antiga',
  standalone: true,
  imports: [MaisValiasImobiliariasCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-mais-valias-imobiliarias-calculator />`,
})
class WrapperAquisicaoAntiga {
  constructor() {
    const svc = inject(MaisValiasImobiliariasService);
    svc.reset();
    svc.setValorRealizacao(350_000);
    svc.setValorAquisicao(80_000);
    svc.setAnoAquisicao(1995);
    svc.setEncargos(4_000);
    svc.setValorizacao(40_000);
    svc.setOutrosRendimentos(10_000);
    svc.setRegime('englobamento');
  }
}

const meta: Meta = {
  title: 'Sprint 047/MaisValiasImobiliariasCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calculadora IRS Categoria G — venda de imóvel. Aplica coeficiente de desvalorização ' +
          'monetária ao valor de aquisição (Portaria 314/2024), deduz encargos com aquisição e ' +
          'despesas de valorização nos 12 anos anteriores, tributa 50% (residente) ou 100% (não-residente), ' +
          'e compara taxa autónoma 28% vs englobamento progressivo. Estimativa indicativa.',
      },
    },
  },
};
export default meta;

/** Compra 2010, venda 2026 — caso típico de venda da casa antiga residente. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-mv-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Não-residente: 100% da mais-valia tributada a 28% sem englobamento. */
export const NaoResidente: StoryObj = {
  render: () => ({ template: `<iu-mv-story-nao-residente />` }),
  decorators: [moduleMetadata({ imports: [WrapperNaoResidente] })],
};

/** Aquisição em 1995 — coeficiente alto (1.86×) reduz mais-valia substancialmente. */
export const AquisicaoAntiga: StoryObj = {
  render: () => ({ template: `<iu-mv-story-aquisicao-antiga />` }),
  decorators: [moduleMetadata({ imports: [WrapperAquisicaoAntiga] })],
};
