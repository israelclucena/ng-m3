import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IMICalculatorService,
  PT_IMI_TAXAS_MUNICIPAIS,
} from '../../services/imi-calculator.service';

const CONCELHO_OPTIONS = [
  ...Object.keys(PT_IMI_TAXAS_MUNICIPAIS),
  'Outro',
] as const;

/**
 * IMI (Imposto Municipal sobre Imóveis) calculator for PT property owners.
 *
 * Inputs: VPT, concelho, optional rate override, uso próprio + agregado
 * familiar. Outputs: annual IMI, household rebate estimate, installment
 * calendar per AT rules.
 *
 * @example
 * <iu-imi-calculator />
 */
@Component({
  selector: 'iu-imi-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="imi-root">
      <header class="imi-header">
        <div>
          <h2 class="imi-title">Calculadora IMI</h2>
          <p class="imi-subtitle">Imposto Municipal sobre Imóveis · taxa concelhia + agregado familiar</p>
        </div>
        <button type="button" class="imi-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="imi-grid">
        <section class="imi-inputs">
          <label class="imi-field">
            <span class="imi-label">Valor Patrimonial Tributário (€)</span>
            <span class="imi-helper">VPT actual da matriz predial</span>
            <input
              type="number" min="0" step="1000"
              class="imi-input"
              [value]="svc.vpt()"
              (input)="setVpt($event)"
            />
          </label>

          <label class="imi-field">
            <span class="imi-label">Concelho</span>
            <select class="imi-input" [value]="svc.concelho()" (change)="setConcelho($event)">
              @for (c of concelhos; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
            <span class="imi-helper">Taxa actual: {{ taxaPctTxt() }}</span>
          </label>

          <label class="imi-field">
            <span class="imi-label">Override de taxa (%)</span>
            <span class="imi-helper">Deixa vazio para usar a do concelho</span>
            <input
              type="number" min="0.001" max="1" step="0.0005"
              class="imi-input"
              [value]="overrideAsPct()"
              (input)="setOverride($event)"
              placeholder="ex. 0.35"
            />
          </label>

          <label class="imi-check">
            <input type="checkbox" [checked]="svc.usoProprio()" (change)="toggleUsoProprio($event)" />
            <span>Habitação própria e permanente</span>
          </label>

          <label class="imi-field">
            <span class="imi-label">Dependentes no agregado</span>
            <span class="imi-helper">1: −20€ · 2: −40€ · 3+: −70€ (apenas com uso próprio)</span>
            <input
              type="number" min="0" max="10" step="1"
              class="imi-input"
              [value]="svc.agregadoFamiliar()"
              (input)="setAgregado($event)"
            />
          </label>
        </section>

        <section class="imi-outputs">
          <div class="imi-out imi-out--primary">
            <span class="imi-out-label">IMI anual</span>
            <span class="imi-out-value">{{ svc.imiAnual() | number:'1.2-2' }} €</span>
            <span class="imi-out-detail">{{ svc.numeroPrestacoes() }} prestação(ões) · {{ taxaPctTxt() }}</span>
          </div>

          <div class="imi-out">
            <span class="imi-out-label">Bruto</span>
            <span class="imi-out-value-sm">{{ svc.imiAnualBruto() | number:'1.2-2' }} €</span>
          </div>

          <div class="imi-out">
            <span class="imi-out-label">Dedução agregado</span>
            <span class="imi-out-value-sm">− {{ svc.isencaoEstimada() | number:'1.2-2' }} €</span>
          </div>
        </section>
      </div>

      <section class="imi-schedule">
        <h3 class="imi-section-title">Calendário de pagamento</h3>
        <ul class="imi-instalments">
          @for (p of svc.prestacoesCalendario(); track p.numero) {
            <li class="imi-instalment">
              <span class="imi-instalment-num">{{ p.numero }}</span>
              <div class="imi-instalment-info">
                <span class="imi-instalment-month">{{ p.mes }}</span>
                <span class="imi-instalment-rule">prestação {{ p.numero }} de {{ svc.numeroPrestacoes() }}</span>
              </div>
              <span class="imi-instalment-value">{{ p.valor | number:'1.2-2' }} €</span>
            </li>
          }
        </ul>
      </section>

      <footer class="imi-footer">
        <span class="imi-bench-dot"></span>
        Regra AT 2026: ≤100€ → 1 prestação · ≤500€ → 2 (Maio + Novembro) · &gt;500€ → 3 (Maio + Agosto + Novembro).
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .imi-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 920px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .imi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .imi-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imi-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imi-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .imi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .imi-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .imi-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .imi-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imi-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imi-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .imi-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .imi-check {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .imi-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .imi-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .imi-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .imi-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imi-out-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imi-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imi-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .imi-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .imi-instalments {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .imi-instalment {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .imi-instalment-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    .imi-instalment-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }
    .imi-instalment-month {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imi-instalment-rule {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imi-instalment-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .imi-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imi-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
    }

    @media (max-width: 720px) {
      .imi-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class IMICalculatorComponent {
  protected readonly svc = inject(IMICalculatorService);

  protected readonly concelhos = CONCELHO_OPTIONS;

  protected readonly taxaPctTxt = computed(() =>
    `${(this.svc.taxaAplicavel() * 100).toFixed(3)}%`,
  );

  protected readonly overrideAsPct = computed(() => {
    const v = this.svc.taxaMunicipalOverride();
    return v === null ? '' : (v * 100).toFixed(3);
  });

  protected setVpt(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setVpt(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  protected setConcelho(e: Event): void {
    this.svc.setConcelho((e.target as HTMLSelectElement).value);
  }

  protected setOverride(e: Event): void {
    const raw = (e.target as HTMLInputElement).value.trim();
    if (raw === '') {
      this.svc.setTaxaOverride(null);
      return;
    }
    const pct = Number(raw);
    if (Number.isFinite(pct) && pct > 0) {
      this.svc.setTaxaOverride(pct / 100);
    }
  }

  protected toggleUsoProprio(e: Event): void {
    this.svc.usoProprio.set((e.target as HTMLInputElement).checked);
  }

  protected setAgregado(e: Event): void {
    const n = parseInt((e.target as HTMLInputElement).value, 10);
    this.svc.agregadoFamiliar.set(Number.isFinite(n) && n >= 0 ? n : 0);
  }
}
