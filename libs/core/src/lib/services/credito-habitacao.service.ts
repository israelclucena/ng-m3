import { Injectable, signal, computed } from '@angular/core';

/** Indexante used as base rate for variable-rate mortgages. */
export type MortgageIndexante = 'euribor3m' | 'euribor6m' | 'euribor12m' | 'taxaFixa';

/** Default Euribor refs (May 2026 placeholders, override-able via signal). */
export const PT_EURIBOR_DEFAULTS: Readonly<Record<Exclude<MortgageIndexante, 'taxaFixa'>, number>> = {
  euribor3m: 0.021,
  euribor6m: 0.023,
  euribor12m: 0.025,
};

/** A single row of the amortization schedule. */
export interface AmortizationRow {
  readonly mes: number;
  readonly capitalInicial: number;
  readonly juros: number;
  readonly amortizacao: number;
  readonly capitalFinal: number;
  readonly prestacao: number;
}

/**
 * Crédito Habitação (PT mortgage) simulator state.
 *
 * Computes monthly instalment via Price formula, TAEG approximation
 * (incl. seguros), total paid, total interest and a partial amortization
 * schedule (first 12 months + last 12 months). Pure signals.
 */
@Injectable({ providedIn: 'root' })
export class CreditoHabitacaoService {
  /** Property value (EUR). */
  readonly valorImovel = signal<number>(250_000);
  /** Down payment (EUR). */
  readonly entrada = signal<number>(50_000);
  /** Loan term in years. */
  readonly prazoAnos = signal<number>(30);
  /** Indexante choice. */
  readonly indexante = signal<MortgageIndexante>('euribor6m');
  /** Spread above indexante (decimal, e.g. 0.01 = 1.0%). */
  readonly spread = signal<number>(0.01);
  /** Manual override for the indexante value (decimal). */
  readonly valorIndexanteOverride = signal<number | null>(null);
  /** Fixed-rate TAN when indexante = 'taxaFixa' (decimal). */
  readonly tanFixa = signal<number>(0.035);
  /** Monthly life-insurance premium (EUR). */
  readonly seguroVidaMensal = signal<number>(25);
  /** Monthly multi-risk insurance premium (EUR). */
  readonly seguroMultirriscosMensal = signal<number>(15);

  /** Loan principal financed (property − down payment). */
  readonly capitalFinanciado = computed<number>(() =>
    Math.max(0, round2(this.valorImovel() - this.entrada())),
  );

  /** Loan-to-value ratio (decimal). */
  readonly lvr = computed<number>(() => {
    const v = this.valorImovel();
    if (v <= 0) return 0;
    return round4(this.capitalFinanciado() / v);
  });

  /** Effective TAN applied (annual nominal rate). */
  readonly taxaAplicavel = computed<number>(() => {
    const idx = this.indexante();
    if (idx === 'taxaFixa') return Math.max(0, this.tanFixa());
    const override = this.valorIndexanteOverride();
    const base = override !== null && Number.isFinite(override) && override >= 0
      ? override
      : PT_EURIBOR_DEFAULTS[idx];
    return Math.max(0, round4(base + this.spread()));
  });

  /** Number of months in the loan term. */
  readonly meses = computed<number>(() => Math.max(1, Math.round(this.prazoAnos() * 12)));

  /** Monthly instalment via Price formula. */
  readonly prestacaoMensal = computed<number>(() => {
    const c = this.capitalFinanciado();
    const i = this.taxaAplicavel() / 12;
    const n = this.meses();
    if (c <= 0) return 0;
    if (i === 0) return round2(c / n);
    const factor = Math.pow(1 + i, n);
    return round2((c * i * factor) / (factor - 1));
  });

  /** Monthly cost incl. mandatory insurance premiums. */
  readonly prestacaoMensalTotal = computed<number>(() =>
    round2(this.prestacaoMensal() + this.seguroVidaMensal() + this.seguroMultirriscosMensal()),
  );

  /** Total amount paid over the full term (incl. insurances). */
  readonly totalPagoNoFinal = computed<number>(() =>
    round2(this.prestacaoMensalTotal() * this.meses()),
  );

