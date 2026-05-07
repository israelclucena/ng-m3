import { Injectable, signal, computed } from '@angular/core';
import { PT_IRS_ESCALOES_2026, type IRSEscalao } from './irs-categoria-f.service';

/** Estatuto fiscal do alienante (residente fiscal em PT vs não-residente). */
export type MVResidencia = 'residente' | 'naoResidente';

/** Regime de tributação para mais-valias imobiliárias (residentes apenas). */
export type MVRegime = 'taxaAutonoma28' | 'englobamento';

/** Taxa autónoma fixa para mais-valias imobiliárias (CIRS art. 72.º). */
export const PT_MV_TAXA_AUTONOMA = 0.28;

/** Quota tributável para residentes fiscais em PT (CIRS art. 43.º nº 2). */
export const PT_MV_QUOTA_RESIDENTE = 0.5;

/** Quota tributável para não-residentes (tributação integral, CIRS art. 72.º). */
export const PT_MV_QUOTA_NAO_RESIDENTE = 1.0;

/**
 * Coeficientes de desvalorização monetária aplicáveis ao valor de aquisição
 * de imóveis alienados em 2025/2026, conforme padrão Portaria 314/2024
 * (valores indicativos, simplificados para cálculo de demonstração).
 *
 * O ano-chave aqui é o ano de aquisição. Multiplica-se o valor de aquisição
 * pelo coeficiente para obter o valor de aquisição corrigido pela inflação.
 * Para valores oficiais ano a ano, consultar Portaria publicada em DR.
 */
export const PT_MV_COEFICIENTES_2025: Readonly<Record<number, number>> = {
  1989: 3.06, 1990: 2.74, 1991: 2.43, 1992: 2.25, 1993: 2.07,
  1994: 1.95, 1995: 1.86, 1996: 1.81, 1997: 1.78, 1998: 1.74,
  1999: 1.71, 2000: 1.66, 2001: 1.59, 2002: 1.53, 2003: 1.48,
  2004: 1.45, 2005: 1.41, 2006: 1.37, 2007: 1.34, 2008: 1.30,
  2009: 1.31, 2010: 1.30, 2011: 1.25, 2012: 1.22, 2013: 1.21,
  2014: 1.21, 2015: 1.21, 2016: 1.20, 2017: 1.18, 2018: 1.17,
  2019: 1.16, 2020: 1.15, 2021: 1.13, 2022: 1.05, 2023: 1.02,
  2024: 1.00, 2025: 1.00, 2026: 1.00,
} as const;

/** Janela elegível para despesas de valorização (CIRS art. 51.º al. a)). */
export const PT_MV_VALORIZACAO_ANOS_JANELA = 12;

/**
 * Resultado da comparação por regime para residentes — valores absolutos.
 */
export interface MVComparacaoLinha {
  readonly colecta: number;
  readonly taxaEfectiva: number;
}

