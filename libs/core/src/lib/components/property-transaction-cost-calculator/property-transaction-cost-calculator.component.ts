import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { PropertyTransactionCostService } from '../../services/property-transaction-cost.service';
import type { IMTFinalidade, IMTResidencia } from '../../services/imt.service';
import type { MVResidencia } from '../../services/mais-valias-imobiliarias.service';

/**
 * Property Transaction Cost Calculator — meta-consumer that combines IMT
 * (compra) and Mais-Valias Imobiliárias (venda) into a single side-by-side
 * view. Shows buyer's all-in acquisition cost and seller's net proceeds,
 * exposing the friction delta of the transaction.
 *
 * Closes the quadrado: compra (IMT+IS) × venda (Mais-Valias) ×
 * titularidade (IMI+AIMI) × disposição operacional (Lifecycle).
 *
 * Feature flag: `PROPERTY_TRANSACTION_COST_CALCULATOR`. Sprint 052.
 *
 * @example
 * <iu-property-transaction-cost-calculator />
 */
@Component({
  selector: 'iu-property-transaction-cost-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, PercentPipe],
  template: `
    <div class="ptcc-root">
      <header class="ptcc-header">
        <div>
          <h2 class="ptcc-title">Property Transaction Cost</h2>
          <p class="ptcc-subtitle">
            Custo total · compra (IMT + IS) × venda (Mais-Valias IRS Cat. G) — single transaction
          </p>
        </div>
        <button type="button" class="ptcc-reset" (click)="svc.reset()">Reset</button>
      </header>

      <section class="ptcc-shared">
        <label class="ptcc-field">
          <span class="ptcc-label">Preço de venda negociado (€)</span>
          <span class="ptcc-helper">Único valor — base para impostos do comprador e mais-valia do vendedor</span>
          <input
            type="number" min="0" step="1000"
            class="ptcc-input"
            [value]="svc.precoVenda()"
            (input)="setNumber('preco', $event)"
          />
        </label>
      </section>

      <div class="ptcc-columns">
        <!-- ─── BUYER ─── -->
        <section class="ptcc-col ptcc-col--buyer">
          <h3 class="ptcc-col-title">Comprador</h3>

          <fieldset class="ptcc-regime">
            <legend>Finalidade</legend>
            <label><input type="radio" name="buyerFinalidade" value="hpp"
              [checked]="svc.buyerFinalidade() === 'hpp'"
              (change)="setBuyerFinalidade('hpp')" /> HPP</label>
            <label><input type="radio" name="buyerFinalidade" value="outros"
              [checked]="svc.buyerFinalidade() === 'outros'"
              (change)="setBuyerFinalidade('outros')" /> Outros fins</label>
          </fieldset>

          <fieldset class="ptcc-regime">
            <legend>Estatuto</legend>
            <label><input type="radio" name="buyerRes" value="residente"
              [checked]="svc.buyerResidencia() === 'residente'"
              (change)="setBuyerResidencia('residente')" /> Residente</label>
            <label><input type="radio" name="buyerRes" value="naoResidente"
              [checked]="svc.buyerResidencia() === 'naoResidente'"
              (change)="setBuyerResidencia('naoResidente')" /> Não-residente</label>
          </fieldset>

          @if (jovemAvailable()) {
            <label class="ptcc-checkbox">
              <input type="checkbox"
                [checked]="svc.buyerJovem()"
                (change)="toggleBuyerJovem($event)" />
              <span>Jovem · 1ª habitação · até 35 anos (isenção até €316.772)</span>
            </label>
          }

          <label class="ptcc-field">
            <span class="ptcc-label">Notário + registo predial (€)</span>
            <input
              type="number" min="0" step="50"
              class="ptcc-input"
              [value]="svc.custoNotarioRegisto()"
              (input)="setNumber('notario', $event)"
            />
          </label>

          <div class="ptcc-out" [class.ptcc-out--isento]="svc.buyerJovemIsento()">
            <span class="ptcc-out-label">IMT</span>
            <span class="ptcc-out-value">€{{ svc.buyerIMT() | number:'1.0-0' }}</span>
            @if (svc.buyerJovemIsento()) {
              <span class="ptcc-out-tag">Isenção jovens 2026</span>
            }
          </div>
          <div class="ptcc-out">
            <span class="ptcc-out-label">Imposto de Selo (0,8%)</span>
            <span class="ptcc-out-value-sm">€{{ svc.buyerIS() | number:'1.0-0' }}</span>
          </div>
          <div class="ptcc-out ptcc-out--primary">
            <span class="ptcc-out-label">Custo total comprador</span>
            <span class="ptcc-out-value">€{{ svc.buyerCustoTotal() | number:'1.0-0' }}</span>
            <span class="ptcc-out-detail">
              Sobre o preço: {{ svc.buyerTaxaEfectiva() | percent:'1.2-2' }}
            </span>
          </div>
        </section>

        <!-- ─── SELLER ─── -->
        <section class="ptcc-col ptcc-col--seller">
          <h3 class="ptcc-col-title">Vendedor</h3>

          <label class="ptcc-field">
            <span class="ptcc-label">Valor de aquisição original (€)</span>
            <input
              type="number" min="0" step="1000"
              class="ptcc-input"
              [value]="svc.sellerValorAquisicaoOriginal()"
              (input)="setNumber('aquisicao', $event)"
            />
          </label>

          <label class="ptcc-field">
            <span class="ptcc-label">Ano de aquisição</span>
            <input
              type="number" min="1989" max="2026" step="1"
              class="ptcc-input"
              [value]="svc.sellerAnoAquisicao()"
              (input)="setNumber('ano', $event)"
            />
            <span class="ptcc-helper">Coeficiente desvalorização aplicado: {{ svc.sellerCoeficiente() | number:'1.2-2' }}×</span>
          </label>

          <label class="ptcc-field">
            <span class="ptcc-label">Encargos de aquisição (€)</span>
            <input
              type="number" min="0" step="100"
              class="ptcc-input"
              [value]="svc.sellerEncargosAquisicao()"
              (input)="setNumber('encargos', $event)"
            />
          </label>

          <label class="ptcc-field">
            <span class="ptcc-label">Despesas de valorização (€)</span>
            <input
              type="number" min="0" step="100"
              class="ptcc-input"
              [value]="svc.sellerDespesasValorizacao()"
              (input)="setNumber('valorizacao', $event)"
            />
          </label>

          <fieldset class="ptcc-regime">
            <legend>Estatuto</legend>
            <label><input type="radio" name="sellerRes" value="residente"
              [checked]="svc.sellerResidencia() === 'residente'"
              (change)="setSellerResidencia('residente')" /> Residente (50%)</label>
            <label><input type="radio" name="sellerRes" value="naoResidente"
              [checked]="svc.sellerResidencia() === 'naoResidente'"
              (change)="setSellerResidencia('naoResidente')" /> Não-residente (100%)</label>
          </fieldset>

          <div class="ptcc-out">
            <span class="ptcc-out-label">Mais-valia bruta</span>
            <span class="ptcc-out-value-sm">€{{ svc.sellerMaisValiaBruta() | number:'1.0-0' }}</span>
          </div>
          <div class="ptcc-out">
            <span class="ptcc-out-label">Tributável ({{ (svc.sellerQuotaTributavel() * 100) | number:'1.0-0' }}%)</span>
            <span class="ptcc-out-value-sm">€{{ svc.sellerMaisValiaTributavel() | number:'1.0-0' }}</span>
          </div>
          <div class="ptcc-out">
            <span class="ptcc-out-label">IRS Cat. G (taxa autónoma 28%)</span>
            <span class="ptcc-out-value-sm">€{{ svc.sellerColectaIRS() | number:'1.0-0' }}</span>
          </div>
          <div class="ptcc-out ptcc-out--primary">
            <span class="ptcc-out-label">Líquido recebido vendedor</span>
            <span class="ptcc-out-value">€{{ svc.sellerLiquidoRecebido() | number:'1.0-0' }}</span>
            <span class="ptcc-out-detail">
              Sobre o preço: {{ svc.sellerTaxaEfectiva() | percent:'1.2-2' }}
            </span>
          </div>
        </section>
      </div>

      <section class="ptcc-delta">
        <div class="ptcc-delta-kpi">
          <span class="ptcc-delta-label">Fricção total da transacção</span>
          <span class="ptcc-delta-value">€{{ svc.fricaoTotal() | number:'1.0-0' }}</span>
        </div>
        <div class="ptcc-delta-kpi">
          <span class="ptcc-delta-label">% sobre preço</span>
          <span class="ptcc-delta-value">{{ svc.fricaoSobrePreco() | percent:'1.2-2' }}</span>
        </div>
        <p class="ptcc-delta-note">
          Custo total que o comprador suporta menos o líquido que o vendedor recebe —
          mede a destruição de valor agregada pelos impostos transacionais (IMT + IS)
          mais a tributação da mais-valia, isolada do preço.
        </p>
      </section>

      <footer class="ptcc-footnote">
        <span class="ptcc-bench-dot"></span>
        <span>
          Estimativa indicativa. Não modela isenção por reinvestimento em HPP, regimes
          concelhios específicos, ou aquisições inter vivos por permuta. Confirma com
          escritura / contabilista certificado.
        </span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ptcc-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 1080px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .ptcc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .ptcc-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ptcc-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptcc-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .ptcc-shared {
      padding: 14px 16px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }

    .ptcc-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .ptcc-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .ptcc-col--buyer {
      background: var(--md-sys-color-secondary-container, #e8def8);
    }
    .ptcc-col--seller {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
    }
    .ptcc-col-title {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .ptcc-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ptcc-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ptcc-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptcc-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .ptcc-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .ptcc-regime {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ptcc-regime legend {
      padding: 0 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .ptcc-regime label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    .ptcc-checkbox {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: var(--md-sys-color-primary-container, #eaddff);
      border-radius: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-primary-container, #21005d);
      cursor: pointer;
    }

    .ptcc-out {
      background: var(--md-sys-color-surface, #fff);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ptcc-out--primary {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .ptcc-out--isento {
      background: var(--md-sys-color-tertiary-container, #d2f4d2);
    }
    .ptcc-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptcc-out-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ptcc-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ptcc-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptcc-out-tag {
      align-self: flex-start;
      background: var(--md-sys-color-tertiary, #7d5260);
      color: var(--md-sys-color-on-tertiary, #fff);
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 4px;
    }

    .ptcc-delta {
      display: grid;
      grid-template-columns: auto auto 1fr;
      gap: 16px;
      align-items: center;
      padding: 16px 20px;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border-radius: 14px;
    }
    .ptcc-delta-kpi {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ptcc-delta-label {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .ptcc-delta-value {
      font-size: 26px;
      font-weight: 800;
    }
    .ptcc-delta-note {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
      line-height: 1.5;
    }

    .ptcc-footnote {
      padding-top: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ptcc-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
      margin-top: 5px;
    }

    @media (max-width: 760px) {
      .ptcc-columns, .ptcc-delta {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class PropertyTransactionCostCalculatorComponent {
  readonly svc = inject(PropertyTransactionCostService);

  jovemAvailable(): boolean {
    return this.svc.buyerFinalidade() === 'hpp' && this.svc.buyerResidencia() === 'residente';
  }

  setNumber(field: 'preco' | 'notario' | 'aquisicao' | 'ano' | 'encargos' | 'valorizacao', e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    switch (field) {
      case 'preco': this.svc.setPrecoVenda(v); break;
      case 'notario': this.svc.setCustoNotarioRegisto(v); break;
      case 'aquisicao': this.svc.setSellerValorAquisicaoOriginal(v); break;
      case 'ano': this.svc.setSellerAnoAquisicao(v); break;
      case 'encargos': this.svc.setSellerEncargosAquisicao(v); break;
      case 'valorizacao': this.svc.setSellerDespesasValorizacao(v); break;
    }
  }

  setBuyerFinalidade(f: IMTFinalidade): void { this.svc.setBuyerFinalidade(f); }
  setBuyerResidencia(r: IMTResidencia): void { this.svc.setBuyerResidencia(r); }
  setSellerResidencia(r: MVResidencia): void { this.svc.setSellerResidencia(r); }

  toggleBuyerJovem(e: Event): void {
    this.svc.setBuyerJovem((e.target as HTMLInputElement).checked);
  }
}
