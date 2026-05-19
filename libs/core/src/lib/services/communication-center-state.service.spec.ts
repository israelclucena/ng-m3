import { TestBed } from '@angular/core/testing';
import { CommunicationCenterStateService } from './communication-center-state.service';
import {
  LandlordCommunicationTemplatesService,
  type CommunicationTemplate,
  type CommunicationVars,
} from './landlord-communication-templates.service';

describe('CommunicationCenterStateService', () => {
  let service: CommunicationCenterStateService;
  let templatesStub: jest.Mocked<Pick<LandlordCommunicationTemplatesService, 'getTemplate' | 'fillTemplate'>>;

  const tplA: CommunicationTemplate = {
    id: 'tpl-a',
    titulo: 'Template A',
    category: 'rent',
    requiresSignature: false,
    placeholders: ['nome', 'morada'],
    body: 'Olá {{nome}}, sobre {{morada}}.',
  };

  const tplB: CommunicationTemplate = {
    id: 'tpl-b',
    titulo: 'Template B',
    category: 'visits',
    requiresSignature: true,
    placeholders: ['data'],
    body: 'Visita marcada para {{data}}.',
  };

  beforeEach(() => {
    templatesStub = {
      getTemplate: jest.fn((id: string) =>
        id === 'tpl-a' ? tplA : id === 'tpl-b' ? tplB : undefined,
      ),
      fillTemplate: jest.fn((id: string, vars: CommunicationVars) => {
        const tpl = id === 'tpl-a' ? tplA : id === 'tpl-b' ? tplB : undefined;
        if (!tpl) return undefined;
        const missing: string[] = [];
        let body = tpl.body;
        for (const key of tpl.placeholders) {
          const v = vars[key];
          if (v === undefined || v === null || v === '') {
            missing.push(key);
          } else {
            body = body.replace(`{{${key}}}`, String(v));
          }
        }
        return { body, missing };
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LandlordCommunicationTemplatesService, useValue: templatesStub },
      ],
    });
    service = TestBed.inject(CommunicationCenterStateService);
  });

  it('starts with no template selected and empty state', () => {
    expect(service.selectedTemplateId()).toBeNull();
    expect(service.currentTemplate()).toBeUndefined();
    expect(service.filledResult()).toBeUndefined();
    expect(service.filledBody()).toBe('');
    expect(service.missingPlaceholders()).toEqual([]);
    expect(service.canSend()).toBe(false);
    expect(service.historyEntries()).toEqual([]);
  });

  it('selectTemplate sets the current template and clears placeholder values', () => {
    service.setPlaceholder('nome', 'leftover');
    service.selectTemplate('tpl-a');
    expect(service.selectedTemplateId()).toBe('tpl-a');
    expect(service.currentTemplate()).toBe(tplA);
    expect(service.placeholderValues()).toEqual({});
  });

  it('selectTemplate(null) clears the selection', () => {
    service.selectTemplate('tpl-a');
    service.selectTemplate(null);
    expect(service.selectedTemplateId()).toBeNull();
    expect(service.currentTemplate()).toBeUndefined();
  });

  it('setPlaceholder updates one key without dropping the others', () => {
    service.setPlaceholder('nome', 'Israel');
    service.setPlaceholder('morada', 'Rua Augusta');
    expect(service.placeholderValues()).toEqual({ nome: 'Israel', morada: 'Rua Augusta' });
    service.setPlaceholder('nome', 'Maria');
    expect(service.placeholderValues()).toEqual({ nome: 'Maria', morada: 'Rua Augusta' });
  });

  it('exposes missing placeholders while incomplete and clears them once filled', () => {
    service.selectTemplate('tpl-a');
    expect(service.missingPlaceholders()).toEqual(['nome', 'morada']);
    expect(service.canSend()).toBe(false);

    service.setPlaceholder('nome', 'Israel');
    expect(service.missingPlaceholders()).toEqual(['morada']);
    expect(service.canSend()).toBe(false);

    service.setPlaceholder('morada', 'Lisboa');
    expect(service.missingPlaceholders()).toEqual([]);
    expect(service.filledBody()).toBe('Olá Israel, sobre Lisboa.');
    expect(service.canSend()).toBe(true);
  });

  it('send() returns undefined and does not record history when not ready', () => {
    expect(service.send()).toBeUndefined();
    service.selectTemplate('tpl-a');
    service.setPlaceholder('nome', 'Israel'); // morada ainda em falta
    expect(service.send()).toBeUndefined();
    expect(service.historyEntries()).toEqual([]);
  });

  it('send() appends a sent entry with the filled body', () => {
    service.selectTemplate('tpl-a');
    service.setPlaceholder('nome', 'Israel');
    service.setPlaceholder('morada', 'Lisboa');

    const entry = service.send();
    expect(entry).toBeDefined();
    expect(entry!.mode).toBe('sent');
    expect(entry!.templateId).toBe('tpl-a');
    expect(entry!.templateTitle).toBe('Template A');
    expect(entry!.body).toBe('Olá Israel, sobre Lisboa.');
    expect(entry!.sentAt).toBeInstanceOf(Date);
    expect(service.historyEntries()).toHaveLength(1);
    expect(service.historyEntries()[0]).toBe(entry);
  });

  it('copyToClipboard() appends a copied entry without writing to the clipboard', () => {
    service.selectTemplate('tpl-b');
    service.setPlaceholder('data', '2026-06-01');

    const entry = service.copyToClipboard();
    expect(entry).toBeDefined();
    expect(entry!.mode).toBe('copied');
    expect(entry!.templateId).toBe('tpl-b');
    expect(entry!.body).toBe('Visita marcada para 2026-06-01.');
    expect(service.historyEntries()).toHaveLength(1);
  });

  it('history is most-recent-first', () => {
    service.selectTemplate('tpl-a');
    service.setPlaceholder('nome', 'Ana');
    service.setPlaceholder('morada', 'Porto');
    const first = service.send()!;

    service.selectTemplate('tpl-b');
    service.setPlaceholder('data', '2026-07-10');
    const second = service.copyToClipboard()!;

    expect(service.historyEntries()).toEqual([second, first]);
  });

  it('generates unique ids across consecutive entries', () => {
    service.selectTemplate('tpl-b');
    service.setPlaceholder('data', 'X');
    const a = service.send()!;
    const b = service.copyToClipboard()!;
    expect(a.id).not.toEqual(b.id);
  });

  it('clearHistory empties the history but keeps current draft', () => {
    service.selectTemplate('tpl-b');
    service.setPlaceholder('data', '2026-07-10');
    service.send();
    expect(service.historyEntries()).toHaveLength(1);

    service.clearHistory();
    expect(service.historyEntries()).toEqual([]);
    expect(service.selectedTemplateId()).toBe('tpl-b');
    expect(service.placeholderValues()).toEqual({ data: '2026-07-10' });
    expect(service.canSend()).toBe(true);
  });
});
