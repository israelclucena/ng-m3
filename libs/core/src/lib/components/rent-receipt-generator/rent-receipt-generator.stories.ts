import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RentReceiptGeneratorComponent, RentReceiptService } from '@israel-ui/core';

@Component({
  selector: 'iu-rrg-story-empty',
  standalone: true,
  imports: [RentReceiptGeneratorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-rent-receipt-generator />`,
})
class WrapperEmpty {
  constructor() {
    inject(RentReceiptService).clear();
  }
}

@Component({
  selector: 'iu-rrg-story-defaults',
  standalone: true,
  imports: [RentReceiptGeneratorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-rent-receipt-generator />`,
})
class WrapperWithDefaults {
  constructor() {
    inject(RentReceiptService).clear();
  }
  // Note: form fields are component-internal signals, so users see empty form;
  // the "WithDefaults" story exists to clearly differentiate from the post-emit
  // case while keeping pre-fill ergonomics for the future.
}

@Component({
  selector: 'iu-rrg-story-generated',
  standalone: true,
  imports: [RentReceiptGeneratorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-rent-receipt-generator />`,
})
class WrapperGenerated {
  constructor() {
    const svc = inject(RentReceiptService);
    svc.clear();
    svc.generate({
      nomeSenhorio:   'António Mendes Silva',
      nifSenhorio:    '218465932',
      nomeInquilino:  'Sofia Castro Pereira',
      nifInquilino:   '253871469',
      moradaImovel:   'Rua das Amoreiras, 42, 3.º Esq, 1250-025 Lisboa',
      mesReferencia:  '2026-04',
      valorMensal:    950,
      retencaoIRSPct: 25,
    });
  }
}

const meta: Meta = {
  title: 'Sprint 041/RentReceiptGenerator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Gerador de recibo de renda eletrónico estilo AT (Categoria F). Valida NIFs (algoritmo PT), aplica retenção IRS configurável (default 25%) e mostra preview imprimível pós-emissão. Histórico em sessão com remover individual.',
      },
    },
  },
};

export default meta;

/** Estado inicial — sem recibos emitidos, formulário vazio. */
export const Empty: StoryObj = {
  render: () => ({ template: `<iu-rrg-story-empty />` }),
  decorators: [moduleMetadata({ imports: [WrapperEmpty] })],
};

/** Form pronto para preencher — same as Empty hoje, ponto de extensão futuro para presets. */
export const WithDefaults: StoryObj = {
  render: () => ({ template: `<iu-rrg-story-defaults />` }),
  decorators: [moduleMetadata({ imports: [WrapperWithDefaults] })],
};

/** Recibo já emitido — preview AT renderizado com renda €950, retenção 25% (€237,50 retidos, €712,50 líquidos). */
export const Generated: StoryObj = {
  render: () => ({ template: `<iu-rrg-story-generated />` }),
  decorators: [moduleMetadata({ imports: [WrapperGenerated] })],
};
