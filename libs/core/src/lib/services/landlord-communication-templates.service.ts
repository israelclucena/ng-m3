import { Injectable, computed, signal } from '@angular/core';

/** Bucket grouping templates by intent. */
export type TemplateCategory =
  | 'lease'         // contract lifecycle (denúncia, renovação)
  | 'rent'          // rent updates / arrears
  | 'deposit'       // caução interactions
  | 'works'         // works / maintenance notices
  | 'visits';       // viewings, inspections

/**
 * Re-usable PT landlord communication template.
 *
 * `body` may include `{{placeholders}}` matching {@link CommunicationVars}.
 * `legalReference` cites the underlying NRAU article when applicable.
 */
export interface CommunicationTemplate {
  readonly id: string;
  readonly titulo: string;
  readonly category: TemplateCategory;
  readonly body: string;
  readonly requiresSignature: boolean;
  readonly legalReference?: string;
  /** Placeholders the template expects, in `{{name}}` form (without braces). */
  readonly placeholders: ReadonlyArray<string>;
}

/** Variable bag passed to {@link LandlordCommunicationTemplatesService.fillTemplate}. */
export type CommunicationVars = Record<string, string | number>;

/**
 * Curated PT-aligned message presets for landlords.
 *
 * Sources of legal references: NRAU (Lei 6/2006 + revisões 2019/2023),
 * Decreto-Lei 82/2024 (rendas habitacionais).
 */
const TEMPLATES: ReadonlyArray<CommunicationTemplate> = [
  {
    id: 'denuncia_contrato_arrendamento',
    titulo: 'Denúncia de contrato de arrendamento',
    category: 'lease',
    requiresSignature: true,
    legalReference: 'NRAU art. 1101.º (denúncia pelo senhorio)',
    placeholders: ['nomeInquilino', 'morada', 'dataDenuncia', 'dataEfeito', 'fundamento'],
    body:
`Exmo./a. Sr./a. {{nomeInquilino}},

Pela presente, na qualidade de senhorio do imóvel sito em {{morada}}, comunico
formalmente a denúncia do contrato de arrendamento celebrado, nos termos do
art. 1101.º do Código Civil (NRAU), com a antecedência mínima legalmente
exigida.

Fundamento: {{fundamento}}.

Data da comunicação: {{dataDenuncia}}.
Data prevista para cessação efetiva: {{dataEfeito}}.

Solicito a entrega do imóvel devoluto, com restituição das chaves, na data
acima indicada.

Atentamente,`,
  },
  {
    id: 'aviso_aumento_renda',
    titulo: 'Aviso de atualização de renda',
    category: 'rent',
    requiresSignature: true,
    legalReference: 'NRAU art. 1077.º (atualização ordinária)',
    placeholders: ['nomeInquilino', 'morada', 'rendaActual', 'rendaNova', 'mesEfeito', 'coeficiente'],
    body:
`Exmo./a. Sr./a. {{nomeInquilino}},

Em cumprimento do disposto no art. 1077.º do Código Civil e da Portaria
anual publicada em Diário da República, comunico a atualização ordinária da
renda do imóvel sito em {{morada}}.

Renda atual: {{rendaActual}} €
Renda atualizada: {{rendaNova}} €
Coeficiente aplicado: {{coeficiente}}
Início de produção de efeitos: {{mesEfeito}}

A presente comunicação é feita com a antecedência mínima de 30 dias
legalmente exigida.

Atentamente,`,
  },
  {
    id: 'recibo_caucao',
    titulo: 'Recibo de receção de caução',
    category: 'deposit',
    requiresSignature: true,
    legalReference: 'NRAU art. 1076.º + art. 13.º DL 82/2024',
    placeholders: ['nomeInquilino', 'morada', 'valorCaucao', 'dataRecepcao', 'mesesRenda'],
    body:
`Declaro, na qualidade de senhorio do imóvel sito em {{morada}}, ter recebido
do inquilino {{nomeInquilino}} a quantia de {{valorCaucao}} € a título de
caução, correspondente a {{mesesRenda}} meses de renda.

Esta caução fica retida durante a vigência do contrato e será devolvida no
termo do mesmo, descontadas as eventuais deduções devidamente justificadas
(art. 13.º DL 82/2024).

Data de receção: {{dataRecepcao}}.

Atentamente,`,
  },
  {
    id: 'notificacao_obras',
    titulo: 'Notificação de obras no imóvel',
    category: 'works',
    requiresSignature: false,
    legalReference: 'NRAU art. 1074.º (obras a cargo do senhorio)',
    placeholders: ['nomeInquilino', 'morada', 'naturezaObras', 'dataInicio', 'duracaoEstimada'],
    body:
`Exmo./a. Sr./a. {{nomeInquilino}},

Informo que serão realizadas obras no imóvel sito em {{morada}}, com a
seguinte natureza: {{naturezaObras}}.

Data prevista de início: {{dataInicio}}.
Duração estimada: {{duracaoEstimada}}.

Solicito a sua disponibilidade para acesso ao imóvel durante o período
indicado. As obras estão a cargo do senhorio nos termos do art. 1074.º do
Código Civil.

Atentamente,`,
  },
  {
    id: 'confirmacao_visita',
    titulo: 'Confirmação de visita ao imóvel',
    category: 'visits',
    requiresSignature: false,
    placeholders: ['nomeVisitante', 'morada', 'dataVisita', 'horaVisita'],
    body:
`Olá {{nomeVisitante}},

Confirmo a sua visita ao imóvel sito em {{morada}} para o dia {{dataVisita}}
às {{horaVisita}}.

Caso necessite reagendar, por favor avise-me com pelo menos 24h de
antecedência.

Cumprimentos,`,
  },
];

const PLACEHOLDER_RE = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

/**
 * Read-only library of PT landlord communication presets.
 *
 * Designed to be consumed by other UI surfaces (NotificationCenter,
 * MessagingModule, future CommunicationCenter). Service-only — no component.
 */
@Injectable({ providedIn: 'root' })
export class LandlordCommunicationTemplatesService {
  private readonly _templates = signal<ReadonlyArray<CommunicationTemplate>>(TEMPLATES);

  /** All available templates. */
  readonly templates = this._templates.asReadonly();

  /** Templates grouped by category. */
  readonly byCategory = computed(() => {
    const groups = new Map<TemplateCategory, CommunicationTemplate[]>();
    for (const t of this._templates()) {
      const arr = groups.get(t.category) ?? [];
      arr.push(t);
      groups.set(t.category, arr);
    }
    return groups;
  });

  /** Returns the template with that id, or `undefined`. */
  getTemplate(id: string): CommunicationTemplate | undefined {
    return this._templates().find(t => t.id === id);
  }

  /**
   * Substitute `{{var}}` placeholders in the template body with `vars`.
   * Unknown variables are left as-is (so missing vars are visible to the user)
   * and listed in the returned `missing` array.
   */
  fillTemplate(id: string, vars: CommunicationVars): { body: string; missing: string[] } | undefined {
    const tpl = this.getTemplate(id);
    if (!tpl) return undefined;
    const missing: string[] = [];
    const body = tpl.body.replace(PLACEHOLDER_RE, (match, key: string) => {
      if (vars[key] === undefined || vars[key] === null || vars[key] === '') {
        if (!missing.includes(key)) missing.push(key);
        return match;
      }
      return String(vars[key]);
    });
    return { body, missing };
  }
}