/**
 * Calculadora de mais-valias imobiliárias PT (IRS Categoria G — venda de imóvel).
 *
 * Modela:
 * - valor de aquisição corrigido por coeficiente de desvalorização monetária
 *   (Portaria anual);
 * - dedução de encargos com aquisição (IMT, IS, escritura, comissões) e
 *   despesas de valorização nos 12 anos anteriores à alienação;
 * - tributação a 50% para residentes fiscais (CIRS art. 43.º nº 2) ou
 *   integral para não-residentes;
 * - comparação 28% taxa autónoma vs englobamento progressivo nos escalões
 *   IRS 2026 (residentes), recomendando o regime mais favorável.
 *
 * Estimativa indicativa — não modela isenção por reinvestimento em HPP,
 * herdeiros, regime transitório de 1989, ou tributação parcial pré-1989.
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class MaisValiasImobiliariasService {
  /** Valor de realização (preço de venda). */
  readonly valorRealizacao = signal<number>(280_000);
  /** Valor de aquisição original (escritura). */
  readonly valorAquisicao = signal<number>(150_000);
  /** Ano de aquisição (1989+). */
  readonly anoAquisicao = signal<number>(2010);
  /** Encargos com aquisição (IMT + IS + escritura + comissão imobiliária). */
  readonly encargosAquisicao = signal<number>(8_000);
  /** Despesas de valorização nos 12 anos anteriores à alienação. */
  readonly despesasValorizacao = signal<number>(15_000);
  /** Estatuto fiscal do alienante. */
  readonly residencia = signal<MVResidencia>('residente');
  /** Outros rendimentos do agregado para englobamento (residentes). */
  readonly outrosRendimentosEnglobamento = signal<number>(20_000);
  /** Regime fiscal seleccionado (residentes apenas). */
  readonly regime = signal<MVRegime>('taxaAutonoma28');

  /** Coeficiente de desvalorização monetária aplicável ao ano de aquisição. */
  readonly coeficiente = computed<number>(() => {
    const ano = this.anoAquisicao();
    const coef = PT_MV_COEFICIENTES_2025[ano];
    return coef ?? 1;
  });

  /** Valor de aquisição corrigido pelo coeficiente. */
  readonly valorAquisicaoCorrigido = computed<number>(() =>
    round2(this.valorAquisicao() * this.coeficiente()),
  );

  /** Mais-valia bruta = realização − aquisição corrigida − encargos − valorização. */
  readonly maisValiaBruta = computed<number>(() => {
    const mv =
      this.valorRealizacao() -
      this.valorAquisicaoCorrigido() -
      Math.max(0, this.encargosAquisicao()) -
      Math.max(0, this.despesasValorizacao());
    return round2(mv);
  });

  /** Quota tributável (50% residente, 100% não-residente). */
  readonly quotaTributavel = computed<number>(() =>
    this.residencia() === 'residente'
      ? PT_MV_QUOTA_RESIDENTE
      : PT_MV_QUOTA_NAO_RESIDENTE,
  );

  /** Mais-valia tributável (após aplicar a quota). Mínimo 0. */
  readonly maisValiaTributavel = computed<number>(() =>
    round2(Math.max(0, this.maisValiaBruta() * this.quotaTributavel())),
  );

  /** Colecta no regime de taxa autónoma 28% sobre a parte tributável. */
  readonly colectaTaxaAutonoma = computed<number>(() =>
    round2(this.maisValiaTributavel() * PT_MV_TAXA_AUTONOMA),
  );

  /**
   * Colecta no regime de englobamento — aplica a tabela progressiva à fatia
   * de mais-valia tributável, usando outros rendimentos como base para a
   * taxa marginal (residentes apenas).
   */
  readonly colectaEnglobamento = computed<number>(() => {
    if (this.residencia() === 'naoResidente') {
      return this.colectaTaxaAutonoma();
    }
    const tributavel = this.maisValiaTributavel();
    const outros = Math.max(0, this.outrosRendimentosEnglobamento());
    return round2(applyProgressiveIncremental(outros, tributavel, PT_IRS_ESCALOES_2026));
  });

  /**
   * Regime mais favorável. Para não-residentes só existe taxa autónoma 28%.
   */
  readonly melhorRegime = computed<MVRegime>(() => {
    if (this.residencia() === 'naoResidente') return 'taxaAutonoma28';
    return this.colectaEnglobamento() < this.colectaTaxaAutonoma()
      ? 'englobamento'
      : 'taxaAutonoma28';
  });

  /** Diferença absoluta entre os dois regimes (potencial poupança). */
  readonly poupanca = computed<number>(() =>
    round2(Math.abs(this.colectaTaxaAutonoma() - this.colectaEnglobamento())),
  );

  /** Colecta efectiva no regime actualmente seleccionado. */
  readonly colectaActual = computed<number>(() => {
    if (this.residencia() === 'naoResidente') return this.colectaTaxaAutonoma();
    return this.regime() === 'taxaAutonoma28'
      ? this.colectaTaxaAutonoma()
      : this.colectaEnglobamento();
  });

  /** Líquido recebido após imposto = realização − colecta actual. */
  readonly liquidoAposImposto = computed<number>(() =>
    round2(this.valorRealizacao() - this.colectaActual()),
  );

  /** Taxa efectiva sobre a mais-valia tributável. */
  readonly taxaEfectiva = computed<number>(() => {
    const t = this.maisValiaTributavel();
    if (t <= 0) return 0;
    return round4(this.colectaActual() / t);
  });

  /** Comparação side-by-side entre regimes (residentes). */
  readonly comparacao = computed(() => {
    const tributavel = this.maisValiaTributavel();
    const ta = this.colectaTaxaAutonoma();
    const en = this.colectaEnglobamento();
    return {
      taxaAutonoma: <MVComparacaoLinha>{
        colecta: ta,
        taxaEfectiva: tributavel > 0 ? round4(ta / tributavel) : 0,
      },
      englobamento: <MVComparacaoLinha>{
        colecta: en,
        taxaEfectiva: tributavel > 0 ? round4(en / tributavel) : 0,
      },
    };
  });

  setValorRealizacao(v: number): void {
    this.valorRealizacao.set(safeNum(v));
  }
  setValorAquisicao(v: number): void {
    this.valorAquisicao.set(safeNum(v));
  }
  setAnoAquisicao(ano: number): void {
    if (!Number.isFinite(ano)) return;
    const clamped = Math.max(1989, Math.min(2026, Math.round(ano)));
    this.anoAquisicao.set(clamped);
  }
  setEncargos(v: number): void {
    this.encargosAquisicao.set(safeNum(v));
  }
  setValorizacao(v: number): void {
    this.despesasValorizacao.set(safeNum(v));
  }
  setOutrosRendimentos(v: number): void {
    this.outrosRendimentosEnglobamento.set(safeNum(v));
  }
  setResidencia(r: MVResidencia): void {
    this.residencia.set(r);
    if (r === 'naoResidente') this.regime.set('taxaAutonoma28');
  }
  setRegime(r: MVRegime): void {
    if (this.residencia() === 'naoResidente') return;
    this.regime.set(r);
  }

  reset(): void {
    this.valorRealizacao.set(280_000);
    this.valorAquisicao.set(150_000);
    this.anoAquisicao.set(2010);
    this.encargosAquisicao.set(8_000);
    this.despesasValorizacao.set(15_000);
    this.residencia.set('residente');
    this.outrosRendimentosEnglobamento.set(20_000);
    this.regime.set('taxaAutonoma28');
  }
}

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

function safeNum(v: number): number {
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