  /** Total interest paid (excludes insurances). */
  readonly totalJuros = computed<number>(() =>
    round2(this.prestacaoMensal() * this.meses() - this.capitalFinanciado()),
  );

  /**
   * TAEG approximation: solves for the monthly rate that matches the total
   * cost (instalment + insurances) against the financed capital. Uses
   * Newton-Raphson with safe fallback. Returns annualised rate.
   */
  readonly taeg = computed<number>(() => {
    const c = this.capitalFinanciado();
    const totalMonthly = this.prestacaoMensalTotal();
    const n = this.meses();
    if (c <= 0 || totalMonthly <= 0) return 0;
    let rate = this.taxaAplicavel() / 12;
    if (!Number.isFinite(rate) || rate <= 0) rate = 0.001;
    for (let iter = 0; iter < 60; iter++) {
      const f = pricePresentValue(rate, n, totalMonthly) - c;
      const fPrime = pricePresentValueDerivative(rate, n, totalMonthly);
      if (!Number.isFinite(fPrime) || fPrime === 0) break;
      const next = rate - f / fPrime;
      if (!Number.isFinite(next) || next <= 0) break;
      if (Math.abs(next - rate) < 1e-9) {
        rate = next;
        break;
      }
      rate = next;
    }
    return round4(rate * 12);
  });

  /** First-12-months amortization rows. */
  readonly tabelaPrimeirosMeses = computed<readonly AmortizationRow[]>(() =>
    buildSchedule(this.capitalFinanciado(), this.taxaAplicavel(), this.meses(), this.prestacaoMensal())
      .slice(0, 12),
  );

  /** Last-12-months amortization rows. */
  readonly tabelaUltimosMeses = computed<readonly AmortizationRow[]>(() => {
    const n = this.meses();
    const rows = buildSchedule(this.capitalFinanciado(), this.taxaAplicavel(), n, this.prestacaoMensal());
    return rows.slice(Math.max(0, n - 12));
  });

  setValorImovel(v: number): void {
    this.valorImovel.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setEntrada(v: number): void {
    this.entrada.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setPrazoAnos(v: number): void {
    this.prazoAnos.set(Number.isFinite(v) && v > 0 ? v : 1);
  }

  setIndexante(v: MortgageIndexante): void {
    this.indexante.set(v);
  }

  setSpread(v: number): void {
    this.spread.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setValorIndexanteOverride(v: number | null): void {
    this.valorIndexanteOverride.set(v);
  }

  setTanFixa(v: number): void {
    this.tanFixa.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  reset(): void {
    this.valorImovel.set(250_000);
    this.entrada.set(50_000);
    this.prazoAnos.set(30);
    this.indexante.set('euribor6m');
    this.spread.set(0.01);
    this.valorIndexanteOverride.set(null);
    this.tanFixa.set(0.035);
    this.seguroVidaMensal.set(25);
    this.seguroMultirriscosMensal.set(15);
  }
}

function pricePresentValue(rateMonthly: number, n: number, payment: number): number {
  if (rateMonthly <= 0) return payment * n;
  const factor = Math.pow(1 + rateMonthly, n);
  return (payment * (factor - 1)) / (rateMonthly * factor);
}

function pricePresentValueDerivative(rateMonthly: number, n: number, payment: number): number {
  const eps = 1e-7;
  return (
    pricePresentValue(rateMonthly + eps, n, payment) -
    pricePresentValue(rateMonthly - eps, n, payment)
  ) / (2 * eps);
}

function buildSchedule(
  capital: number,
  taxaAnual: number,
  meses: number,
  prestacao: number,
): readonly AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  if (capital <= 0 || meses <= 0) return rows;
  const i = taxaAnual / 12;
  let saldo = capital;
  for (let m = 1; m <= meses; m++) {
    const juros = round2(saldo * i);
    let amortizacao = round2(prestacao - juros);
    if (m === meses) amortizacao = round2(saldo);
    const capitalFinal = round2(Math.max(0, saldo - amortizacao));
    rows.push({
      mes: m,
      capitalInicial: round2(saldo),
      juros,
      amortizacao,
      capitalFinal,
      prestacao: m === meses ? round2(juros + amortizacao) : prestacao,
    });
    saldo = capitalFinal;
  }
  return rows;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
