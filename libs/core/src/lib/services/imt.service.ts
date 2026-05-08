import { Injectable, signal, computed } from '@angular/core';

/** Finalidade do imóvel para efeitos de IMT (determina a tabela aplicável). */
export type IMTFinalidade =
  | 'hpp'        // Habitação Própria Permanente
  | 'outros'     // Habitação secundária / arrendamento / investimento
  | 'rural';     // Prédio rústico — taxa fixa 5%

/** Estatuto fiscal do adquirente. */
export type IMTResidencia = 'residente' | 'naoResidente';

/** Item de tabela escalonada IMT (marginal por tranche). */
export interface IMTEscalao {
  /** Limite superior do escalão (em euros). +Infinity para o último. */
  readonly upTo: number;
  /** Taxa marginal aplicável dentro do escalão. */
  readonly taxa: number;
  /** Etiqueta humana ("Até €101.917"). */
  readonly label: string;
}

/**
 * Tabela IMT 2026 — Habitação Própria Permanente (HPP).
 * Primeira tranche isenta. Valores baseados em Portaria 2025/atualização 2026.
 */
export const PT_IMT_HPP_2026: readonly IMTEscalao[] = [
  { upTo: 101_917, taxa: 0.00, label: 'Até €101.917' },
  { upTo: 139_412, taxa: 0.02, label: '€101.917–€139.412' },
  { upTo: 190_086, taxa: 0.05, label: '€139.412–€190.086' },
  { upTo: 316_772, taxa: 0.07, label: '€190.086–€316.772' },
  { upTo: 633_453, taxa: 0.08, label: '€316.772–€633.453' },
  { upTo: Number.POSITIVE_INFINITY, taxa: 0.075, label: 'Acima de €633.453' },
] as const;

/**
 * Tabela IMT 2026 — Habitação para outros fins (secundária, arrendamento, investimento).
 * Sem tranche isenta. 1ª tranche pequena a 1%.
 */
export const PT_IMT_OUTROS_2026: readonly IMTEscalao[] = [
  { upTo: 101_917, taxa: 0.01, label: 'Até €101.917' },
  { upTo: 139_412, taxa: 0.02, label: '€101.917–€139.412' },
  { upTo: 190_086, taxa: 0.05, label: '€139.412–€190.086' },
  { upTo: 316_772, taxa: 0.07, label: '€190.086–€316.772' },
  { upTo: 607_528, taxa: 0.08, label: '€316.772–€607.528' },
  { upTo: Number.POSITIVE_INFINITY, taxa: 0.075, label: 'Acima de €607.528' },
] as const;

/** Taxa fixa para prédios rústicos (CIMT art. 17.º). */
export const PT_IMT_TAXA_RURAL = 0.05;

/** Limite máximo de isenção para jovens (1ª habitação até 35 anos), 2026. */
export const PT_IMT_JOVEM_LIMITE = 316_772;

/** Imposto de Selo na compra de imóvel (CIS verba 1.1) — sempre 0.8%. */
export const PT_IS_IMOVEL = 0.008;

/** Linha de breakdown do cálculo IMT por escalão. */
export interface IMTBreakdownLinha {
  readonly escalao: string;
  readonly base: number;
  readonly taxa: number;
  readonly colecta: number;
}

