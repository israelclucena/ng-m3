import {
  Component, ChangeDetectionStrategy, computed, model,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Property rental yield (rentabilidade) calculator for Portuguese landlords.
 *
 * Computes gross yield, net yield (after costs + IRS rate) and payback period
 * given purchase price, monthly rent, monthly running costs and tax rate.
 *
 * Two-way `model()` inputs allow stories to seed Lisboa/Porto market presets
 * while keeping fields user-editable.
 *
 * @example
 * <iu-yield-calculator
 *   [purchasePrice]="450000"
 *   [monthlyRent]="1600"
 *   [monthlyCosts]="180"
 *   [taxRatePct]="28"
 * />
 */
@Component({
  selector: 'iu-yield-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="yc-root">

      <header class="yc-header">
        <div>
          <h2 class="yc-title">Rentabilidade do Imóvel</h2>
          <p class="yc-subtitle">Calcula yield bruto, líquido e payback</p>
        </div>
        <div class="yc-presets">
          <button type="button" class="yc-preset" (click)="loadLisboa()">
            Lisboa
          </button>
          <button type="button" class="yc-preset" (click)="loadPorto()">
            Porto
          </button>
          <button type="button" class="yc-preset reset" (click)="reset()">
            Reset
          </button>
        </div>
      </header>

      <div class="yc-grid">

        <!-- Inputs -->
        <section class="yc-inputs">
          <label class="yc-field">
            <span class="yc-label">Preço de compra (€)</span>
            <input
              type="number" min="0" step="1000"
              class="yc-input"
              [value]="purchasePrice()"
              (input)="setPrice($event)"
            />
          </label>

          <label class="yc-field">
            <span class="yc-label">Renda mensal (€)</span>
            <input
              type="number" min="0" step="10"
              class="yc-input"
              [value]="monthlyRent()"
              (input)="setRent($event)"
            />
          </label>

          <label class="yc-field">
            <span class="yc-label">Custos mensais (€)</span>
            <span class="yc-helper">Condomínio, IMI/12, manutenção, seguros</span>
            <input
              type="number" min="0" step="5"
              class="yc-input"
              [value]="monthlyCosts()"
              (input)="setCosts($event)"
            />
          </label>

          <label class="yc-field">
            <span class="yc-label">Taxa IRS sobre rendas (%)</span>
            <span class="yc-helper">28% padrão · pode descer para 5–25% com contratos longos</span>
            <input
              type="number" min="0" max="100" step="1"
              class="yc-input"
              [value]="taxRatePct()"
              (input)="setTax($event)"
            />
          </label>
        </section>

        <!-- Outputs -->
        <section class="yc-outputs">
          <div class="yc-out yc-out--gross" [class.yc-out--alert]="grossYield() < 4">
            <span class="yc-out-label">Yield Bruto</span>
            <span class="yc-out-value">{{ grossYield() | number:'1.2-2' }}%</span>
            <span class="yc-out-detail">{{ annualRent() | number:'1.0-0' }} € / ano</span>
          </div>

          <div class="yc-out yc-out--net" [class.yc-out--alert]="netYield() < 3">
            <span class="yc-out-label">Yield Líquido</span>
            <span class="yc-out-value">{{ netYield() | number:'1.2-2' }}%</span>
            <span class="yc-out-detail">{{ netAnnual() | number:'1.0-0' }} € / ano · após custos + IRS</span>
          </div>

          <div class="yc-out">
            <span class="yc-out-label">Payback</span>
            <span class="yc-out-value">
              @if (paybackYears() > 0 && paybackYears() < 200) {
                {{ paybackYears() | number:'1.1-1' }} anos
              } @else {
                —
              }
            </span>
            <span class="yc-out-detail">Recupera o capital investido</span>
          </div>

          <div class="yc-out">
            <span class="yc-out-label">Rendimento Líquido Mensal</span>
            <span class="yc-out-value">{{ netMonthly() | number:'1.0-0' }} €</span>
            <span class="yc-out-detail">Cash-flow após custos + IRS</span>
          </div>
        </section>
      </div>

      <!-- Benchmark hint -->
      <footer class="yc-footer">
        <span class="yc-bench-dot" [class.good]="netYield() >= 4" [class.ok]="netYield() >= 3 && netYield() < 4" [class.poor]="netYield() < 3"></span>
        @if (netYield() >= 4) {
          Acima da média PT (~3-4% líquido). Boa rentabilidade.
        } @else if (netYield() >= 3) {
          Em linha com a média do mercado português.
        } @else if (netYield() > 0) {
          Abaixo da média — considera renegociar custos ou ajustar renda.
        } @else {
          Indica os valores para calcular.
        }
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .yc-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 920px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .yc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .yc-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .yc-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .yc-presets { display: flex; gap: 8px; flex-wrap: wrap; }
    .yc-preset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-primary, #6750a4);
      font-size: 13px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .yc-preset:hover {
      background: var(--md-sys-color-secondary-container, #e8def8);
    }
    .yc-preset.reset {
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .yc-grid {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 24px;
    }

    .yc-inputs { display: flex; flex-direction: column; gap: 14px; }
    .yc-field { display: flex; flex-direction: column; gap: 4px; }
    .yc-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .yc-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .yc-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .yc-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .yc-outputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-content: start;
    }
    .yc-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .yc-out--gross {
      background: var(--md-sys-color-secondary-container, #e8def8);
    }
    .yc-out--net {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .yc-out--alert {
      background: #FFF3E0;
    }
    .yc-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .yc-out-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .yc-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .yc-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .yc-bench-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #999;
    }
    .yc-bench-dot.good { background: #2E7D32; }
    .yc-bench-dot.ok   { background: #1565C0; }
    .yc-bench-dot.poor { background: #E65100; }

    @media (max-width: 720px) {
      .yc-grid { grid-template-columns: 1fr; }
      .yc-outputs { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class YieldCalculatorComponent {
  /** Purchase price in EUR. */
  readonly purchasePrice = model<number>(300000);
  /** Gross monthly rent in EUR. */
  readonly monthlyRent = model<number>(1100);
  /** Monthly running costs (condo, IMI/12, maintenance, insurance) in EUR. */
  readonly monthlyCosts = model<number>(120);
  /** IRS withholding rate over rental income (%). 28% is the PT default. */
  readonly taxRatePct = model<number>(28);

  readonly annualRent = computed(() => this.monthlyRent() * 12);
  readonly annualCosts = computed(() => this.monthlyCosts() * 12);

  readonly grossYield = computed(() => {
    const price = this.purchasePrice();
    if (price <= 0) return 0;
    return (this.annualRent() / price) * 100;
  });

  readonly netAnnual = computed(() => {
    const taxableNet = this.annualRent() - this.annualCosts();
    if (taxableNet <= 0) return taxableNet;
    return taxableNet * (1 - this.taxRatePct() / 100);
  });

  readonly netMonthly = computed(() => this.netAnnual() / 12);

  readonly netYield = computed(() => {
    const price = this.purchasePrice();
    if (price <= 0) return 0;
    return (this.netAnnual() / price) * 100;
  });

  readonly paybackYears = computed(() => {
    const net = this.netAnnual();
    if (net <= 0) return 0;
    return this.purchasePrice() / net;
  });

  setPrice(e: Event)  { this.purchasePrice.set(this.numFrom(e)); }
  setRent(e: Event)   { this.monthlyRent.set(this.numFrom(e)); }
  setCosts(e: Event)  { this.monthlyCosts.set(this.numFrom(e)); }
  setTax(e: Event)    { this.taxRatePct.set(this.numFrom(e)); }

  private numFrom(e: Event): number {
    const raw = (e.target as HTMLInputElement).value;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  loadLisboa() {
    this.purchasePrice.set(614000);
    this.monthlyRent.set(1600);
    this.monthlyCosts.set(220);
    this.taxRatePct.set(28);
  }

  loadPorto() {
    this.purchasePrice.set(300000);
    this.monthlyRent.set(1100);
    this.monthlyCosts.set(140);
    this.taxRatePct.set(28);
  }

  reset() {
    this.purchasePrice.set(300000);
    this.monthlyRent.set(1100);
    this.monthlyCosts.set(120);
    this.taxRatePct.set(28);
  }
}
