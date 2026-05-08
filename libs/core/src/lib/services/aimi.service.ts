import { Injectable, signal, computed } from '@angular/core';

/** Tipo de titular para efeitos de AIMI. */
export type AIMITitular = 'singular' | 'conjunto' | 'sociedade';

/** Item de portfolio elegível para AIMI (apenas urbano habitacional + terreno construção). */
export interface AIMIPropriedade {
  /** Identificador estável (matricial ou interno). */
  readonly id: string;
  /** Etiqueta amigável (ex: "T2 Lisboa Avenidas"). */
  readonly label: string;
  /** Valor Patrimonial Tributário (VPT) em euros. */
  readonly vpt: number;
}

/** Escalão progressivo de AIMI para titulares singulares (após dedução). */
export interface AIMIEscalao {
  /** Limite superior do escalão (em euros, após dedução). +Infinity para o último. */
  readonly upTo: number;
  /** Taxa marginal aplicável dentro do escalão. */
  readonly taxa: number;
  /** Etiqueta humana ("€600k–€1M"). */
  readonly label: string;
}

/** Dedução AIMI 2026 — titular singular (CIMI art. 135.º-C nº 1). */
export const PT_AIMI_DEDUCAO_SINGULAR = 600_000;

/** Dedução AIMI 2026 — casal com opção pela tributação conjunta (CIMI art. 135.º-D). */
export const PT_AIMI_DEDUCAO_CONJUNTO = 1_200_000;

/** Taxa fixa AIMI para sociedades (CIMI art. 135.º-F nº 1). */
export const PT_AIMI_TAXA_SOCIEDADE = 0.004;

/**
 * Tabela progressiva AIMI 2026 para titulares singulares e casais
 * (CIMI art. 135.º-F nº 2). Cada tranche aplica-se ao excesso da soma
 * de VPTs sobre a dedução.
 */
export const PT_AIMI_TAXAS_2026: readonly AIMIEscalao[] = [
  { upTo: 1_000_000, taxa: 0.007, label: 'Até €1M' },
  { upTo: 2_000_000, taxa: 0.010, label: '€1M–€2M' },
  { upTo: Number.POSITIVE_INFINITY, taxa: 0.015, label: 'Acima de €2M' },
] as const;

/** Linha de breakdown por escalão. */
export interface AIMIBreakdownLinha {
  readonly escalao: string;
  readonly base: number;
  readonly taxa: number;
  readonly colecta: number;
}

/**
 * Calculadora AIMI (Adicional ao Imposto Municipal sobre Imóveis) PT.
 *
 * Modela:
 * - soma de VPTs de imóveis urbanos habitacionais + terrenos para construção;
 * - dedução por titular: €600k singular, €1.2M casal (opção conjunta), 0 sociedades;
 * - taxa progressiva por escalões (0.7% / 1.0% / 1.5%) para singulares e casais;
 * - taxa fixa 0.4% para sociedades.
 *
 * Input shape compatível com `PortfolioMockService` (Sprint 045) — pode receber
 * uma lista derivada de propriedades reais via `setPropriedades()`. Estado
 * default usa portfolio fictício de 3 imóveis para demonstração.
 *
 * Estimativa indicativa — não modela isenções por reabilitação urbana, prédios
 * devolutos com majoração, herança indivisa, ou regimes transitórios.
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class AIMIService {
  /** Lista de propriedades elegíveis. */
  readonly propriedades = signal<readonly AIMIPropriedade[]>([
    { id: 'p1', label: 'T2 Lisboa Avenidas', vpt: 320_000 },
    { id: 'p2', label: 'T3 Cascais', vpt: 480_000 },
    { id: 'p3', label: 'Loja Marvila', vpt: 180_000 },
  ]);

  /** Tipo de titular. */
  readonly titular = signal<AIMITitular>('singular');

  /** VPT total agregado (soma da lista). */
  readonly vptTotal = computed<number>(() =>
    round2(this.propriedades().reduce((acc, p) => acc + Math.max(0, p.vpt), 0)),
  );

  /** Dedução aplicável conforme tipo de titular. */
  readonly deducao = computed<number>(() => {
    switch (this.titular()) {
      case 'singular': return PT_AIMI_DEDUCAO_SINGULAR;
      case 'conjunto': return PT_AIMI_DEDUCAO_CONJUNTO;
      case 'sociedade': return 0;
    }
  });

  /** Base tributável = VPT total menos dedução. Mínimo 0. */
  readonly baseTributavel = computed<number>(() =>
    round2(Math.max(0, this.vptTotal() - this.deducao())),
  );

  /** Breakdown por escalão (singular/conjunto) ou linha única (sociedade). */
  readonly breakdown = computed<readonly AIMIBreakdownLinha[]>(() => {
    if (this.titular() === 'sociedade') {
      const base = this.vptTotal();
      return [
        {
          escalao: 'Sociedade · taxa fixa',
          base,
          taxa: PT_AIMI_TAXA_SOCIEDADE,
          colecta: round2(base * PT_AIMI_TAXA_SOCIEDADE),
        },
      ];
    }
    const lines: AIMIBreakdownLinha[] = [];
    let remaining = this.baseTributavel();
    let prevTop = 0;
    for (const esc of PT_AIMI_TAXAS_2026) {
      if (remaining <= 0) break;
      const width = esc.upTo - prevTop;
      const slice = Math.min(remaining, width);
      lines.push({
        escalao: esc.label,
        base: round2(slice),
        taxa: esc.taxa,
        colecta: round2(slice * esc.taxa),
      });
      remaining -= slice;
      prevTop = esc.upTo;
    }
    return lines;
  });

  /** Colecta total AIMI (soma das linhas do breakdown). */
  readonly colecta = computed<number>(() =>
    round2(this.breakdown().reduce((acc, l) => acc + l.colecta, 0)),
  );

  /** Taxa efectiva sobre o VPT total. */
  readonly taxaEfectiva = computed<number>(() => {
    const total = this.vptTotal();
    if (total <= 0) return 0;
    return round4(this.colecta() / total);
  });

  /** Indica se a posição actual está sujeita a AIMI (base > 0 ou sociedade com VPT > 0). */
  readonly sujeitoAImposto = computed<boolean>(() => {
    if (this.titular() === 'sociedade') return this.vptTotal() > 0;
    return this.baseTributavel() > 0;
  });

  setPropriedades(lista: readonly AIMIPropriedade[]): void {
    this.propriedades.set(
      lista.map((p) => ({
        id: p.id,
        label: p.label,
        vpt: safeNum(p.vpt),
      })),
    );
  }

  setVptDe(id: string, vpt: number): void {
    const safe = safeNum(vpt);
    this.propriedades.update((list) =>
      list.map((p) => (p.id === id ? { ...p, vpt: safe } : p)),
    );
  }

  setTitular(t: AIMITitular): void {
    this.titular.set(t);
  }

  reset(): void {
    this.propriedades.set([
      { id: 'p1', label: 'T2 Lisboa Avenidas', vpt: 320_000 },
      { id: 'p2', label: 'T3 Cascais', vpt: 480_000 },
      { id: 'p3', label: 'Loja Marvila', vpt: 180_000 },
    ]);
    this.titular.set('singular');
  }
}

function safeNum(v: number): number {
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
