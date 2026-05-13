/**
 * @fileoverview AnnualPropertyTaxBurdenService — Sprint 053
 *
 * Service meta-consumer cruzando, para um único ano fiscal e ao nível
 * portfolio, os quatro impostos prediais portugueses:
 *
 *  - IMI (anual recorrente · VPT × taxa concelho)
 *  - AIMI (anual recorrente · escalões progressivos sobre VPT agregado − dedução)
 *  - IRS Cat. F (anual recorrente · renda líquida; regime per-property)
 *  - Mais-Valias Imobiliárias (event-driven · só se houve disposição no ano)
 *
 * Complementa `PortfolioTaxLifecycleWidgetComponent` (Sprint 049) com duas
 * coisas que o widget não dá:
 *
 *   1. Output service-shaped (não componente) — consumível por qualquer
 *      outro widget, página ou worker downstream.
 *   2. Calendário explícito de pagamentos com `Date` reais por ano fiscal
 *      (IMI 31 Mai/31 Ago/30 Nov; AIMI 30 Set; IRS Cat. F Mar-Jun janela).
 *
 * Cálculo puro com constantes exportadas (`PT_AIMI_*`, `PT_IRS_*`,
 * `PT_MV_*`) — não muta nenhum singleton de calculator.
 *
 * Feature flag: `ANNUAL_TAX_BURDEN_AGGREGATOR`.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  PortfolioMockService,
  type PortfolioProperty,
} from './portfolio-mock.service';
import {
  PT_AIMI_DEDUCAO_SINGULAR,
  PT_AIMI_TAXAS_2026,
} from './aimi.service';
import {
  PT_IRS_ESCALOES_2026,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
} from './irs-categoria-f.service';
import {
  PT_MV_QUOTA_RESIDENTE,
  PT_MV_QUOTA_NAO_RESIDENTE,
  PT_MV_TAXA_AUTONOMA,
} from './mais-valias-imobiliarias.service';

const MAINTENANCE_RATE = 0.005;

/** A property disposition (sale) within a fiscal year. */
export interface PropertyDisposition {
  /** Property id (from `PortfolioMockService`). */
  readonly propertyId: string;
  /** Selling price (EUR). */
  readonly salePrice: number;
  /** ISO date (YYYY-MM-DD) on which the deed was signed. */
  readonly saleDate: string;
  /** Defaults to `residente` (50% tributável). */
  readonly residencia?: 'residente' | 'nao-residente';
}

/** Per-property breakdown of recurring annual burden. */
export interface PropertyBurdenLine {
  readonly property: PortfolioProperty;
  readonly imi: number;
  readonly aimiShare: number;
  readonly irs: number;
  readonly totalAnnual: number;
}

/** A single line in the disposition (mais-valias) breakdown. */
export interface DispositionBurdenLine {
  readonly disposition: PropertyDisposition;
  readonly property: PortfolioProperty;
  readonly maisValiaBruta: number;
  readonly tributavel: number;
  readonly colecta: number;
  readonly liquido: number;
}

/**
 * A scheduled payment for the fiscal year. `kind` allows downstream UIs
 * to colour-code (recurring vs one-shot) and group by category.
 */
export interface TaxCalendarEvent {
  readonly id: string;
  readonly kind: 'imi' | 'aimi' | 'irs' | 'mais-valias';
  readonly label: string;
  /** Concrete date this payment falls due. */
  readonly date: Date;
  /** Amount due on this date (EUR). */
  readonly amount: number;
  /** Free-text note (e.g. "1ª prestação", "Janela Modelo 3"). */
  readonly note?: string;
}

/** Final aggregate output of `annualBurden(year)`. */
export interface AnnualBurdenResult {
  readonly year: number;
  readonly imi: number;
  readonly aimi: number;
  readonly irsF: number;
  readonly maisValias: number;
  readonly total: number;
  readonly perProperty: readonly PropertyBurdenLine[];
  readonly dispositions: readonly DispositionBurdenLine[];
  readonly calendarEvents: readonly TaxCalendarEvent[];
}

/**
 * Service-shaped meta-consumer of the four PT real-estate annual taxes.
 *
 * Input state:
 *  - `year`: fiscal year being modelled
 *  - `dispositions`: optional sales within the year (drives mais-valias)
 *
 * Output: {@link AnnualBurdenResult} as a `computed` signal, plus a
 * call-style `annualBurden(year, dispositions)` for ad-hoc invocations.
 */
