import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  CommunicationCenterComponent,
  CommunicationCenterStateService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-cc-story-default',
  standalone: true,
  imports: [CommunicationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-communication-center />`,
})
class WrapperDefault {
  constructor() {
    const svc = inject(CommunicationCenterStateService);
    svc.selectTemplate(null);
    svc.clearHistory();
  }
}

@Component({
  selector: 'iu-cc-story-selected',
  standalone: true,
  imports: [CommunicationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-communication-center />`,
})
class WrapperTemplateSelected {
  constructor() {
    const svc = inject(CommunicationCenterStateService);
    svc.clearHistory();
    svc.selectTemplate('denuncia_contrato_arrendamento');
    svc.setPlaceholder('nomeInquilino', 'João Silva');
    svc.setPlaceholder('morada', 'Rua das Flores 12, 2.º Esq., 1200-101 Lisboa');
    svc.setPlaceholder('dataDenuncia', '2026-05-02');
    svc.setPlaceholder('dataEfeito', '2027-05-02');
    svc.setPlaceholder('fundamento', 'necessidade de habitação própria pelo senhorio');
  }
}

@Component({
  selector: 'iu-cc-story-history',
  standalone: true,
  imports: [CommunicationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-communication-center />`,
})
class WrapperWithHistory {
  constructor() {
    const svc = inject(CommunicationCenterStateService);
    svc.clearHistory();

    svc.selectTemplate('aviso_aumento_renda');
    svc.setPlaceholder('nomeInquilino', 'Maria Costa');
    svc.setPlaceholder('morada', 'Av. da República 45, 4.º Dto., 1050-187 Lisboa');
    svc.setPlaceholder('rendaActual', '850');
    svc.setPlaceholder('rendaNova', '885,30');
    svc.setPlaceholder('mesEfeito', 'Junho 2026');
    svc.setPlaceholder('coeficiente', '1,0415');
    svc.send();

    svc.selectTemplate('confirmacao_visita');
    svc.setPlaceholder('nomeVisitante', 'Pedro Antunes');
    svc.setPlaceholder('morada', 'Rua Augusta 200, 3.º, 1100-053 Lisboa');
    svc.setPlaceholder('dataVisita', '2026-05-08');
    svc.setPlaceholder('horaVisita', '18:30');
    svc.copyToClipboard();

    svc.selectTemplate('notificacao_obras');
    svc.setPlaceholder('nomeInquilino', 'João Silva');
    svc.setPlaceholder('morada', 'Rua das Flores 12, 2.º Esq.');
    svc.setPlaceholder('naturezaObras', 'substituição da caldeira de aquecimento central');
    svc.setPlaceholder('dataInicio', '2026-05-20');
    svc.setPlaceholder('duracaoEstimada', '3 dias úteis');
    svc.send();
  }
}

const meta: Meta = {
  title: 'Sprint 042/CommunicationCenter',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'UI consumer for `LandlordCommunicationTemplatesService`. Two-column layout: ' +
          'sidebar lists templates by category (lease/rent/deposit/works/visits), main pane ' +
          'lets the landlord fill placeholders and previews the body live, with send/copy ' +
          'actions and a local history. Built only with `--md-sys-*` tokens (no `@material/web`).',
      },
    },
  },
};

export default meta;

/** Initial state — no template chosen. */
export const Default: StoryObj = {
  render: () => ({ template: `<iu-cc-story-default />` }),
  decorators: [moduleMetadata({ imports: [WrapperDefault] })],
};

/** Lease termination ("denúncia") template fully filled and ready to send. */
export const TemplateSelected: StoryObj = {
  render: () => ({ template: `<iu-cc-story-selected />` }),
  decorators: [moduleMetadata({ imports: [WrapperTemplateSelected] })],
};

/** Three previously-dispatched messages stacked in history (sent + copied). */
export const WithHistory: StoryObj = {
  render: () => ({ template: `<iu-cc-story-history />` }),
  decorators: [moduleMetadata({ imports: [WrapperWithHistory] })],
};
