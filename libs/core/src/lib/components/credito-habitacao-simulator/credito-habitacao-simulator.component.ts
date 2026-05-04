import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CreditoHabitacaoService,
  PT_EURIBOR_DEFAULTS,
  type MortgageIndexante,
} from '../../services/credito-habitacao.service';

const INDEXANTE_OPTIONS: readonly { value: MortgageIndexante; label: string }[] = [
  { value: 'euribor3m',  label: 'Euribor 3 meses' },
  { value: 'euribor6m',  label: 'Euribor 6 meses' },
  { value: 'euribor12m', label: 'Euribor 12 meses' },
  { value: 'taxaFixa',   label: 'Taxa fixa' },
];

/**
 * Crédito Habitação (PT mortgage) simulator.
 *
 * Inputs: valor imóvel, entrada, prazo, indexante + spread (or TAN fixa),
 * seguros. Outputs: prestação mensal, TAEG, total juros, LTV, schedule.
 *
 * @example
 * <iu-credito-habitacao-simulator />
 */
@Component({
  selector: 'iu-credito-habitacao-simulator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ch-root">
      <header class="ch-header">
        <div>
          <h2 class="ch-title">Simulador Crédito Habitação</h2>
          <p class="ch-subtitle">Prestação Price · TAEG · LTV · tabela amortização</p>
        </div>
        <button type="button" class="ch-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="ch-grid">
        <section class="ch-inputs">
          <label class="ch-field">
            <span class="ch-label">Valor do imóvel (€)</span>
            <input type="number" min="0" step="1000" class="ch-input"
              [value]="svc.valorImovel()" (input)="setValor($event)" />
          </label>

          <label class="ch-field">
            <span class="ch-label">Entrada (€)</span>
            <span class="ch-helper">Mínimo recomendado 10–20%</span>
            <input type="number" min="0" step="1000" class="ch-input"
              [value]="svc.entrada()" (input)="setEntrada($event)" />
          </label>

          <label class="ch-field">
            <span class="ch-label">Prazo (anos)</span>
            <input type="number" min="1" max="40" step="1" class="ch-input"
              [value]="svc.prazoAnos()" (input)="setPrazo($event)" />
          </label>

          <label class="ch-field">
            <span class="ch-label">Indexante</span>
            <select class="ch-input" [value]="svc.indexante()" (change)="setIndexante($event)">
              @for (o of indexantes; track o.value) {
                <option [value]="o.value">{{ o.label }}</option>
              }
            </select>
            <span class="ch-helper">{{ indexanteHelper() }}</span>
          </label>

          @if (svc.indexante() !== 'taxaFixa') {
            <label class="ch-field">
              <span class="ch-label">Spread (%)</span>
              <input type="number" min="0" step="0.05" class="ch-input"
                [value]="spreadAsPct()" (input)="setSpread($event)" />
            </label>
            <label class="ch-field">
              <span class="ch-label">Override indexante (%)</span>
              <span class="ch-helper">Vazio = usar default</span>
              <input type="number" min="0" step="0.01" class="ch-input"
                [value]="overrideAsPct()" (input)="setOverride($event)" placeholder="ex. 2.30" />
            </label>
          } @else {
            <label class="ch-field">
              <span class="ch-label">TAN fixa (%)</span>
              <input type="number" min="0" step="0.05" class="ch-input"
                [value]="tanAsPct()" (input)="setTan($event)" />
            </label>
          }

          <label class="ch-field">
            <span class="ch-label">Seguro vida (€/mês)</span>
            <input type="number" min="0" step="1" class="ch-input"
              [value]="svc.seguroVidaMensal()" (input)="setSeguroVida($event)" />
          </label>

          <label class="ch-field">
            <span class="ch-label">Multirriscos (€/mês)</span>
            <input type="number" min="0" step="1" class="ch-input"
              [value]="svc.seguroMultirriscosMensal()" (input)="setSeguroMR($event)" />
          </label>
        </section>

        <section class="ch-outputs">
          <div class="ch-out ch-out--primary">
            <span class="ch-out-label">Prestação mensal (c/ seguros)</span>
            <span class="ch-out-value">{{ svc.prestacaoMensalTotal() | number:'1.2-2' }} €</span>
            <span class="ch-out-detail">
              capital {{ svc.prestacaoMensal() | number:'1.2-2' }} € · seguros {{ segurosTotal() | number:'1.2-2' }} €
            </span>
          </div>

          <div class="ch-out">
            <span class="ch-out-label">TAN aplicada</span>
            <span class="ch-out-value-sm">{{ taxaAplicavelPctTxt() }}</span>
          </div>

          <div class="ch-out">
            <span class="ch-out-label">TAEG estimada</span>
            <span class="ch-out-value-sm">{{ taegPctTxt() }}</span>
          </div>

          <div class="ch-out">
            <span class="ch-out-label">LTV</span>
            <span class="ch-out-value-sm">{{ lvrPctTxt() }}</span>
            <span class="ch-out-detail">
              capital financiado {{ svc.capitalFinanciado() | number:'1.2-2' }} €
            </span>
          </div>

          <div class="ch-out">
            <span class="ch-out-label">Total pago no fim</span>
            <span class="ch-out-value-sm">{{ svc.totalPagoNoFinal() | number:'1.2-2' }} €</span>
            <span class="ch-out-detail">
              juros {{ svc.totalJuros() | number:'1.2-2' }} €
            </span>
          </div>
        </section>
      </div>

      <section class="ch-schedule">
        <h3 class="ch-section-title">Primeiros 12 meses</h3>
        <table class="ch-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Cap. inicial</th>
              <th>Juros</th>
              <th>Amortização</th>
              <th>Cap. final</th>
            </tr>
          </thead>
          <tbody>
            @for (r of svc.tabelaPrimeirosMeses(); track r.mes) {
              <tr>
                <td>{{ r.mes }}</td>
                <td>{{ r.capitalInicial | number:'1.2-2' }} €</td>
                <td>{{ r.juros | number:'1.2-2' }} €</td>
                <td>{{ r.amortizacao | number:'1.2-2' }} €</td>
                <td>{{ r.capitalFinal | number:'1.2-2' }} €</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="ch-schedule">
        <h3 class="ch-section-title">Últimos 12 meses</h3>
        <table class="ch-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Cap. inicial</th>
              <th>Juros</th>
              <th>Amortização</th>
              <th>Cap. final</th>
            </tr>
          </thead>
          <tbody>
            @for (r of svc.tabelaUltimosMeses(); track r.mes) {
              <tr>
                <td>{{ r.mes }}</td>
                <td>{{ r.capitalInicial | number:'1.2-2' }} €</td>
                <td>{{ r.juros | number:'1.2-2' }} €</td>
                <td>{{ r.amortizacao | number:'1.2-2' }} €</td>
                <td>{{ r.capitalFinal | number:'1.2-2' }} €</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <footer class="ch-footer">
        <span class="ch-bench-dot"></span>
        Simulação Price standard · Euribor refs Maio 2026 (override-able) · TAEG aproximada por Newton-Raphson, não substitui FINE / DECRT do banco.
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ch-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 1080px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .ch-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .ch-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ch-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ch-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .ch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .ch-inputs, .ch-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ch-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ch-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ch-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ch-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .ch-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .ch-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ch-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .ch-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ch-out-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ch-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ch-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ch-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ch-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .ch-table th, .ch-table td {
      text-align: right;
      padding: 8px 10px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .ch-table th:first-child, .ch-table td:first-child {
      text-align: left;
    }
    .ch-table th {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ch-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ch-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
    }

    @media (max-width: 720px) {
      .ch-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CreditoHabitacaoSimulatorComponent {
  protected readonly svc = inject(CreditoHabitacaoService);

  protected readonly indexantes = INDEXANTE_OPTIONS;

  protected readonly indexanteHelper = computed(() => {
    const idx = this.svc.indexante();
    if (idx === 'taxaFixa') return 'TAN fixa para todo o prazo';
    const def = (PT_EURIBOR_DEFAULTS[idx] * 100).toFixed(2);
    return `Default ${def}% · refs Maio 2026`;
  });

  protected readonly taxaAplicavelPctTxt = computed(() =>
    `${(this.svc.taxaAplicavel() * 100).toFixed(3)}%`,
  );

  protected readonly taegPctTxt = computed(() =>
    `${(this.svc.taeg() * 100).toFixed(3)}%`,
  );

  protected readonly lvrPctTxt = computed(() =>
    `${(this.svc.lvr() * 100).toFixed(2)}%`,
  );

  protected readonly segurosTotal = computed(() =>
    this.svc.seguroVidaMensal() + this.svc.seguroMultirriscosMensal(),
  );

  protected readonly spreadAsPct = computed(() => (this.svc.spread() * 100).toFixed(2));
  protected readonly tanAsPct = computed(() => (this.svc.tanFixa() * 100).toFixed(2));
  protected readonly overrideAsPct = computed(() => {
    const v = this.svc.valorIndexanteOverride();
    return v === null ? '' : (v * 100).toFixed(2);
  });

  protected setValor(e: Event): void {
    this.svc.setValorImovel(numberOf(e));
  }
  protected setEntrada(e: Event): void {
    this.svc.setEntrada(numberOf(e));
  }
  protected setPrazo(e: Event): void {
    this.svc.setPrazoAnos(numberOf(e));
  }
  protected setIndexante(e: Event): void {
    const v = (e.target as HTMLSelectElement).value as MortgageIndexante;
    this.svc.setIndexante(v);
  }
  protected setSpread(e: Event): void {
    const pct = numberOf(e);
    this.svc.setSpread(pct / 100);
  }
  protected setOverride(e: Event): void {
    const raw = (e.target as HTMLInputElement).value.trim();
    if (raw === '') {
      this.svc.setValorIndexanteOverride(null);
      return;
    }
    const pct = Number(raw);
    if (Number.isFinite(pct) && pct >= 0) this.svc.setValorIndexanteOverride(pct / 100);
  }
  protected setTan(e: Event): void {
    const pct = numberOf(e);
    this.svc.setTanFixa(pct / 100);
  }
  protected setSeguroVida(e: Event): void {
    this.svc.seguroVidaMensal.set(Math.max(0, numberOf(e)));
  }
  protected setSeguroMR(e: Event): void {
    this.svc.seguroMultirriscosMensal.set(Math.max(0, numberOf(e)));
  }
}

function numberOf(e: Event): number {
  const n = Number((e.target as HTMLInputElement).value);
  return Number.isFinite(n) ? n : 0;
}