@Injectable({ providedIn: 'root' })
export class AnnualPropertyTaxBurdenService {
  private readonly portfolio = inject(PortfolioMockService);

  /** Fiscal year being modelled. */
  readonly year = signal<number>(new Date().getFullYear());
  /** Optional dispositions (sales) within the year. */
  readonly dispositions = signal<readonly PropertyDisposition[]>([]);

  /** Reactive view of the current year + dispositions. */
  readonly result = computed<AnnualBurdenResult>(() =>
    this.compute(this.year(), this.dispositions()),
  );

  /**
   * Compute the annual burden for an arbitrary year + disposition list
   * without mutating service state. Used by consumers that need a one-shot
   * projection (e.g. "what would 2027 look like?").
   */
  annualBurden(
    year: number,
    dispositions: readonly PropertyDisposition[] = [],
  ): AnnualBurdenResult {
    return this.compute(year, dispositions);
  }

  /** Update the fiscal year. */
  setYear(year: number): void {
    if (!Number.isFinite(year)) return;
    this.year.set(Math.trunc(year));
  }

  /** Replace the disposition list. */
  setDispositions(items: readonly PropertyDisposition[]): void {
    this.dispositions.set(items);
  }

  /** Reset to current year + no dispositions. */
  reset(): void {
    this.year.set(new Date().getFullYear());
    this.dispositions.set([]);
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private compute(
    year: number,
    dispositions: readonly PropertyDisposition[],
  ): AnnualBurdenResult {
    const properties = this.portfolio.properties();
    const vptTotal = properties.reduce((acc, p) => acc + p.vpt, 0);
    const aimiExcess = Math.max(0, vptTotal - PT_AIMI_DEDUCAO_SINGULAR);
    const aimi = aimiExcess > 0 ? progressive(aimiExcess, PT_AIMI_TAXAS_2026) : 0;

    const perProperty: PropertyBurdenLine[] = properties.map((p) => {
      const imi = p.vpt * p.imiTaxRate;
      const aimiShare = aimiExcess > 0 && vptTotal > 0
        ? aimi * (Math.max(0, p.vpt) / vptTotal)
        : 0;
      const irs = irsCatF(p);
      return {
        property: p,
        imi,
        aimiShare,
        irs,
        totalAnnual: imi + aimiShare + irs,
      };
    });

    const totalIMI = perProperty.reduce((s, l) => s + l.imi, 0);
    const totalIRS = perProperty.reduce((s, l) => s + l.irs, 0);

    const dispLines: DispositionBurdenLine[] = [];
    for (const d of dispositions) {
      const prop = this.portfolio.byId(d.propertyId);
      if (!prop) continue;
      const maisValiaBruta = Math.max(0, d.salePrice - prop.acquisitionValue);
      const quota = d.residencia === 'nao-residente'
        ? PT_MV_QUOTA_NAO_RESIDENTE
        : PT_MV_QUOTA_RESIDENTE;
      const tributavel = maisValiaBruta * quota;
      const colecta = tributavel * PT_MV_TAXA_AUTONOMA;
      dispLines.push({
        disposition: d,
        property: prop,
        maisValiaBruta,
        tributavel,
        colecta,
        liquido: d.salePrice - colecta,
      });
    }
    const totalMV = dispLines.reduce((s, l) => s + l.colecta, 0);

    const total = totalIMI + aimi + totalIRS + totalMV;

    return {
      year,
      imi: totalIMI,
      aimi,
      irsF: totalIRS,
      maisValias: totalMV,
      total,
      perProperty,
      dispositions: dispLines,
      calendarEvents: buildCalendar(year, totalIMI, aimi, totalIRS, dispLines),
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the dated payment calendar for a fiscal year. Order:
 *
 *  - IRS Cat. F window opens 2026-04-01 (Modelo 3) — modelled as the 30/Jun
 *    deadline single event with full collecta.
 *  - IMI: AT splits annually based on `colecta`:
 *      - ≤ 100€  : 31/Mai (1 prestação)
 *      - ≤ 500€  : 31/Mai + 30/Nov (2 prestações)
 *      - > 500€  : 31/Mai + 31/Ago + 30/Nov (3 prestações)
 *  - AIMI: 30/Set (1 prestação anual).
 *  - Mais-Valias: liquidação na nota de IRS — usamos 30/Jun do ano seguinte
 *    como deadline indicativa, agrupando todas as dispositions.
 */
function buildCalendar(
  year: number,
  imi: number,
  aimi: number,
  irsF: number,
  dispositions: readonly DispositionBurdenLine[],
): TaxCalendarEvent[] {
  const events: TaxCalendarEvent[] = [];

  if (irsF > 0) {
    events.push({
      id: `irs-${year}`,
      kind: 'irs',
      label: 'IRS Cat. F · Modelo 3 (deadline)',
      date: new Date(Date.UTC(year + 1, 5, 30)),
      amount: irsF,
      note: 'Janela 1 Abr–30 Jun do ano seguinte',
    });
  }

  if (imi > 0) {
    const imiSchedule = splitIMI(imi);
    imiSchedule.forEach((slice, i) => {
      const months = [5 - 1, 8 - 1, 11 - 1]; // May, Aug, Nov
      const days = [31, 31, 30];
      // Sequential mapping: 1 prestação → Mai; 2 → Mai+Nov (skip Aug);
      // 3 → Mai+Ago+Nov.
      const idxMap = imiSchedule.length === 1 ? [0]
                   : imiSchedule.length === 2 ? [0, 2]
                   : [0, 1, 2];
      const idx = idxMap[i];
      events.push({
        id: `imi-${year}-${i + 1}`,
        kind: 'imi',
        label: `IMI · ${i + 1}ª prestação`,
        date: new Date(Date.UTC(year, months[idx], days[idx])),
        amount: slice,
        note: `Total IMI ano ${year}: €${imi.toFixed(2)}`,
      });
    });
  }

  if (aimi > 0) {
    events.push({
      id: `aimi-${year}`,
      kind: 'aimi',
      label: 'AIMI · prestação única',
      date: new Date(Date.UTC(year, 8, 30)), // 30 Set
      amount: aimi,
    });
  }

  if (dispositions.length > 0) {
    const mvTotal = dispositions.reduce((s, d) => s + d.colecta, 0);
    events.push({
      id: `mv-${year}`,
      kind: 'mais-valias',
      label: `Mais-Valias · ${dispositions.length} disposição(ões)`,
      date: new Date(Date.UTC(year + 1, 5, 30)),
      amount: mvTotal,
      note: 'Liquidação na nota de IRS (ano seguinte)',
    });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

/**
 * AT (Autoridade Tributária) split rule for IMI in 2026:
 *   - ≤ 100€  → 1 prestação
 *   - ≤ 500€  → 2 prestações
 *   - > 500€  → 3 prestações
 * Returns slices in payment order (largest residue absorbed into last slice).
 */
function splitIMI(total: number): number[] {
  if (total <= 100) return [total];
  if (total <= 500) {
    const half = round2(total / 2);
    return [half, round2(total - half)];
  }
  const third = round2(total / 3);
  return [third, third, round2(total - 2 * third)];
}

function progressive(
  amount: number,
  brackets: readonly { upTo: number; taxa: number }[],
): number {
  if (amount <= 0) return 0;
  let remaining = amount;
  let prevTop = 0;
  let total = 0;
  for (const b of brackets) {
    const slice = Math.min(remaining, b.upTo - prevTop);
    if (slice > 0) {
      total += slice * b.taxa;
      remaining -= slice;
    }
    prevTop = b.upTo;
    if (remaining <= 0) break;
  }
  return total;
}

function irsCatF(p: PortfolioProperty): number {
  const rendimentoBruto = p.lease.monthlyRent * 12;
  const imi = p.vpt * p.imiTaxRate;
  const manutencao = p.marketValue * MAINTENANCE_RATE;
  const liquido = Math.max(
    0,
    rendimentoBruto - imi - manutencao - p.annualDeductibleExpenses,
  );
  if (p.irsRegime === 'taxaAutonoma28') {
    return liquido * PT_IRS_TAXA_AUTONOMA_CAT_F;
  }
  return progressive(liquido, PT_IRS_ESCALOES_2026);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
