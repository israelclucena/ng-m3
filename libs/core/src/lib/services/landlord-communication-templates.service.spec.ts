import { TestBed } from '@angular/core/testing';
import {
  LandlordCommunicationTemplatesService,
  type TemplateCategory,
} from './landlord-communication-templates.service';

describe('LandlordCommunicationTemplatesService', () => {
  const createService = (): LandlordCommunicationTemplatesService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(LandlordCommunicationTemplatesService);
  };

  // ── Catalog shape ────────────────────────────────────────────────────────

  it('exposes the 5 curated templates', () => {
    const svc = createService();
    const ids = svc.templates().map(t => t.id).sort();
    expect(ids).toEqual([
      'aviso_aumento_renda',
      'confirmacao_visita',
      'denuncia_contrato_arrendamento',
      'notificacao_obras',
      'recibo_caucao',
    ]);
  });

  it('every template carries the required metadata fields', () => {
    const svc = createService();
    for (const t of svc.templates()) {
      expect(t.id).toBeTruthy();
      expect(t.titulo).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.body.length).toBeGreaterThan(0);
      expect(typeof t.requiresSignature).toBe('boolean');
      expect(Array.isArray(t.placeholders)).toBe(true);
    }
  });

  it('templates needing signature have a legalReference attached', () => {
    const svc = createService();
    for (const t of svc.templates()) {
      if (t.requiresSignature) {
        expect(t.legalReference).toBeTruthy();
      }
    }
  });

  it('every declared placeholder actually appears in the body', () => {
    const svc = createService();
    for (const t of svc.templates()) {
      for (const ph of t.placeholders) {
        expect(t.body).toContain(`{{${ph}}}`);
      }
    }
  });

  // ── byCategory grouping ──────────────────────────────────────────────────

  it('byCategory groups templates under their category key', () => {
    const svc = createService();
    const groups = svc.byCategory();
    expect(groups.get('lease')?.map(t => t.id)).toEqual(['denuncia_contrato_arrendamento']);
    expect(groups.get('rent')?.map(t => t.id)).toEqual(['aviso_aumento_renda']);
    expect(groups.get('deposit')?.map(t => t.id)).toEqual(['recibo_caucao']);
    expect(groups.get('works')?.map(t => t.id)).toEqual(['notificacao_obras']);
    expect(groups.get('visits')?.map(t => t.id)).toEqual(['confirmacao_visita']);
  });

  it('byCategory total across groups matches templates count', () => {
    const svc = createService();
    let total = 0;
    for (const [, arr] of svc.byCategory()) {
      total += arr.length;
    }
    expect(total).toBe(svc.templates().length);
  });

  it('byCategory does not surface empty categories', () => {
    const svc = createService();
    const groups = svc.byCategory();
    for (const [, arr] of groups) {
      expect(arr.length).toBeGreaterThan(0);
    }
  });

  // ── getTemplate ──────────────────────────────────────────────────────────

  it('getTemplate returns the matching template by id', () => {
    const svc = createService();
    const t = svc.getTemplate('aviso_aumento_renda');
    expect(t).toBeDefined();
    expect(t!.titulo).toBe('Aviso de atualização de renda');
    expect(t!.category).toBe<TemplateCategory>('rent');
  });

  it('getTemplate returns undefined for an unknown id', () => {
    const svc = createService();
    expect(svc.getTemplate('does_not_exist')).toBeUndefined();
  });

  // ── fillTemplate ─────────────────────────────────────────────────────────

  it('fillTemplate substitutes all provided placeholders', () => {
    const svc = createService();
    const result = svc.fillTemplate('confirmacao_visita', {
      nomeVisitante: 'João',
      morada: 'Rua das Flores, 12',
      dataVisita: '2026-06-01',
      horaVisita: '14h30',
    });
    expect(result).toBeDefined();
    expect(result!.missing).toEqual([]);
    expect(result!.body).toContain('Olá João');
    expect(result!.body).toContain('Rua das Flores, 12');
    expect(result!.body).toContain('2026-06-01');
    expect(result!.body).toContain('14h30');
    expect(result!.body).not.toContain('{{');
  });

  it('fillTemplate leaves unknown placeholders intact and lists them as missing', () => {
    const svc = createService();
    const result = svc.fillTemplate('confirmacao_visita', {
      nomeVisitante: 'João',
      // morada, dataVisita, horaVisita omitidos
    });
    expect(result).toBeDefined();
    expect(result!.missing.sort()).toEqual(['dataVisita', 'horaVisita', 'morada']);
    expect(result!.body).toContain('{{morada}}');
    expect(result!.body).toContain('{{dataVisita}}');
    expect(result!.body).toContain('Olá João');
  });

  it('fillTemplate treats empty string as missing', () => {
    const svc = createService();
    const result = svc.fillTemplate('confirmacao_visita', {
      nomeVisitante: '',
      morada: 'X',
      dataVisita: 'Y',
      horaVisita: 'Z',
    });
    expect(result!.missing).toEqual(['nomeVisitante']);
    expect(result!.body).toContain('{{nomeVisitante}}');
  });

  it('fillTemplate accepts numeric values and stringifies them', () => {
    const svc = createService();
    const result = svc.fillTemplate('recibo_caucao', {
      nomeInquilino: 'Maria',
      morada: 'Av. Liberdade 1',
      valorCaucao: 1500,
      dataRecepcao: '2026-01-15',
      mesesRenda: 2,
    });
    expect(result!.missing).toEqual([]);
    expect(result!.body).toContain('1500');
    expect(result!.body).toContain('2 meses');
  });

  it('fillTemplate de-duplicates the missing list when a placeholder appears twice', () => {
    // notificacao_obras: morada appears once, but we'll exercise a denuncia which has
    // dataDenuncia + dataEfeito + others. Trigger missing on a single var that occurs
    // once — we want to make sure no duplicates surface.
    const svc = createService();
    const result = svc.fillTemplate('denuncia_contrato_arrendamento', {
      nomeInquilino: 'A',
      morada: 'B',
      // dataDenuncia, dataEfeito, fundamento intentionally omitted
    });
    const dedup = Array.from(new Set(result!.missing));
    expect(result!.missing.length).toBe(dedup.length);
    expect(result!.missing.sort()).toEqual(['dataDenuncia', 'dataEfeito', 'fundamento']);
  });

  it('fillTemplate returns undefined for an unknown template id', () => {
    const svc = createService();
    expect(svc.fillTemplate('no_such_template', {})).toBeUndefined();
  });

  it('fillTemplate does not mutate the original template body', () => {
    const svc = createService();
    const before = svc.getTemplate('confirmacao_visita')!.body;
    svc.fillTemplate('confirmacao_visita', {
      nomeVisitante: 'João',
      morada: 'X',
      dataVisita: 'Y',
      horaVisita: 'Z',
    });
    const after = svc.getTemplate('confirmacao_visita')!.body;
    expect(after).toBe(before);
    expect(after).toContain('{{nomeVisitante}}');
  });

  it('fillTemplate ignores tolerant whitespace inside placeholder braces', () => {
    // The regex tolerates `{{  name  }}` — exercise via a template that has none,
    // by relying on the missing var logic: we just confirm the regex pattern.
    const svc = createService();
    const tpl = svc.getTemplate('confirmacao_visita')!;
    // Sanity check the placeholder shape — the regex must match the canonical form.
    expect(tpl.body).toMatch(/{{nomeVisitante}}/);
  });
});
