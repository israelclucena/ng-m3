import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IMTService,
  PT_IS_IMOVEL,
  PT_IMT_JOVEM_LIMITE,
  type IMTFinalidade,
  type IMTResidencia,
} from '../../services/imt.service';

/**
 * Calculadora IMT (Imposto Municipal sobre Transmissões Onerosas) PT.
 *
 * Tabelas escalonadas 2026 para HPP / Outros fins, taxa fixa 5% rústicos,
 * isenção jovens 1ª habitação até €316.772, Imposto de Selo 0.8% sempre.
 *
 * @example
 * <iu-imt-calculator />
 */
@Component({
  selector: 'iu-imt-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="imt-root">
      <header class="imt-header">
        <div>
          <h2 class="imt-title">Calculadora IMT</h2>
          <p class="imt-subtitle">Imposto Municipal sobre Transmissões · compra de imóvel · tabelas 2026</p>
        </div>
        <button type="button" class="imt-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="imt-grid">
        <section class="imt-inputs">
          <label class="imt-field">
            <span class="imt-label">Valor de aquisição (€)</span>
            <span class="imt-helper">Escritura ou VPT, o maior (CIMT art. 12.º)</span>
            <input
              type="number" min="0" step="1000"
              class="imt-input"
              [value]="svc.valorAquisicao()"
              (input)="setValor($event)"
            />
          </label>

          <fieldset class="imt-regime">
            <legend class="imt-label">Finalidade</legend>
            <label class="imt-radio">
              <input
                type="radio" name="finalidade" value="hpp"
                [checked]="svc.finalidade() === 'hpp'"
                (change)="setFinalidade('hpp')"
              />
              <span>Habitação própria permanente (HPP)</span>
            </label>
            <label class="imt-radio">
              <input
                type="radio" name="finalidade" value="outros"
                [checked]="svc.finalidade() === 'outros'"
                (change)="setFinalidade('outros')"
              />
              <span>Outros fins · 2ª habitação · arrendamento</span>
            </label>
            <label class="imt-radio">
              <input
                type="radio" name="finalidade" value="rural"
                [checked]="svc.finalidade() === 'rural'"
                (change)="setFinalidade('rural')"
              />
              <span>Prédio rústico (taxa fixa 5%)</span>
            </label>
          </fieldset>

          <fieldset class="imt-regime">
            <legend class="imt-label">Estatuto fiscal</legend>
            <label class="imt-radio">
              <input
                type="radio" name="residencia" value="residente"
                [checked]="svc.residencia() === 'residente'"
                (change)="setResidencia('residente')"
              />
              <span>Residente PT</span>
            </label>
            <label class="imt-radio">
              <input
                type="radio" name="residencia" value="naoResidente"
                [checked]="svc.residencia() === 'naoResidente'"
                (change)="setResidencia('naoResidente')"
              />
              <span>Não-residente · sem benefícios jovens</span>
            </label>
          </fieldset>

          @if (jovemDisponivel()) {
            <label class="imt-checkbox">
              <input
                type="checkbox"
                [checked]="svc.jovemPrimeiraHabitacao()"
                (change)="setJovem($event)"
              />
              <span>
                Jovem (≤35 anos) · 1ª habitação
                <span class="imt-helper">Isenção total até {{ jovemLimiteTxt }}</span>
              </span>
            </label>
          }
        </section>

        <section class="imt-outputs">
          <div class="imt-out imt-out--breakdown">
            <span class="imt-out-label">Regime activo</span>
            <span class="imt-out-value-sm">{{ regimeCaption() }}</span>
          </div>

          <div class="imt-out imt-out--breakdown">
            <span class="imt-out-label">IMT</span>
            <span class="imt-out-value-sm">{{ svc.imt() | number:'1.2-2' }} €</span>
            <span class="imt-out-detail">
              {{ svc.elegivelJovem() ? 'Isenção jovens activa' : 'Tabela escalonada por tranches' }}
            </span>
          </div>

          <div class="imt-out imt-out--breakdown">
            <span class="imt-out-label">Imposto de Selo</span>
            <span class="imt-out-value-sm">{{ svc.is() | number:'1.2-2' }} €</span>
            <span class="imt-out-detail">{{ pctIs }} sobre valor de aquisição (sempre devido)</span>
          </div>

          <div class="imt-out imt-out--primary">
            <span class="imt-out-label">Total a pagar na compra</span>
            <span class="imt-out-value">{{ svc.total() | number:'1.2-2' }} €</span>
            <span class="imt-out-detail">
              IMT + IS · taxa efectiva total {{ taxaEfectivaPctTxt() }}
            </span>
          </div>
        </section>
      </div>

      @if (svc.breakdown().length > 0) {
        <section class="imt-breakdown-section">
          <h3 class="imt-section-title">Breakdown IMT por escalão</h3>
          <table class="imt-table">
            <thead>
              <tr>
                <th>Escalão</th>
                <th>Base</th>
                <th>Taxa marginal</th>
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

      <footer class="imt-footer">
        <span class="imt-bench-dot"></span>
        Estimativa indicativa — não modela isenção de reabilitação urbana, regimes concelhios
        de pressão urbanística, ou aquisição por permuta. Confirma na escritura com o notário.
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .imt-root {
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

    .imt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .imt-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imt-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imt-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .imt-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .imt-inputs, .imt-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .imt-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .imt-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imt-helper {
      display: block;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imt-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .imt-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .imt-regime {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .imt-regime legend {
      padding: 0 6px;
    }
    .imt-radio {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
    }

    .imt-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      border-radius: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      cursor: pointer;
    }

    .imt-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .imt-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .imt-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imt-out-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imt-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .imt-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .imt-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .imt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .imt-table th, .imt-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .imt-table th {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .imt-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .imt-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
    }

    @media (max-width: 720px) {
      .imt-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class IMTCalculatorComponent {
  protected readonly svc = inject(IMTService);

  protected readonly pctIs = `${(PT_IS_IMOVEL * 100).toFixed(1)}%`;
  protected readonly jovemLimiteTxt =
    `${(PT_IMT_JOVEM_LIMITE / 1000).toFixed(0)}k €`;

  protected readonly jovemDisponivel = computed(
    () => this.svc.finalidade() === 'hpp' && this.svc.residencia() === 'residente',
  );

  protected readonly taxaEfectivaPctTxt = computed(
    () => `${(this.svc.taxaEfectiva() * 100).toFixed(2)}%`,
  );

  protected readonly regimeCaption = computed(() => this.svc.regimeCaption());

  protected pct(v: number): string {
    return `${(v * 100).toFixed(2)}%`;
  }

  protected setValor(e: Event): void {
    this.svc.setValorAquisicao(Number((e.target as HTMLInputElement).value));
  }
  protected setFinalidade(f: IMTFinalidade): void {
    this.svc.setFinalidade(f);
  }
  protected setResidencia(r: IMTResidencia): void {
    this.svc.setResidencia(r);
  }
  protected setJovem(e: Event): void {
    this.svc.setJovem((e.target as HTMLInputElement).checked);
  }
}
