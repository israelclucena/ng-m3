import { Injectable, signal, computed } from '@angular/core';
import {
  PT_IMT_HPP_2026,
  PT_IMT_OUTROS_2026,
  PT_IMT_JOVEM_LIMITE,
  PT_IS_IMOVEL,
  type IMTEscalao,
  type IMTFinalidade,
  type IMTResidencia,
} from './imt.service';
import {
  PT_MV_COEFICIENTES_2025,
  PT_MV_QUOTA_RESIDENTE,
  PT_MV_QUOTA_NAO_RESIDENTE,
  PT_MV_TAXA_AUTONOMA,
  type MVResidencia,
} from './mais-valias-imobiliarias.service';

/**
 * Lump-sum breakdown line for IMT progressive brackets.
 */
export interface TransactionBracketLine {
  readonly escalao: string;
  readonly base: number;
  readonly taxa: number;
  readonly colecta: number;
}

/**
 * Side-by-side breakdown returned by the meta-consumer.
 */
export interface TransactionBreakdown {
  readonly buyer: {
    readonly imt: number;
    readonly is: number;
    readonly notarioRegisto: number;
    readonly totalImpostos: number;
    readonly custoTotal: number;
    readonly taxaEfectivaSobrePreco: number;
    readonly bracketLines: readonly TransactionBracketLine[];
    readonly jovemIsento: boolean;
  };
  readonly seller: {
    readonly valorAquisicaoCorrigido: number;
    readonly maisValiaBruta: number;
    readonly maisValiaTributavel: number;
    readonly colectaIRS: number;
    readonly liquidoRecebido: number;
    readonly taxaEfectivaSobrePreco: number;
  };
  readonly delta: {
    readonly fricaoTotal: number;
    readonly fricaoSobrePreco: number;
  };
}

/**
 * Property Transaction Cost calculator — meta-consumer combining IMT (buyer)
 * and Mais-Valias Imobiliárias (seller) on a single transaction. Computes
 * buyer's all-in acquisition cost (IMT + IS + notário/registo) and seller's
 * net proceeds (preço − IRS Cat. G colecta), exposing the friction delta.
 *
 * Reuses constants from `IMTService` and `MaisValiasImobiliariasService`
 * without mutating them — keeps each calculator independent.
 *
 * Pure signals — no RxJS. Sprint 052.
 */
@Injectable({ providedIn: 'root' })
export class PropertyTransactionCostService {
  /** Negotiated sale price (EUR) — drives both sides. */
  readonly precoVenda = signal<number>(280_000);

  // ─── Buyer side ──────────────────────────────────────────────────────
  readonly buyerFinalidade = signal<IMTFinalidade>('hpp');
  readonly buyerResidencia = signal<IMTResidencia>('residente');
  readonly buyerJovem = signal<boolean>(false);
  /** Combined notário + registo predial fixed cost (EUR). */
  readonly custoNotarioRegisto = signal<number>(500);

  // ─── Seller side ─────────────────────────────────────────────────────
  readonly sellerValorAquisicaoOriginal = signal<number>(150_000);
  readonly sellerAnoAquisicao = signal<number>(2010);
  readonly sellerEncargosAquisicao = signal<number>(8_000);
  readonly sellerDespesasValorizacao = signal<number>(15_000);
  readonly sellerResidencia = signal<MVResidencia>('residente');

  // ─── Buyer computeds ─────────────────────────────────────────────────

  readonly buyerJovemIsento = computed<boolean>(() =>
    this.buyerJovem() &&
    this.buyerResidencia() === 'residente' &&
    this.buyerFinalidade() === 'hpp' &&
    this.precoVenda() <= PT_IMT_JOVEM_LIMITE,
  );

  readonly buyerTabela = computed<readonly IMTEscalao[]>(() =>
    this.buyerFinalidade() === 'hpp' ? PT_IMT_HPP_2026 : PT_IMT_OUTROS_2026,
  );

