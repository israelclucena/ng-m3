import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  IMTCalculatorComponent,
  IMTService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-imt-story-jovem',
  standalone: true,
  imports: [IMTCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-imt-calculator />`,
})
class WrapperPrimeiraHabitacaoJovem {
  constructor() {
    const svc = inject(IMTService);
    svc.reset();
    svc.setValorAquisicao(280_000);
    svc.setFinalidade('hpp');
    svc.setResidencia('residente');
    svc.setJovem(true);
  }
}

@Component({
  selector: 'iu-imt-story-segunda',
  standalone: true,
  imports: [IMTCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-imt-calculator />`,
})
class WrapperSegundaHabitacao {
  constructor() {
    const svc = inject(IMTService);
    svc.reset();
    svc.setValorAquisicao(450_000);
    svc.setFinalidade('outros');
    svc.setResidencia('residente');
  }
}

@Component({
  selector: 'iu-imt-story-rural-naoresidente',
  standalone: true,
  imports: [IMTCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-imt-calculator />`,
})
class WrapperRuralNaoResidente {
  constructor() {
    const svc = inject(IMTService);
    svc.reset();
    svc.setValorAquisicao(120_000);
    svc.setFinalidade('rural');
    svc.setResidencia('naoResidente');
  }
}

const meta: Meta = {
  title: 'Sprint 048/IMTCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calculadora IMT — imposto municipal sobre a compra de imóvel. Tabelas escalonadas 2026 ' +
          'para Habitação Própria Permanente (com tranche isenta até €101.917) vs outros fins (sem ' +
          'isenção, 1% inicial), taxa fixa 5% para prédios rústicos, isenção total para jovens ' +
          '(1ª habitação até 35 anos) até €316.772, e Imposto de Selo 0.8% sempre devido sobre o ' +
          'valor de aquisição. Estimativa indicativa.',
      },
    },
  },
};
export default meta;

/** Jovem ≤35 anos · 1ª HPP a €280k · isenção total IMT · só paga IS 0.8%. */
export const PrimeiraHabitacaoJovem: StoryObj = {
  render: () => ({ template: `<iu-imt-story-jovem />` }),
  decorators: [moduleMetadata({ imports: [WrapperPrimeiraHabitacaoJovem] })],
};

/** Segunda habitação a €450k · tabela "outros fins" sem tranche isenta · escalões 1/2/5/7/8%. */
export const SegundaHabitacao: StoryObj = {
  render: () => ({ template: `<iu-imt-story-segunda />` }),
  decorators: [moduleMetadata({ imports: [WrapperSegundaHabitacao] })],
};

/** Não-residente · prédio rústico · taxa fixa 5% sem benefícios. */
export const RuralNaoResidente: StoryObj = {
  render: () => ({ template: `<iu-imt-story-rural-naoresidente />` }),
  decorators: [moduleMetadata({ imports: [WrapperRuralNaoResidente] })],
};
