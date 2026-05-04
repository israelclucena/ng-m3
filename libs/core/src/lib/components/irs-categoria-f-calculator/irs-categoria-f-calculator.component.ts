import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IRSCategoriaFService,
  PT_IRS_TAXA_AUTONOMA_CAT_F,
  type IRSCatFRegime,
} from '../../services/irs-categoria-f.service';

/**
 * IRS Categoria F (rendimentos prediais) calculator for PT landlords.
 *
 * Compares 28% taxa autónoma (default) with englobamento at progressive
 * IRS scales (escalões 2026), recommends the cheaper regime, and shows
 * potential savings.
 *
 * @example
 * <iu-irs-categoria-f-calculator />
 */
@Component({
  selector: 'iu-irs-categoria-f-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="irs-root">
      <header class="irs-header">
        <div>
          <h2 class="irs-title">Calculadora IRS Categoria F</h2>
          <p class="irs-subtitle">Rendimentos prediais · taxa autónoma 28% vs englobamento</p>
        </div>
        <button type="button" class="irs-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="irs-grid">
        <section class="irs-inputs">
          <label class="irs-field">
            <span class="irs-label">Renda bruta anual (€)</span>
            <span class="irs-helper">Soma rendas recebidas no ano fiscal</span>
            <input
              type="number" min="0" step="100"
              class="irs-input"
              [value]="svc.rendimentoBrutoAnual()"
              (input)="setRenda($event)"
            />
          </label>

          <label class="irs-field">
            <span class="irs-label">Despesas dedutíveis (€)</span>
            <span class="irs-helper">Manutenção, condomínio, IMI, seguro, juros mortgage</span>
            <input
              type="number" min="0" step="100"
              class="irs-input"
              [value]="svc.despesasDedutiveis()"
              (input)="setDespesas($event)"
            />
          </label>

          <label class="irs-field">
            <span class="irs-label">Outros rendimentos do agregado (€)</span>
            <span class="irs-helper">Cat A/B já tributados — usado para taxa marginal englobamento</span>
            <input
              type="number" min="0" step="100"
              class="irs-input"
              [value]="svc.outrosRendimentosEnglobamento()"
              (input)="setOutros($event)"
            />
          </label>

          <fieldset class="irs-regime">
            <legend class="irs-label">Regime fiscal</legend>
            <label class="irs-radio">
              <input
                type="radio" name="regime" value="taxaAutonoma28"
                [checked]="svc.regime() === 'taxaAutonoma28'"
                (change)="setRegime('taxaAutonoma28')"
              />
              <span>Taxa autónoma {{ taxaAutonomaPctTxt }}</span>
            </label>
            <label class="irs-radio">
              <input
                type="radio" name="regime" value="englobamento"
                [checked]="svc.regime() === 'englobamento'"
                (change)="setRegime('englobamento')"
              />
              <span>Englobamento (escalões progressivos)</span>
            </label>
          </fieldset>
        </section>

        <section class="irs-outputs">
          <div class="irs-out irs-out--primary">
            <span class="irs-out-label">Imposto a pagar</span>
            <span class="irs-out-value">{{ svc.colectaActual() | number:'1.2-2' }} €</span>
            <span class="irs-out-detail">
              taxa efectiva {{ taxaEfectivaPctTxt() }} · líquido {{ svc.rendimentoLiquido() | number:'1.2-2' }} €
            </span>
          </div>

          <div class="irs-out irs-out--reco" [class.irs-out--reco-active]="recomendacaoActive()">
            <span class="irs-out-label">Recomendação</span>
            <span class="irs-out-value-sm">
              {{ regimeLabel(svc.melhorRegime()) }}
            </span>
            <span class="irs-out-detail">
              poupança vs alternativa: {{ svc.poupanca() | number:'1.2-2' }} €
            </span>
          </div>
        </section>
      </div>

      <section class="irs-compare">
        <h3 class="irs-section-title">Comparação lado-a-lado</h3>
        <table class="irs-table">
          <thead>
            <tr>
              <th>Regime</th>
              <th>Colecta</th>
              <th>Taxa efectiva</th>
            </tr>
          </thead>
          <tbody>
            <tr [class.irs-row-best]="svc.melhorRegime() === 'taxaAutonoma28'">
              <td>Taxa autónoma 28%</td>
              <td>{{ svc.comparacao().taxaAutonoma.colecta | number:'1.2-2' }} €</td>
              <td>{{ pct(svc.comparacao().taxaAutonoma.taxaEfectiva) }}</td>
            </tr>
            <tr [class.irs-row-best]="svc.melhorRegime() === 'englobamento'">
              <td>Englobamento</td>
              <td>{{ svc.comparacao().englobamento.colecta | number:'1.2-2' }} €</td>
              <td>{{ pct(svc.comparacao().englobamento.taxaEfectiva) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer class="irs-footer">
        <span class="irs-bench-dot"></span>
        Estimativa indicativa baseada nos escalões IRS 2026 (AT). Confirma com contabilista para opções como mais-valias / herança / não-residente.
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .irs-root {
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

    .irs-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .irs-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .irs-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .irs-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .irs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .irs-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .irs-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .irs-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .irs-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .irs-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .irs-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .irs-regime {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .irs-regime legend {
      padding: 0 6px;
    }
    .irs-radio {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .irs-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .irs-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .irs-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .irs-out--reco {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
    }
    .irs-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .irs-out-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .irs-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .irs-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .irs-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .irs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .irs-table th, .irs-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .irs-table th {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .irs-row-best {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      font-weight: 700;
    }

    .irs-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .irs-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
    }

    @media (max-width: 720px) {
      .irs-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class IRSCategoriaFCalculatorComponent {
  protected readonly svc = inject(IRSCategoriaFService);

  protected readonly taxaAutonomaPctTxt = `${(PT_IRS_TAXA_AUTONOMA_CAT_F * 100).toFixed(0)}%`;

  protected readonly taxaEfectivaPctTxt = computed(() =>
    `${(this.svc.taxaEfectiva() * 100).toFixed(2)}%`,
  );

  protected readonly recomendacaoActive = computed(
    () => this.svc.melhorRegime() === this.svc.regime(),
  );

  protected pct(v: number): string {
    return `${(v * 100).toFixed(2)}%`;
  }

  protected regimeLabel(r: IRSCatFRegime): string {
    return r === 'taxaAutonoma28' ? 'Taxa autónoma 28%' : 'Englobamento';
  }

  protected setRenda(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setRendimentoBruto(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  protected setDespesas(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setDespesas(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  protected setOutros(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setOutrosRendimentos(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  protected setRegime(r: IRSCatFRegime): void {
    this.svc.setRegime(r);
  }
}