  readonly buyerBracketLines = computed<readonly TransactionBracketLine[]>(() => {
    if (this.buyerJovemIsento()) return [];
    const valor = Math.max(0, this.precoVenda());
    if (valor === 0) return [];
    const lines: TransactionBracketLine[] = [];
    let remaining = valor;
    let prevTop = 0;
    for (const esc of this.buyerTabela()) {
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

  readonly buyerIMT = computed<number>(() =>
    round2(this.buyerBracketLines().reduce((s, l) => s + l.colecta, 0)),
  );

  readonly buyerIS = computed<number>(() =>
    round2(Math.max(0, this.precoVenda()) * PT_IS_IMOVEL),
  );

  readonly buyerTotalImpostos = computed<number>(() =>
    round2(this.buyerIMT() + this.buyerIS()),
  );

  readonly buyerCustoTotal = computed<number>(() =>
    round2(
      Math.max(0, this.precoVenda()) +
        this.buyerTotalImpostos() +
        Math.max(0, this.custoNotarioRegisto()),
    ),
  );

  readonly buyerTaxaEfectiva = computed<number>(() => {
    const preco = this.precoVenda();
    if (preco <= 0) return 0;
    return round4((this.buyerTotalImpostos() + this.custoNotarioRegisto()) / preco);
  });

  // ─── Seller computeds ────────────────────────────────────────────────

  readonly sellerCoeficiente = computed<number>(() => {
    const ano = this.sellerAnoAquisicao();
    return PT_MV_COEFICIENTES_2025[ano] ?? 1;
  });

  readonly sellerValorAquisicaoCorrigido = computed<number>(() =>
    round2(Math.max(0, this.sellerValorAquisicaoOriginal()) * this.sellerCoeficiente()),
  );

  readonly sellerMaisValiaBruta = computed<number>(() => {
    const mv =
      this.precoVenda() -
      this.sellerValorAquisicaoCorrigido() -
      Math.max(0, this.sellerEncargosAquisicao()) -
      Math.max(0, this.sellerDespesasValorizacao());
    return round2(mv);
  });

  readonly sellerQuotaTributavel = computed<number>(() =>
    this.sellerResidencia() === 'residente'
      ? PT_MV_QUOTA_RESIDENTE
      : PT_MV_QUOTA_NAO_RESIDENTE,
  );

  readonly sellerMaisValiaTributavel = computed<number>(() =>
    round2(Math.max(0, this.sellerMaisValiaBruta()) * this.sellerQuotaTributavel()),
  );

  /** Colecta IRS Cat. G (uses taxa autónoma 28% — englobamento out of scope here). */
  readonly sellerColectaIRS = computed<number>(() =>
    round2(this.sellerMaisValiaTributavel() * PT_MV_TAXA_AUTONOMA),
  );

  readonly sellerLiquidoRecebido = computed<number>(() =>
    round2(Math.max(0, this.precoVenda()) - this.sellerColectaIRS()),
  );

  readonly sellerTaxaEfectiva = computed<number>(() => {
    const preco = this.precoVenda();
    if (preco <= 0) return 0;
    return round4(this.sellerColectaIRS() / preco);
  });

  // ─── Delta ───────────────────────────────────────────────────────────

  /** Total transaction friction (buyer pays − seller nets), in EUR. */
  readonly fricaoTotal = computed<number>(() =>
    round2(this.buyerCustoTotal() - this.sellerLiquidoRecebido()),
  );

  readonly fricaoSobrePreco = computed<number>(() => {
    const preco = this.precoVenda();
    if (preco <= 0) return 0;
    return round4(this.fricaoTotal() / preco);
  });

  /** Aggregated side-by-side breakdown for UI consumption. */
  readonly breakdown = computed<TransactionBreakdown>(() => ({
    buyer: {
      imt: this.buyerIMT(),
      is: this.buyerIS(),
      notarioRegisto: Math.max(0, this.custoNotarioRegisto()),
      totalImpostos: this.buyerTotalImpostos(),
      custoTotal: this.buyerCustoTotal(),
      taxaEfectivaSobrePreco: this.buyerTaxaEfectiva(),
      bracketLines: this.buyerBracketLines(),
      jovemIsento: this.buyerJovemIsento(),
    },
    seller: {
      valorAquisicaoCorrigido: this.sellerValorAquisicaoCorrigido(),
      maisValiaBruta: this.sellerMaisValiaBruta(),
      maisValiaTributavel: this.sellerMaisValiaTributavel(),
      colectaIRS: this.sellerColectaIRS(),
      liquidoRecebido: this.sellerLiquidoRecebido(),
      taxaEfectivaSobrePreco: this.sellerTaxaEfectiva(),
    },
    delta: {
      fricaoTotal: this.fricaoTotal(),
      fricaoSobrePreco: this.fricaoSobrePreco(),
    },
  }));

  // ─── Setters with input sanitisation ─────────────────────────────────

  setPrecoVenda(v: number): void { this.precoVenda.set(safeNum(v)); }
  setBuyerFinalidade(f: IMTFinalidade): void {
    this.buyerFinalidade.set(f);
    if (f !== 'hpp') this.buyerJovem.set(false);
  }
  setBuyerResidencia(r: IMTResidencia): void {
    this.buyerResidencia.set(r);
    if (r === 'naoResidente') this.buyerJovem.set(false);
  }
  setBuyerJovem(b: boolean): void {
    if (b && (this.buyerFinalidade() !== 'hpp' || this.buyerResidencia() !== 'residente')) return;
    this.buyerJovem.set(b);
  }
  setCustoNotarioRegisto(v: number): void { this.custoNotarioRegisto.set(safeNum(v)); }
  setSellerValorAquisicaoOriginal(v: number): void { this.sellerValorAquisicaoOriginal.set(safeNum(v)); }
  setSellerAnoAquisicao(y: number): void {
    if (!Number.isFinite(y)) return;
    this.sellerAnoAquisicao.set(Math.max(1989, Math.min(2026, Math.round(y))));
  }
  setSellerEncargosAquisicao(v: number): void { this.sellerEncargosAquisicao.set(safeNum(v)); }
  setSellerDespesasValorizacao(v: number): void { this.sellerDespesasValorizacao.set(safeNum(v)); }
  setSellerResidencia(r: MVResidencia): void { this.sellerResidencia.set(r); }

  reset(): void {
    this.precoVenda.set(280_000);
    this.buyerFinalidade.set('hpp');
    this.buyerResidencia.set('residente');
    this.buyerJovem.set(false);
    this.custoNotarioRegisto.set(500);
    this.sellerValorAquisicaoOriginal.set(150_000);
    this.sellerAnoAquisicao.set(2010);
    this.sellerEncargosAquisicao.set(8_000);
    this.sellerDespesasValorizacao.set(15_000);
    this.sellerResidencia.set('residente');
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
