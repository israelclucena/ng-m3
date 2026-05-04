import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  IRSCategoriaFCalculatorComponent,
  IRSCategoriaFService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-irs-story-default',
  standalone: true,
  imports: [IRSCategoriaFCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-irs-categoria-f-calculator />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(IRSCategoriaFService);
    svc.reset();
    svc.setRendimentoBruto(12_000);
    svc.setDespesas(3_000);
  }
}

@Component({
  selector: 'iu-irs-story-landlord-grande',
  standalone: true,
  imports: [IRSCategoriaFCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-irs-categoria-f-calculator />`,
})
class WrapperLandlordGrande {
  constructor() {
    const svc = inject(IRSCategoriaFService);
    svc.reset();
    svc.setRendimentoBruto(45_000);
    svc.setDespesas(12_000);
    svc.setOutrosRendimentos(30_000);
  }
}

@Component({
  selector: 'iu-irs-story-englobamento',
  standalone: true,
  imports: [IRSCategoriaFCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-irs-categoria-f-calculator />`,
})
class WrapperEnglobamentoFavoravel {
  constructor() {
    const svc = inject(IRSCategoriaFService);
    svc.reset();
    svc.setRendimentoBruto(4_800);
    svc.setDespesas(800);
    svc.setOutrosRendimentos(0);
    svc.setRegime('englobamento');
  }
}

const meta: Meta = {
  title: 'Sprint 044/IRSCategoriaFCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calculadora IRS Categoria F (rendimentos prediais) — compara taxa autónoma 28% vs ' +
          'englobamento nos escalões progressivos IRS 2026, mostra colecta, taxa efectiva e ' +
          'recomenda regime mais favorável. Estimativa indicativa, não substitui aconselhamento contabilístico.',
      },
    },
  },
};
export default meta;

/** Apartamento Lisboa renda 12k/ano, despesas 3k — caso típico landlord PT. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-irs-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Carteira média 45k/ano com 12k despesas + 30k outros rendimentos do agregado. */
export const LandlordGrande: StoryObj = {
  render: () => ({ template: `<iu-irs-story-landlord-grande />` }),
  decorators: [moduleMetadata({ imports: [WrapperLandlordGrande] })],
};

/** Quarto arrendado 400€/mês — englobamento ganha pela taxa marginal baixa. */
export const EnglobamentoFavoravel: StoryObj = {
  render: () => ({ template: `<iu-irs-story-englobamento />` }),
  decorators: [moduleMetadata({ imports: [WrapperEnglobamentoFavoravel] })],
};
