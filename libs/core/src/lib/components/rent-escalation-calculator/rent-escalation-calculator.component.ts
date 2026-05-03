import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentEscalationService } from '../../services/rent-escalation.service';

/**
 * Annual rent escalation calculator for Portuguese landlords (NRAU art. 24.º).
 *
 * Inputs: starting monthly rent, contract base year, target year, optional
 * per-year coefficient overrides. Outputs: updated rent, total increase,
 * year-by-year history table.
 *
 * Two-way bindings via the underlying service so a parent can seed values
 * (or react to changes) without prop drilling.
 *
 * @example
 * <iu-rent-escalation-calculator />
 */
@Component({
  selector: 'iu-rent-escalation-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="re-root">
      <header class="re-header">
        <div>
          <h2 class="re-title">Actualização de Renda</h2>
          <p class="re-subtitle">NRAU art. 24.º · coeficientes anuais publicados em Portaria</p>
        </div>
        <button type="button" class="re-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="re-grid">
        <section class="re-inputs">
          <label class="re-field">
            <span class="re-label">Renda actual (€/mês)</span>
            <input
              type="number" min="0" step="1"
              class="re-input"
              [value]="svc.rendaActual()"
              (input)="setRenda($event)"
            />
          </label>

          <label class="re-field">
            <span class="re-label">Ano da renda actual</span>
            <input
              type="number" min="2018" max="2030" step="1"
              class="re-input"
              [value]="svc.anoInicio()"
              (input)="setAnoInicio($event)"
            />
          </label>

          <label class="re-field">
            <span class="re-label">Ano alvo (até)</span>
            <span class="re-helper">Aplica coeficientes ano-a-ano até este valor</span>
            <input
              type="number" min="2018" max="2030" step="1"
              class="re-input"
              [value]="svc.anoAlvo()"
              (input)="setAnoAlvo($event)"
            />
          </label>
        </section>

        <section class="re-outputs">
          <div class="re-out re-out--primary">
            <span class="re-out-label">Renda actualizada</span>
            <span class="re-out-value">{{ svc.rendaAtualizada() | number:'1.2-2' }} €</span>
            <span class="re-out-detail">em {{ svc.anoAlvo() }}</span>
          </div>
          <div class="re-out">
            <span class="re-out-label">Aumento total</span>
            <span class="re-out-value">+ {{ svc.aumentoTotal() | number:'1.2-2' }} €</span>
            <span class="re-out-detail">{{ svc.aumentoPct() | number:'1.2-2' }}% sobre original</span>
          </div>
        </section>
      </div>

      @if (svc.historicoEscalation().length > 0) {
        <section class="re-history">
          <header class="re-history-head">
            <h3 class="re-section-title">Histórico ano-a-ano</h3>
          </header>
          <div class="re-table-wrap">
            <table class="re-table">
              <thead>
                <tr>
                  <th>Ano</th>
                  <th>Coeficiente</th>
                  <th>Renda início</th>
                  <th>Renda fim</th>
                  <th>Aumento</th>
                </tr>
              </thead>
              <tbody>
                @for (row of svc.historicoEscalation(); track row.year) {
                  <tr>
                    <td class="re-table-year">{{ row.year }}</td>
                    <td>
                      <input
                        type="number"
                        min="0.9" max="1.5" step="0.0001"
                        class="re-coef-input"
                        [value]="row.coeficiente"
                        (input)="overrideCoef(row.year, $event)"
                      />
                    </td>
                    <td>{{ row.rendaInicio | number:'1.2-2' }} €</td>
                    <td class="re-table-strong">{{ row.rendaFim | number:'1.2-2' }} €</td>
                    <td class="re-table-pos">+ {{ row.aumentoEur | number:'1.2-2' }} €</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <p class="re-hint">Define um ano alvo posterior ao ano da renda actual para ver a actualização.</p>
      }

      <footer class="re-footer">
        <span class="re-bench-dot"></span>
        Coeficientes baseados nas Portarias anuais (INE). Sobrescreve qualquer linha para simular cenários alternativos.
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .re-root {
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

    .re-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .re-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .re-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .re-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .re-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .re-inputs { display: flex; flex-direction: column; gap: 12px; }
    .re-field { display: flex; flex-direction: column; gap: 4px; }
    .re-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .re-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .re-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .re-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .re-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-content: start;
    }
    .re-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .re-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .re-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .re-out-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .re-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .re-section-title {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .re-table-wrap {
      margin-top: 8px;
      overflow-x: auto;
    }
    .re-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .re-table thead th {
      text-align: left;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .re-table tbody td {
      padding: 10px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .re-table-year {
      font-weight: 600;
    }
    .re-table-strong {
      font-weight: 700;
    }
    .re-table-pos {
      color: #2E7D32;
      font-weight: 600;
    }
    .re-coef-input {
      width: 90px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 12px;
      font-family: inherit;
    }
    .re-coef-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
    }

    .re-hint {
      margin: 0;
      padding: 16px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }

    .re-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .re-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
    }

    @media (max-width: 720px) {
      .re-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class RentEscalationCalculatorComponent {
  protected readonly svc = inject(RentEscalationService);

  protected setRenda(e: Event): void {
    this.svc.setRenda(this.numFrom(e));
  }

  protected setAnoInicio(e: Event): void {
    this.svc.anoInicio.set(this.intFrom(e, this.svc.anoInicio()));
  }

  protected setAnoAlvo(e: Event): void {
    this.svc.anoAlvo.set(this.intFrom(e, this.svc.anoAlvo()));
  }

  protected overrideCoef(year: number, e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    if (Number.isFinite(v) && v > 0) {
      this.svc.applyCoeficienteOverride(year, v);
    }
  }

  private numFrom(e: Event): number {
    const n = Number((e.target as HTMLInputElement).value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  private intFrom(e: Event, fallback: number): number {
    const n = parseInt((e.target as HTMLInputElement).value, 10);
    return Number.isFinite(n) ? n : fallback;
  }
}
