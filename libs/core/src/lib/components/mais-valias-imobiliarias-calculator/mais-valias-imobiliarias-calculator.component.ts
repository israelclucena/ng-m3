import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MaisValiasImobiliariasService,
  PT_MV_TAXA_AUTONOMA,
  type MVRegime,
  type MVResidencia,
} from '../../services/mais-valias-imobiliarias.service';

/**
 * Calculadora de mais-valias imobiliárias PT (IRS Cat. G — venda de imóvel).
 *
 * Modelo: valor de aquisição × coeficiente de desvalorização monetária,
 * dedução de encargos com aquisição e despesas de valorização nos 12 anos
 * anteriores, 50% tributável (residente) ou 100% (não-residente), comparação
 * 28% taxa autónoma vs englobamento progressivo.
 *
 * @example
 * <iu-mais-valias-imobiliarias-calculator />
 */
@Component({
  selector: 'iu-mais-valias-imobiliarias-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="mv-root">
      <header class="mv-header">
        <div>
          <h2 class="mv-title">Calculadora Mais-Valias Imobiliárias</h2>
          <p class="mv-subtitle">IRS Categoria G · venda de imóvel · taxa autónoma 28% vs englobamento</p>
        </div>
        <button type="button" class="mv-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="mv-grid">
        <section class="mv-inputs">
          <label class="mv-field">
            <span class="mv-label">Valor de realização (€)</span>
            <span class="mv-helper">Preço de venda na escritura</span>
            <input
              type="number" min="0" step="1000"
              class="mv-input"
              [value]="svc.valorRealizacao()"
              (input)="setRealizacao($event)"
            />
          </label>

          <label class="mv-field">
            <span class="mv-label">Valor de aquisição (€)</span>
            <span class="mv-helper">Escritura original — ainda sem coeficiente</span>
            <input
              type="number" min="0" step="1000"
              class="mv-input"
              [value]="svc.valorAquisicao()"
              (input)="setAquisicao($event)"
            />
          </label>

          <label class="mv-field">
            <span class="mv-label">Ano de aquisição</span>
            <span class="mv-helper">1989 a {{ anoMaximo }} · coef. {{ coefTxt() }}×</span>
            <input
              type="number" min="1989" [max]="anoMaximo" step="1"
              class="mv-input"
              [value]="svc.anoAquisicao()"
              (input)="setAno($event)"
            />
          </label>

          <label class="mv-field">
            <span class="mv-label">Encargos com aquisição (€)</span>
            <span class="mv-helper">IMT, IS, escritura, comissão imobiliária na compra</span>
            <input
              type="number" min="0" step="100"
              class="mv-input"
              [value]="svc.encargosAquisicao()"
              (input)="setEncargos($event)"
            />
          </label>

          <label class="mv-field">
            <span class="mv-label">Despesas de valorização (€)</span>
            <span class="mv-helper">Obras nos últimos 12 anos com factura</span>
            <input
              type="number" min="0" step="100"
              class="mv-input"
              [value]="svc.despesasValorizacao()"
              (input)="setValorizacao($event)"
            />
          </label>

          <fieldset class="mv-regime">
            <legend class="mv-label">Estatuto fiscal</legend>
            <label class="mv-radio">
              <input
                type="radio" name="residencia" value="residente"
                [checked]="svc.residencia() === 'residente'"
                (change)="setResidencia('residente')"
              />
              <span>Residente PT (50% tributável)</span>
            </label>
            <label class="mv-radio">
              <input
                type="radio" name="residencia" value="naoResidente"
                [checked]="svc.residencia() === 'naoResidente'"
                (change)="setResidencia('naoResidente')"
              />
              <span>Não-residente (100% tributável)</span>
            </label>
          </fieldset>

          @if (isResidente()) {
            <label class="mv-field">
              <span class="mv-label">Outros rendimentos (€)</span>
              <span class="mv-helper">Cat A/B/F do agregado — base para taxa marginal englobamento</span>
              <input
                type="number" min="0" step="1000"
                class="mv-input"
                [value]="svc.outrosRendimentosEnglobamento()"
                (input)="setOutros($event)"
              />
            </label>

            <fieldset class="mv-regime">
              <legend class="mv-label">Regime fiscal</legend>
              <label class="mv-radio">
                <input
                  type="radio" name="regime" value="taxaAutonoma28"
                  [checked]="svc.regime() === 'taxaAutonoma28'"
                  (change)="setRegime('taxaAutonoma28')"
                />
                <span>Taxa autónoma {{ taxaAutonomaPctTxt }}</span>
              </label>
              <label class="mv-radio">
                <input
                  type="radio" name="regime" value="englobamento"
                  [checked]="svc.regime() === 'englobamento'"
                  (change)="setRegime('englobamento')"
                />
                <span>Englobamento (escalões progressivos)</span>
              </label>
            </fieldset>
          }
        </section>

        <section class="mv-outputs">
          <div class="mv-out mv-out--breakdown">
            <span class="mv-out-label">Aquisição corrigida</span>
            <span class="mv-out-value-sm">{{ svc.valorAquisicaoCorrigido() | number:'1.2-2' }} €</span>
            <span class="mv-out-detail">
              {{ svc.valorAquisicao() | number:'1.0-0' }} € × {{ coefTxt() }}
            </span>
          </div>

          <div class="mv-out mv-out--breakdown">
            <span class="mv-out-label">Mais-valia bruta</span>
            <span class="mv-out-value-sm" [class.mv-negative]="svc.maisValiaBruta() < 0">
              {{ svc.maisValiaBruta() | number:'1.2-2' }} €
            </span>
            <span class="mv-out-detail">realização − aquisição corrigida − encargos − valorização</span>
          </div>

          <div class="mv-out mv-out--breakdown">
            <span class="mv-out-label">Mais-valia tributável</span>
            <span class="mv-out-value-sm">{{ svc.maisValiaTributavel() | number:'1.2-2' }} €</span>
            <span class="mv-out-detail">{{ quotaPctTxt() }} aplicado</span>
          </div>

          <div class="mv-out mv-out--primary">
            <span class="mv-out-label">Imposto a pagar</span>
            <span class="mv-out-value">{{ svc.colectaActual() | number:'1.2-2' }} €</span>
            <span class="mv-out-detail">
              taxa efectiva {{ taxaEfectivaPctTxt() }} · líquido {{ svc.liquidoAposImposto() | number:'1.2-2' }} €
            </span>
          </div>

          @if (isResidente()) {
            <div class="mv-out mv-out--reco">
              <span class="mv-out-label">Recomendação</span>
              <span class="mv-out-value-sm">{{ regimeLabel(svc.melhorRegime()) }}</span>
              <span class="mv-out-detail">poupança vs alternativa: {{ svc.poupanca() | number:'1.2-2' }} €</span>
            </div>
          }
        </section>
      </div>

      @if (isResidente()) {
        <section class="mv-compare">
          <h3 class="mv-section-title">Comparação lado-a-lado</h3>
          <table class="mv-table">
            <thead>
              <tr>
                <th>Regime</th>
                <th>Colecta</th>
                <th>Taxa efectiva</th>
              </tr>
            </thead>
            <tbody>
              <tr [class.mv-row-best]="svc.melhorRegime() === 'taxaAutonoma28'">
                <td>Taxa autónoma 28%</td>
                <td>{{ svc.comparacao().taxaAutonoma.colecta | number:'1.2-2' }} €</td>
                <td>{{ pct(svc.comparacao().taxaAutonoma.taxaEfectiva) }}</td>
              </tr>
              <tr [class.mv-row-best]="svc.melhorRegime() === 'englobamento'">
                <td>Englobamento</td>
                <td>{{ svc.comparacao().englobamento.colecta | number:'1.2-2' }} €</td>
                <td>{{ pct(svc.comparacao().englobamento.taxaEfectiva) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      }

      <footer class="mv-footer">
        <span class="mv-bench-dot"></span>
        Estimativa indicativa — coeficientes de desvalorização monetária baseados em Portaria 314/2024.
        Não modela isenção por reinvestimento em HPP, regime transitório de 1989, herdeiros.
        Confirma com contabilista.
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .mv-root {
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

    .mv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .mv-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mv-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mv-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .mv-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .mv-inputs, .mv-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mv-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mv-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mv-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mv-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .mv-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .mv-regime {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mv-regime legend {
      padding: 0 6px;
    }
    .mv-radio {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .mv-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mv-out--breakdown {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }
    .mv-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .mv-out--reco {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
    }
    .mv-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mv-out-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mv-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mv-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mv-negative {
      color: var(--md-sys-color-error, #b3261e);
    }

    .mv-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .mv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .mv-table th, .mv-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .mv-table th {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mv-row-best {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      font-weight: 700;
    }

    .mv-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mv-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
    }

    @media (max-width: 720px) {
      .mv-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class MaisValiasImobiliariasCalculatorComponent {
  protected readonly svc = inject(MaisValiasImobiliariasService);

  protected readonly anoMaximo = 2026;
  protected readonly taxaAutonomaPctTxt = `${(PT_MV_TAXA_AUTONOMA * 100).toFixed(0)}%`;

  protected readonly isResidente = computed(() => this.svc.residencia() === 'residente');

  protected readonly coefTxt = computed(() => this.svc.coeficiente().toFixed(2));

  protected readonly quotaPctTxt = computed(
    () => `${(this.svc.quotaTributavel() * 100).toFixed(0)}% tributável`,
  );

  protected readonly taxaEfectivaPctTxt = computed(
    () => `${(this.svc.taxaEfectiva() * 100).toFixed(2)}%`,
  );

  protected pct(v: number): string {
    return `${(v * 100).toFixed(2)}%`;
  }

  protected regimeLabel(r: MVRegime): string {
    return r === 'taxaAutonoma28' ? 'Taxa autónoma 28%' : 'Englobamento';
  }

  protected setRealizacao(e: Event): void {
    this.svc.setValorRealizacao(Number((e.target as HTMLInputElement).value));
  }
  protected setAquisicao(e: Event): void {
    this.svc.setValorAquisicao(Number((e.target as HTMLInputElement).value));
  }
  protected setAno(e: Event): void {
    this.svc.setAnoAquisicao(Number((e.target as HTMLInputElement).value));
  }
  protected setEncargos(e: Event): void {
    this.svc.setEncargos(Number((e.target as HTMLInputElement).value));
  }
  protected setValorizacao(e: Event): void {
    this.svc.setValorizacao(Number((e.target as HTMLInputElement).value));
  }
  protected setOutros(e: Event): void {
    this.svc.setOutrosRendimentos(Number((e.target as HTMLInputElement).value));
  }
  protected setResidencia(r: MVResidencia): void {
    this.svc.setResidencia(r);
  }
  protected setRegime(r: MVRegime): void {
    this.svc.setRegime(r);
  }
}
