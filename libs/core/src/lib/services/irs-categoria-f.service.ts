import { Injectable, signal, computed } from '@angular/core';

/** PT IRS regime selection for Categoria F (rendimentos prediais). */
export type IRSCatFRegime = 'taxaAutonoma28' | 'englobamento';

/** PT IRS escalões 2026 (taxas marginais por escalão). Reference AT. */
export interface IRSEscalao {
  readonly upTo: number;
  readonly taxa: number;
  readonly label: string;
}

export const PT_IRS_ESCALOES_2026: readonly IRSEscalao[] = [
  { upTo: 8059,   taxa: 0.13,   label: '≤ 8.059€ · 13%' },
  { upTo: 12160,  taxa: 0.165,  label: '≤ 12.160€ · 16,5%' },
  { upTo: 17233,  taxa: 0.22,   label: '≤ 17.233€ · 22%' },
  { upTo: 22305,  taxa: 0.25,   label: '≤ 22.305€ · 25%' },
  { upTo: 28400,  taxa: 0.32,   label: '≤ 28.400€ · 32%' },
  { upTo: 41629,  taxa: 0.355,  label: '≤ 41.629€ · 35,5%' },
  { upTo: 44987,  taxa: 0.435,  label: '≤ 44.987€ · 43,5%' },
  { upTo: 83696,  taxa: 0.45,   label: '≤ 83.696€ · 45%' },
  { upTo: Number.POSITIVE_INFINITY, taxa: 0.48, label: '> 83.696€ · 48%' },
] as const;

/** Taxa autónoma fixa para Categoria F (CIRS art. 72.º). */
export const PT_IRS_TAXA_AUTONOMA_CAT_F = 0.28;

/**
 * IRS Categoria F (rendimentos prediais) calculator state.
 *
 * Compares the 28% taxa autónoma vs englobamento at progressive scales,
 * using PT IRS escalões 2026, deductible expenses (manutenção, condomínio,
 * IMI, seguro, juros mortgage) and recommends the cheaper regime.
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class IRSCategoriaFService {
  /** Renda bruta anual (EUR). */
  readonly rendimentoBrutoAnual = signal<number>(12_000);
  /** Despesas dedutíveis comprovadas (EUR/ano). */
  readonly despesasDedutiveis = signal<number>(2_000);
  /** Outros rendimentos do agregado (Cat A, B, etc.) usados para englobamento. */
  readonly outrosRendimentosEnglobamento = signal<number>(0);
  /** Number of dependants in household (informational only here). */
  readonly agregadoFamiliar = signal<number>(0);
  /** Selected regime — recomendado por defeito o melhor. */
  readonly regime = signal<IRSCatFRegime>('taxaAutonoma28');

  /** Rendimento líquido = bruto − despesas (mínimo 0). */
  readonly rendimentoLiquido = computed<number>(() =>
    Math.max(0, round2(this.rendimentoBrutoAnual() - this.despesasDedutiveis())),
  );

  /** Colecta no regime de taxa autónoma 28%. */
  readonly colectaTaxaAutonoma = computed<number>(() =>
    round2(this.rendimentoLiquido() * PT_IRS_TAXA_AUTONOMA_CAT_F),
  );

  /**
   * Colecta no regime de englobamento — incremental: aplica a tabela progressiva
   * apenas ao rendimento líquido Cat F (assume outros rendimentos já tributados),
   * usando como base a soma com outrosRendimentosEnglobamento para encontrar a taxa marginal.
   */
  readonly colectaEnglobamento = computed<number>(() => {
    const liq = this.rendimentoLiquido();
    const outros = Math.max(0, this.outrosRendimentosEnglobamento());
    return round2(applyProgressiveIncremental(outros, liq, PT_IRS_ESCALOES_2026));
  });

  /** Recomenda o regime que paga menos imposto. */
  readonly melhorRegime = computed<IRSCatFRegime>(() =>
    this.colectaEnglobamento() < this.colectaTaxaAutonoma()
      ? 'englobamento'
      : 'taxaAutonoma28',
  );

  /** Poupança ao escolher o melhor regime versus o pior. */
  readonly poupanca = computed<number>(() =>
    round2(Math.abs(this.colectaTaxaAutonoma() - this.colectaEnglobamento())),
  );

  /** Colecta efectiva no regime actualmente seleccionado. */
  readonly colectaActual = computed<number>(() =>
    this.regime() === 'taxaAutonoma28'
      ? this.colectaTaxaAutonoma()
      : this.colectaEnglobamento(),
  );

  /** Taxa efectiva sobre o líquido no regime actual. */
  readonly taxaEfectiva = computed<number>(() => {
    const liq = this.rendimentoLiquido();
    if (liq <= 0) return 0;
    return round4(this.colectaActual() / liq);
  });

  /** Comparação side-by-side ambos regimes. */
  readonly comparacao = computed(() => ({
    taxaAutonoma: {
      colecta: this.colectaTaxaAutonoma(),
      taxaEfectiva: this.rendimentoLiquido() > 0
        ? round4(this.colectaTaxaAutonoma() / this.rendimentoLiquido())
        : 0,
    },
    englobamento: {
      colecta: this.colectaEnglobamento(),
      taxaEfectiva: this.rendimentoLiquido() > 0
        ? round4(this.colectaEnglobamento() / this.rendimentoLiquido())
        : 0,
    },
  }));

  setRendimentoBruto(v: number): void {
    this.rendimentoBrutoAnual.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setDespesas(v: number): void {
    this.despesasDedutiveis.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setOutrosRendimentos(v: number): void {
    this.outrosRendimentosEnglobamento.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setRegime(r: IRSCatFRegime): void {
    this.regime.set(r);
  }

  reset(): void {
    this.rendimentoBrutoAnual.set(12_000);
    this.despesasDedutiveis.set(2_000);
    this.outrosRendimentosEnglobamento.set(0);
    this.agregadoFamiliar.set(0);
    this.regime.set('taxaAutonoma28');
  }
}

/**
 * Applies a progressive bracket table on the slice [base, base+amount],
 * returning the additional tax due for that slice. Models marginal-rate
 * stacking: lower brackets are assumed paid by `base`, only the increment
 * is charged at the slice's marginal rate.
 */
function applyProgressiveIncremental(
  base: number,
  amount: number,
  brackets: readonly IRSEscalao[],
): number {
  if (amount <= 0) return 0;
  let remaining = amount;
  let cursor = base;
  let prevTop = 0;
  let total = 0;
  for (const b of brackets) {
    const bracketWidth = b.upTo - prevTop;
    const positionInBracket = Math.max(0, cursor - prevTop);
    const room = Math.max(0, bracketWidth - positionInBracket);
    if (cursor + remaining <= b.upTo) {
      total += remaining * b.taxa;
      return total;
    }
    if (room > 0) {
      total += room * b.taxa;
      remaining -= room;
      cursor += room;
    }
    prevTop = b.upTo;
    if (remaining <= 0) return total;
  }
  return total;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
