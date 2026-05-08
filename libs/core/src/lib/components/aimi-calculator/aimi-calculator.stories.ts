import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  AIMICalculatorComponent,
  AIMIService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-aimi-story-default',
  standalone: true,
  imports: [AIMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-aimi-calculator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(AIMIService);
    svc.reset();
  }
}

@Component({
  selector: 'iu-aimi-story-acima-um-milhao',
  standalone: true,
  imports: [AIMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-aimi-calculator />`,
})
class WrapperAcimaDeUmMilhao {
  constructor() {
    const svc = inject(AIMIService);
    svc.reset();
    svc.setTitular('singular');
    svc.setPropriedades([
      { id: 'lis-1', label: 'T3 Príncipe Real', vpt: 720_000 },
      { id: 'lis-2', label: 'T2 Lapa', vpt: 540_000 },
      { id: 'cas-1', label: 'Moradia Estoril', vpt: 380_000 },
    ]);
  }
}

@Component({
  selector: 'iu-aimi-story-casal-conjunto',
  standalone: true,
  imports: [AIMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-aimi-calculator />`,
})
class WrapperCasalConjunto {
  constructor() {
    const svc = inject(AIMIService);
    svc.reset();
    svc.setTitular('conjunto');
    svc.setPropriedades([
      { id: 'lis-1', label: 'T3 Avenidas Novas', vpt: 690_000 },
      { id: 'cas-1', label: 'Moradia Sintra', vpt: 410_000 },
      { id: 'alg-1', label: 'T2 Albufeira praia', vpt: 220_000 },
      { id: 'ter-1', label: 'Terreno construção Loures', vpt: 95_000 },
    ]);
  }
}

const meta: Meta = {
  title: 'Sprint 048/AIMICalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calculadora AIMI (Adicional ao IMI) — wealth tax sobre o VPT total de imóveis ' +
          'urbanos habitacionais e terrenos para construção. Aplica dedução por titular ' +
          '(€600k singular / €1.2M casal opção conjunta / 0 sociedades) e taxa progressiva ' +
          '0.7%/1.0%/1.5% (singulares e casais) ou taxa fixa 0.4% (sociedades). Estimativa ' +
          'indicativa — não modela majorações de prédios devolutos nem isenções de reabilitação urbana.',
      },
    },
  },
};
export default meta;

/** Portfolio padrão de 3 imóveis urbanos abaixo da dedução singular — sem AIMI devido. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-aimi-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Singular com VPT total > €1M — escalões 0.7% (€600k–€1M) + 1.0% (>€1M) ambos activos. */
export const AcimaDeUmMilhao: StoryObj = {
  render: () => ({ template: `<iu-aimi-story-acima-um-milhao />` }),
  decorators: [moduleMetadata({ imports: [WrapperAcimaDeUmMilhao] })],
};

/** Casal com opção conjunta — dedução €1.2M dilui base tributável do mesmo portfolio. */
export const CasalConjunto: StoryObj = {
  render: () => ({ template: `<iu-aimi-story-casal-conjunto />` }),
  decorators: [moduleMetadata({ imports: [WrapperCasalConjunto] })],
};