/**
 * Calculadora IMT (Imposto Municipal sobre Transmissões Onerosas) PT.
 *
 * Modela:
 * - tabelas escalonadas 2026 para HPP (com tranche isenta até ~€101.917)
 *   vs outros fins (sem isenção, 1% inicial);
 * - taxa fixa 5% para prédios rústicos;
 * - isenção total para jovens (1ª habitação até 35 anos) até €316.772;
 * - não-residentes pagam à mesma tabela mas sem benefícios jovens;
 * - Imposto de Selo 0.8% sobre o valor de aquisição (sempre devido).
 *
 * Estimativa indicativa — não modela isenção de reabilitação urbana, regimes
 * concelhios específicos (zonas de pressão urbanística), ou aquisições
 * inter vivos por permuta. Confirmar com Finanças.
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class IMTService {
  /** Valor de aquisição (escritura ou VPT, o maior — CIMT art. 12.º). */
  readonly valorAquisicao = signal<number>(280_000);
  /** Finalidade do imóvel. */
  readonly finalidade = signal<IMTFinalidade>('hpp');
  /** Estatuto fiscal do adquirente. */
  readonly residencia = signal<IMTResidencia>('residente');
  /** Adquirente jovem com 1ª habitação (under-35 com HPP). */
  readonly jovemPrimeiraHabitacao = signal<boolean>(false);

  /** Indica se o adquirente beneficia da isenção jovens 2026. */
  readonly elegivelJovem = computed<boolean>(() =>
    this.jovemPrimeiraHabitacao() &&
    this.residencia() === 'residente' &&
    this.finalidade() === 'hpp' &&
    this.valorAquisicao() <= PT_IMT_JOVEM_LIMITE,
  );

  /** Tabela escalonada activa (HPP / Outros / Rural). */
  readonly tabela = computed<readonly IMTEscalao[]>(() => {
    if (this.finalidade() === 'rural') {
      return [{ upTo: Number.POSITIVE_INFINITY, taxa: PT_IMT_TAXA_RURAL, label: 'Rústico · taxa fixa' }];
    }
    return this.finalidade() === 'hpp' ? PT_IMT_HPP_2026 : PT_IMT_OUTROS_2026;
  });

  /** Breakdown por escalão (vazio se isenção jovens). */
  readonly breakdown = computed<readonly IMTBreakdownLinha[]>(() => {
    if (this.elegivelJovem()) return [];
    const valor = Math.max(0, this.valorAquisicao());
    if (valor === 0) return [];
    const lines: IMTBreakdownLinha[] = [];
    let remaining = valor;
    let prevTop = 0;
    for (const esc of this.tabela()) {
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

  /** Colecta IMT (soma das linhas, ou 0 se isenção). */
  readonly imt = computed<number>(() =>
    round2(this.breakdown().reduce((acc, l) => acc + l.colecta, 0)),
  );

  /** Imposto de Selo (sempre devido, 0.8% sobre valor de aquisição). */
  readonly is = computed<number>(() =>
    round2(Math.max(0, this.valorAquisicao()) * PT_IS_IMOVEL),
  );

  /** Total tributação na compra = IMT + IS. */
  readonly total = computed<number>(() => round2(this.imt() + this.is()));

  /** Taxa efectiva total sobre o valor de aquisição. */
  readonly taxaEfectiva = computed<number>(() => {
    const valor = this.valorAquisicao();
    if (valor <= 0) return 0;
    return round4(this.total() / valor);
  });

  /** Caption descritiva do regime activo. */
  readonly regimeCaption = computed<string>(() => {
    if (this.elegivelJovem()) return 'Isenção jovens 2026 (até 35 anos · 1ª habitação · até €316.772)';
    if (this.finalidade() === 'rural') return 'Prédio rústico · taxa fixa 5%';
    if (this.finalidade() === 'hpp') return 'Habitação Própria Permanente · tabela escalonada com isenção até €101.917';
    return 'Habitação outros fins · tabela escalonada sem tranche isenta';
  });

  setValorAquisicao(v: number): void {
    this.valorAquisicao.set(safeNum(v));
  }
  setFinalidade(f: IMTFinalidade): void {
    this.finalidade.set(f);
    if (f !== 'hpp') this.jovemPrimeiraHabitacao.set(false);
  }
  setResidencia(r: IMTResidencia): void {
    this.residencia.set(r);
    if (r === 'naoResidente') this.jovemPrimeiraHabitacao.set(false);
  }
  setJovem(b: boolean): void {
    if (b && (this.finalidade() !== 'hpp' || this.residencia() !== 'residente')) return;
    this.jovemPrimeiraHabitacao.set(b);
  }

  reset(): void {
    this.valorAquisicao.set(280_000);
    this.finalidade.set('hpp');
    this.residencia.set('residente');
    this.jovemPrimeiraHabitacao.set(false);
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
