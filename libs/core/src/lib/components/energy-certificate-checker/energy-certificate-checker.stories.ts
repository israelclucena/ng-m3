import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  EnergyCertificateCheckerComponent,
  EnergyCertificateService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-ec-story-default',
  standalone: true,
  imports: [EnergyCertificateCheckerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-energy-certificate-checker />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(EnergyCertificateService);
    svc.reset();
    svc.setNumero('CE-2024-1234567');
    svc.setClasse('C');
    svc.setDataEmissao('2024-06-15');
    svc.setAreaM2(80);
    svc.setHoje('2026-05-04');
  }
}

@Component({
  selector: 'iu-ec-story-expirado',
  standalone: true,
  imports: [EnergyCertificateCheckerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-energy-certificate-checker />`,
})
class WrapperExpirado {
  constructor() {
    const svc = inject(EnergyCertificateService);
    svc.reset();
    svc.setNumero('CE-2014-9876543');
    svc.setClasse('B-');
    svc.setDataEmissao('2014-03-10');
    svc.setAreaM2(110);
    svc.setHoje('2026-05-04');
  }
}

@Component({
  selector: 'iu-ec-story-eficiente',
  standalone: true,
  imports: [EnergyCertificateCheckerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-energy-certificate-checker />`,
})
class WrapperEficienteAplus {
  constructor() {
    const svc = inject(EnergyCertificateService);
    svc.reset();
    svc.setNumero('CE-2025-5550001');
    svc.setClasse('A+');
    svc.setDataEmissao('2025-09-01');
    svc.setAreaM2(95);
    svc.setHoje('2026-05-04');
  }
}

const meta: Meta = {
  title: 'Sprint 044/EnergyCertificateChecker',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Verificador de Certificado Energético PT (ADENE) — valida expiração, mostra badge ' +
          'colorido por classe (A+ a F), estima poupança vs classe A e surfaces compliance ' +
          'legal (DL 118/2013 art. 18.º — multa 250–3740€ por listing sem CE válido).',
      },
    },
  },
};
export default meta;

/** T2 classe C válido até 2034 — caso típico apartamento PT. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-ec-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** B- emitido 2014 — expirou em 2024, alert vermelho. */
export const Expirado: StoryObj = {
  render: () => ({ template: `<iu-ec-story-expirado />` }),
  decorators: [moduleMetadata({ imports: [WrapperExpirado] })],
};

/** Apartamento novo Lisboa A+ — destaque positivo, sem poupança extra a fazer. */
export const EficienteAplus: StoryObj = {
  render: () => ({ template: `<iu-ec-story-eficiente />` }),
  decorators: [moduleMetadata({ imports: [WrapperEficienteAplus] })],
};
