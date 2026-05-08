import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AIMIService,
  PT_AIMI_DEDUCAO_SINGULAR,
  PT_AIMI_DEDUCAO_CONJUNTO,
  PT_AIMI_TAXA_SOCIEDADE,
  type AIMITitular,
} from '../../services/aimi.service';

/**
 * Calculadora AIMI (Adicional ao IMI) PT.
 *
 * Soma de VPTs urbanos habitacionais + terrenos construção, dedução por titular
 * (€600k singular / €1.2M casal / 0 sociedades), taxa progressiva 0.7%/1.0%/1.5%
 * para singulares e casais, taxa fixa 0.4% para sociedades.
 *
 * @example
 * <iu-aimi-calculator />
 */
@Component({
  selector: 'iu-aimi-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="aimi-root">
      <header class="aimi-header">
        <div>
          <h2 class="aimi-title">Calculadora AIMI</h2>
          <p class="aimi-subtitle">Adicional ao IMI · wealth tax sobre VPT total · taxas 2026</p>
        </div>
        <button type="button" class="aimi-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="aimi-grid">
        <section class="aimi-inputs">
          <fieldset class="aimi-regime">
            <legend class="aimi-label">Tipo de titular</legend>
            <label class="aimi-radio">
              <input
                type="radio" name="titular" value="singular"
                [checked]="svc.titular() === 'singular'"
                (change)="setTitular('singular')"
              />
              <span>Singular · dedução {{ deducaoSingularTxt }}</span>
            </label>
            <label class="aimi-radio">
              <input
                type="radio" name="titular" value="conjunto"
                [checked]="svc.titular() === 'conjunto'"
                (change)="setTitular('conjunto')"
              />
              <span>Casal · opção conjunta · dedução {{ deducaoConjuntoTxt }}</span>
            </label>
            <label class="aimi-radio">
              <input
                type="radio" name="titular" value="sociedade"
                [checked]="svc.titular() === 'sociedade'"
                (change)="setTitular('sociedade')"
              />
              <span>Sociedade · taxa fixa {{ taxaSociedadePctTxt }}</span>
            </label>
          </fieldset>

          <div class="aimi-props">
            <div class="aimi-props-header">
              <span class="aimi-label">Propriedades elegíveis</span>
              <span class="aimi-helper">Apenas urbano habitacional + terreno construção</span>
            </div>
            @for (p of svc.propriedades(); track p.id) {
              <label class="aimi-prop-row">
                <span class="aimi-prop-name">{{ p.label }}</span>
                <span class="aimi-prop-currency">€</span>
                <input
                  type="number" min="0" step="1000"
                  class="aimi-prop-input"
                  [value]="p.vpt"
                  (input)="setVpt(p.id, $event)"
                  [attr.aria-label]="'VPT ' + p.label"
                />
              </label>
            }
            <div class="aimi-prop-total">
              <span>VPT total</span>
              <span class="aimi-prop-total-value">{{ svc.vptTotal() | number:'1.2-2' }} €</span>
            </div>
          </div>
        </section>

        <section class="aimi-outputs">
          <div class="aimi-out aimi-out--breakdown">
            <span class="aimi-out-label">Dedução aplicável</span>
            <span class="aimi-out-value-sm">{{ svc.deducao() | number:'1.0-0' }} €</span>
            <span class="aimi-out-detail">{{ deducaoCaption() }}</span>
          </div>

          <div class="aimi-out aimi-out--breakdown">
            <span class="aimi-out-label">Base tributável</span>
            <span class="aimi-out-value-sm">{{ svc.baseTributavel() | number:'1.2-2' }} €</span>
            <span class="aimi-out-detail">VPT total − dedução</span>
          </div>

          <div class="aimi-out aimi-out--primary">
            <span class="aimi-out-label">AIMI a pagar</span>
            <span class="aimi-out-value">{{ svc.colecta() | number:'1.2-2' }} €</span>
            <span class="aimi-out-detail">
              taxa efectiva {{ taxaEfectivaPctTxt() }} sobre VPT total
            </span>
          </div>

          @if (!svc.sujeitoAImposto()) {
            <div class="aimi-out aimi-out--info">
              <span class="aimi-out-label">Não sujeito</span>
              <span class="aimi-out-detail">VPT total abaixo da dedução — sem AIMI devido este ano.</span>
            </div>
          }
        </section>
      </div>

      @if (svc.sujeitoAImposto()) {
        <section class="aimi-breakdown-section">
          <h3 class="aimi-section-title">Breakdown por escalão</h3>
          <table class="aimi-table">
            <thead>
              <tr>
                <th>Escalão</th>
                <th>Base</th>
                <th>Taxa</th>
                <th>Colecta</th>
              </tr>
            </thead>
            <tbody>
              @for (linha of svc.breakdown(); track linha.escalao) {
                <tr>
                  <td>{{ linha.escalao }}</td>
                  <td>{{ linha.base | number:'1.2-2' }} €</td>
                  <td>{{ pct(linha.taxa) }}</td>
                  <td>{{ linha.colecta | number:'1.2-2' }} €</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <footer class="aimi-footer">
        <span class="aimi-bench-dot"></span>
        Estimativa indicativa — não modela majoração de prédios devolutos, isenção de reabilitação
        urbana, ou heranças indivisas. Confirma com contabilista.
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .aimi-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 960px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .aimi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .aimi-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aimi-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aimi-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .aimi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .aimi-inputs, .aimi-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .aimi-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aimi-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .aimi-regime {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .aimi-regime legend {
      padding: 0 6px;
    }
    .aimi-radio {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .aimi-props {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .aimi-props-header {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 4px;
    }
    .aimi-prop-row {
      display: grid;
      grid-template-columns: 1fr auto 130px;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aimi-prop-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .aimi-prop-currency {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aimi-prop-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 13px;
      font-family: inherit;
      text-align: right;
    }
    .aimi-prop-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 5px 7px;
    }
    .aimi-prop-total {
      display: flex;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      font-size: 13px;
      font-weight: 600;
    }
    .aimi-prop-total-value {
      color: var(--md-sys-color-primary, #6750a4);
    }

    .aimi-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .aimi-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .aimi-out--info {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
    }
    .aimi-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aimi-out-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aimi-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aimi-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .aimi-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .aimi-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .aimi-table th, .aimi-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .aimi-table th {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .aimi-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aimi-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
    }

    @media (max-width: 720px) {
      .aimi-grid { grid-template-columns: 1fr; }
      .aimi-prop-row { grid-template-columns: 1fr auto 110px; }
    }
  `],
})
export class AIMICalculatorComponent {
  protected readonly svc = inject(AIMIService);

  protected readonly deducaoSingularTxt =
    `${(PT_AIMI_DEDUCAO_SINGULAR / 1000).toFixed(0)}k €`;
  protected readonly deducaoConjuntoTxt =
    `${(PT_AIMI_DEDUCAO_CONJUNTO / 1_000_000).toFixed(1)}M €`;
  protected readonly taxaSociedadePctTxt =
    `${(PT_AIMI_TAXA_SOCIEDADE * 100).toFixed(1)}%`;

  protected readonly taxaEfectivaPctTxt = computed(
    () => `${(this.svc.taxaEfectiva() * 100).toFixed(2)}%`,
  );

  protected readonly deducaoCaption = computed(() => {
    switch (this.svc.titular()) {
      case 'singular': return 'Titular singular (CIMI art. 135.º-C nº 1)';
      case 'conjunto': return 'Casal · opção tributação conjunta (CIMI art. 135.º-D)';
      case 'sociedade': return 'Sociedades sem dedução · taxa fixa';
    }
  });

  protected pct(v: number): string {
    return `${(v * 100).toFixed(2)}%`;
  }

  protected setTitular(t: AIMITitular): void {
    this.svc.setTitular(t);
  }

  protected setVpt(id: string, e: Event): void {
    this.svc.setVptDe(id, Number((e.target as HTMLInputElement).value));
  }
}
