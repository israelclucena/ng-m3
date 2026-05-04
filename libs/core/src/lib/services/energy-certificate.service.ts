import { Injectable, signal, computed } from '@angular/core';

/** PT energy certificate classes (ADENE). */
export type EnergyClass = 'A+' | 'A' | 'B' | 'B-' | 'C' | 'D' | 'E' | 'F';

/** Property type for energy cert validation. */
export type EnergyPropertyType = 'habitacao' | 'comercio' | 'servico';

/** kWh/m²/year reference upper bound by class (ADENE). */
export const PT_ENERGY_CLASS_UPPER_KWH: Readonly<Record<EnergyClass, number>> = {
  'A+': 25,
  A: 50,
  B: 100,
  'B-': 150,
  C: 200,
  D: 250,
  E: 350,
  F: Number.POSITIVE_INFINITY,
};

/** Ordered list of classes from best to worst. */
export const PT_ENERGY_CLASS_ORDER: readonly EnergyClass[] = [
  'A+', 'A', 'B', 'B-', 'C', 'D', 'E', 'F',
];

/** PT fine range when listing without valid CE (DL 118/2013 art. 18.º). */
export const PT_CE_FINE_MIN_EUR = 250;
export const PT_CE_FINE_MAX_EUR = 3740;

/**
 * PT Energy Certificate (Certificado Energético / DCR) checker.
 *
 * Validates expiry, computes potential savings (delta vs class A reference),
 * and exposes legal compliance info per DL 118/2013 art. 3.º (mandatory
 * for any sale or rental listing in Portugal since 2013).
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class EnergyCertificateService {
  /** ADENE certificate number. */
  readonly numeroCertificado = signal<string>('CE-2024-1234567');
  /** Current energy class. */
  readonly classe = signal<EnergyClass>('C');
  /** Issue date (ISO yyyy-mm-dd). */
  readonly dataEmissao = signal<string>('2024-06-15');
  /** Validity in years (default 10 for habitação, 6 for serviços/comércio). */
  readonly validadeAnos = signal<number>(10);
  /** Property type. */
  readonly tipoImovel = signal<EnergyPropertyType>('habitacao');
  /** Property usable area (m²) — used in savings estimates. */
  readonly areaM2 = signal<number>(80);
  /** Reference "today" date (ISO yyyy-mm-dd) — defaults to actual today. */
  readonly hoje = signal<string>(toIsoDate(new Date()));

  /** Expiry date (issue + validade) as ISO. */
  readonly dataExpiracao = computed<string>(() => {
    const issued = parseIsoDate(this.dataEmissao());
    if (!issued) return '';
    const exp = new Date(issued);
    exp.setFullYear(exp.getFullYear() + Math.max(0, Math.round(this.validadeAnos())));
    return toIsoDate(exp);
  });

  /** Days remaining until expiry (negative if expired). */
  readonly diasParaExpirar = computed<number>(() => {
    const exp = parseIsoDate(this.dataExpiracao());
    const now = parseIsoDate(this.hoje());
    if (!exp || !now) return 0;
    const diff = exp.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  });

  /** Whether the certificate is still valid (not expired). */
  readonly valido = computed<boolean>(() => this.diasParaExpirar() >= 0);

  /** Always true in PT — DL 118/2013 mandates CE for any listing. */
  readonly obrigatorioParaListing = computed<boolean>(() => true);

  /**
   * Estimated annual savings vs class A reference, in kWh/year, using
   * the upper bound of the current class (conservative). Returns 0 for A+.
   */
  readonly economiaPotencialKwhAno = computed<number>(() => {
    const cls = this.classe();
    if (cls === 'A+' || cls === 'A') return 0;
    const currentUpper = PT_ENERGY_CLASS_UPPER_KWH[cls];
    if (!Number.isFinite(currentUpper)) return Math.round(this.areaM2() * (350 - 50));
    const aRef = PT_ENERGY_CLASS_UPPER_KWH.A;
    const delta = currentUpper - aRef;
    return Math.max(0, Math.round(delta * Math.max(0, this.areaM2())));
  });

  /** Display fine range for missing/expired certificate. */
  readonly multaSemCertificado = computed<{ readonly min: number; readonly max: number }>(() => ({
    min: PT_CE_FINE_MIN_EUR,
    max: PT_CE_FINE_MAX_EUR,
  }));

  /** Contextual recommendation based on class + validity. */
  readonly recomendacaoMelhoria = computed<string>(() => {
    if (!this.valido()) {
      return 'Certificado expirado. Listing ilegal — renova antes de publicar (multa 250–3740€ por art. 18.º DL 118/2013).';
    }
    const cls = this.classe();
    if (cls === 'A+' || cls === 'A') {
      return 'Eficiência excelente. Destaca a classe na listagem como vantagem competitiva.';
    }
    if (cls === 'B' || cls === 'B-') {
      return 'Boa eficiência. Considera melhorias pontuais (LED, isolamento) para chegar a A.';
    }
    if (cls === 'C') {
      return 'Eficiência mediana. Investimento em isolamento térmico + caldeira eficiente pode subir 1–2 classes.';
    }
    if (cls === 'D') {
      return 'Baixa eficiência. Fundo Ambiental e PRR têm linhas de financiamento para reabilitação energética.';
    }
    return 'Muito baixa eficiência. Reabilitação profunda recomendada — janelas, isolamento, climatização eficiente.';
  });

  setNumero(v: string): void {
    this.numeroCertificado.set(v);
  }

  setClasse(v: EnergyClass): void {
    this.classe.set(v);
  }

  setDataEmissao(v: string): void {
    this.dataEmissao.set(v);
  }

  setValidadeAnos(v: number): void {
    this.validadeAnos.set(Number.isFinite(v) && v > 0 ? v : 10);
  }

  setTipoImovel(v: EnergyPropertyType): void {
    this.tipoImovel.set(v);
    this.validadeAnos.set(v === 'habitacao' ? 10 : 6);
  }

  setAreaM2(v: number): void {
    this.areaM2.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  setHoje(v: string): void {
    this.hoje.set(v);
  }

  reset(): void {
    this.numeroCertificado.set('CE-2024-1234567');
    this.classe.set('C');
    this.dataEmissao.set('2024-06-15');
    this.validadeAnos.set(10);
    this.tipoImovel.set('habitacao');
    this.areaM2.set(80);
    this.hoje.set(toIsoDate(new Date()));
  }
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(s: string): Date | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}
