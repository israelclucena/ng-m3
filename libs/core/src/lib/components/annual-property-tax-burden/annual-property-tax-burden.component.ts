/**
 * @fileoverview AnnualPropertyTaxBurdenComponent — Sprint 053
 *
 * Hybrid KPI + calendar view consumer of
 * {@link AnnualPropertyTaxBurdenService}. Surfaces the four annual PT
 * real-estate taxes (IMI · AIMI · IRS Cat. F · Mais-Valias) for a single
 * fiscal year, plus a dated payment calendar (AT installment schedule).
 *
 * Differs from `PortfolioTaxLifecycleWidgetComponent` (Sprint 049) by
 * focusing on the **time axis**: KPIs are secondary, the calendar (sorted
 * payment events) is primary.
 *
 * Feature flag: `ANNUAL_TAX_BURDEN_AGGREGATOR`.
 *
 * @example
 * <iu-annual-property-tax-burden />
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { AnnualPropertyTaxBurdenService } from '../../services/annual-property-tax-burden.service';

@Component({
  selector: 'iu-annual-property-tax-burden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, DecimalPipe],
  template: `
    <section class="aptb-root">
      <header class="aptb-header">
        <div>
          <h2 class="aptb-title">Annual Property Tax Burden</h2>
          <p class="aptb-subtitle">
            Ano fiscal · IMI + AIMI + IRS Cat. F + Mais-Valias · {{ burden().perProperty.length }} propriedades
          </p>
        </div>
        <div class="aptb-year-picker">
          <label for="aptb-year">Ano</label>
          <input
            id="aptb-year"
            type="number"
            min="2018"
            max="2099"
            [value]="service.year()"
            (input)="onYearChange($event)"
          />
        </div>
      </header>

      <div class="aptb-kpis">
        <div class="aptb-kpi">
          <span class="aptb-kpi-label">IMI</span>
          <span class="aptb-kpi-value">€{{ burden().imi | number:'1.0-0' }}</span>
        </div>
        <div class="aptb-kpi" [class.aptb-kpi-muted]="burden().aimi === 0">
          <span class="aptb-kpi-label">AIMI</span>
          <span class="aptb-kpi-value">€{{ burden().aimi | number:'1.0-0' }}</span>
        </div>
        <div class="aptb-kpi">
          <span class="aptb-kpi-label">IRS Cat. F</span>
          <span class="aptb-kpi-value">€{{ burden().irsF | number:'1.0-0' }}</span>
        </div>
        <div class="aptb-kpi" [class.aptb-kpi-muted]="burden().maisValias === 0">
          <span class="aptb-kpi-label">Mais-Valias</span>
          <span class="aptb-kpi-value">€{{ burden().maisValias | number:'1.0-0' }}</span>
        </div>
        <div class="aptb-kpi aptb-total">
          <span class="aptb-kpi-label">Total {{ service.year() }}</span>
          <span class="aptb-kpi-value">€{{ burden().total | number:'1.0-0' }}</span>
        </div>
      </div>

      <div class="aptb-calendar">
        <h3 class="aptb-section-title">Calendário fiscal — pagamentos previstos</h3>
        @if (burden().calendarEvents.length === 0) {
          <p class="aptb-empty">Sem pagamentos previstos para {{ service.year() }}.</p>
        } @else {
          <ol class="aptb-timeline">
            @for (e of burden().calendarEvents; track e.id) {
              <li class="aptb-event" [attr.data-kind]="e.kind">
                <span class="aptb-date">{{ e.date | date:'dd MMM yyyy' }}</span>
                <span class="aptb-label">{{ e.label }}</span>
                <span class="aptb-amount">€{{ e.amount | number:'1.0-0' }}</span>
                @if (e.note) {
                  <span class="aptb-note">{{ e.note }}</span>
                }
              </li>
            }
          </ol>
        }
      </div>

      <p class="aptb-footnote">
        Estimativa indicativa. IMI: regra AT 2026 — ≤€100 prestação única,
        ≤€500 duas (31 Mai + 30 Nov), &gt;€500 três (31 Mai + 31 Ago + 30 Nov).
        AIMI: 30 Set. IRS Cat. F: deadline 30 Jun do ano seguinte. Mais-Valias:
        residente 50% × 28%, não-residente 100% × 28%. Não substitui simulação fiscal.
      </p>
    </section>
  `,
  styles: [`
    .aptb-root {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      background: var(--md-sys-color-surface, #fafafa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 16px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }
    .aptb-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .aptb-title {
      margin: 0; font-size: 1.5rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aptb-subtitle {
      margin: .25rem 0 0; font-size: .875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aptb-year-picker {
      display: flex; flex-direction: column; gap: .25rem;
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aptb-year-picker input {
      width: 7rem;
      padding: .5rem .75rem;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font: inherit;
    }
    .aptb-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: .75rem;
    }
    .aptb-kpi {
      display: flex; flex-direction: column; gap: .25rem;
      padding: .875rem 1rem;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 12px;
    }
    .aptb-kpi.aptb-total {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .aptb-kpi-muted { opacity: .55; }
    .aptb-kpi-label {
      font-size: .75rem; text-transform: uppercase; letter-spacing: .05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .aptb-kpi.aptb-total .aptb-kpi-label { color: inherit; opacity: .8; }
    .aptb-kpi-value { font-size: 1.25rem; font-weight: 500; }

    .aptb-section-title {
      margin: 0 0 .75rem; font-size: 1rem; font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .aptb-empty {
      margin: 0;
      padding: 1rem;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: .875rem;
    }
    .aptb-timeline {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: .5rem;
    }
    .aptb-event {
      display: grid;
      grid-template-columns: 140px 1fr auto;
      grid-template-areas: 'date label amount' 'date note note';
      gap: .25rem .75rem;
      padding: .75rem 1rem;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-left: 3px solid var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      align-items: baseline;
    }
    .aptb-event[data-kind='imi']         { border-left-color: var(--md-sys-color-primary, #6750a4); }
    .aptb-event[data-kind='aimi']        { border-left-color: var(--md-sys-color-tertiary, #7d5260); }
    .aptb-event[data-kind='irs']         { border-left-color: var(--md-sys-color-secondary, #625b71); }
    .aptb-event[data-kind='mais-valias'] { border-left-color: var(--md-sys-color-error, #b3261e); }

    .aptb-date {
      grid-area: date;
      font-size: .8125rem; font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-variant-numeric: tabular-nums;
    }
    .aptb-label   { grid-area: label;  font-weight: 500; }
    .aptb-amount  {
      grid-area: amount;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .aptb-note    {
      grid-area: note;
      font-size: .75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .aptb-footnote {
      margin: 0; padding: 0 .25rem;
      font-size: .75rem; line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class AnnualPropertyTaxBurdenComponent {
  readonly service = inject(AnnualPropertyTaxBurdenService);
  readonly burden = this.service.result;

  onYearChange(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(v)) this.service.setYear(v);
  }
}
