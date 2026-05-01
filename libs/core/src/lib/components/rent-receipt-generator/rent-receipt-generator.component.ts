import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentReceiptService, RentReceipt, isValidNIF } from '../../services/rent-receipt.service';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatMes = (iso: string): string => {
  const [y, m] = iso.split('-');
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return iso;
  return `${MONTHS_PT[idx]} ${y}`;
};

const currentMonthISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Rent receipt (recibo de renda) generator for Portuguese landlords.
 *
 * Form on the left, AT-style printable preview on the right. On submit the
 * receipt is archived in {@link RentReceiptService} and shown in the preview.
 * Default IRS withholding is 25% (Cat. F) — adjustable for long-term contracts.
 *
 * @example
 * <iu-rent-receipt-generator />
 */
@Component({
  selector: 'iu-rent-receipt-generator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="rrg-root">
      <header class="rrg-header">
        <div>
          <h2 class="rrg-title">Recibo de Renda</h2>
          <p class="rrg-subtitle">Emite recibo eletrónico estilo AT · Categoria F</p>
        </div>
        <div class="rrg-counter">
          <span class="rrg-counter-num">{{ svc.count() }}</span>
          <span class="rrg-counter-label">recibo(s) nesta sessão</span>
        </div>
      </header>

      <div class="rrg-grid">
        <!-- Form -->
        <form class="rrg-form" (submit)="onSubmit($event)" novalidate>
          <fieldset class="rrg-group">
            <legend>Senhorio</legend>
            <label class="rrg-field">
              <span class="rrg-label">Nome</span>
              <input class="rrg-input" type="text" [value]="senhNome()" (input)="senhNome.set(getVal($event))" />
            </label>
            <label class="rrg-field">
              <span class="rrg-label">NIF</span>
              <input class="rrg-input" type="text" maxlength="9"
                     [value]="senhNif()" (input)="senhNif.set(getVal($event))"
                     [class.rrg-input--invalid]="senhNif().length > 0 && !senhNifValid()" />
              @if (senhNif().length > 0 && !senhNifValid()) {
                <span class="rrg-error">NIF inválido</span>
              }
            </label>
          </fieldset>

          <fieldset class="rrg-group">
            <legend>Inquilino</legend>
            <label class="rrg-field">
              <span class="rrg-label">Nome</span>
              <input class="rrg-input" type="text" [value]="inqNome()" (input)="inqNome.set(getVal($event))" />
            </label>
            <label class="rrg-field">
              <span class="rrg-label">NIF</span>
              <input class="rrg-input" type="text" maxlength="9"
                     [value]="inqNif()" (input)="inqNif.set(getVal($event))"
                     [class.rrg-input--invalid]="inqNif().length > 0 && !inqNifValid()" />
              @if (inqNif().length > 0 && !inqNifValid()) {
                <span class="rrg-error">NIF inválido</span>
              }
            </label>
          </fieldset>

          <fieldset class="rrg-group">
            <legend>Imóvel + Valores</legend>
            <label class="rrg-field">
              <span class="rrg-label">Morada do imóvel</span>
              <input class="rrg-input" type="text" [value]="morada()" (input)="morada.set(getVal($event))" />
            </label>
            <div class="rrg-row">
              <label class="rrg-field">
                <span class="rrg-label">Mês de referência</span>
                <input class="rrg-input" type="month" [value]="mes()" (input)="mes.set(getVal($event))" />
              </label>
              <label class="rrg-field">
                <span class="rrg-label">Valor mensal (€)</span>
                <input class="rrg-input" type="number" min="0" step="10"
                       [value]="valor()" (input)="valor.set(getNum($event))" />
              </label>
              <label class="rrg-field">
                <span class="rrg-label">Retenção IRS (%)</span>
                <input class="rrg-input" type="number" min="0" max="100" step="1"
                       [value]="retencao()" (input)="retencao.set(getNum($event))" />
              </label>
            </div>
            <span class="rrg-helper">Padrão Cat. F: 25%. Contratos longa duração: 5–14% (NRAU 2023).</span>
          </fieldset>

          <div class="rrg-actions">
            <button type="submit" class="rrg-submit" [disabled]="!canSubmit()">Emitir recibo</button>
            <button type="button" class="rrg-clear" (click)="clearAll()">Limpar histórico</button>
          </div>
        </form>

        <!-- Preview -->
        <aside class="rrg-preview">
          @if (last(); as r) {
            <div class="rrg-doc">
              <header class="rrg-doc-header">
                <div>
                  <span class="rrg-doc-issuer">AT · Autoridade Tributária</span>
                  <h3 class="rrg-doc-title">Recibo de Renda Eletrónico</h3>
                </div>
                <div class="rrg-doc-id">
                  <span class="rrg-doc-id-label">N.º</span>
                  <strong>{{ r.numeroSerie }}</strong>
                </div>
              </header>

              <section class="rrg-doc-row">
                <div>
                  <span class="rrg-doc-label">Senhorio</span>
                  <strong>{{ r.nomeSenhorio || '—' }}</strong>
                  <span class="rrg-doc-sub">NIF {{ r.nifSenhorio || '—' }}</span>
                </div>
                <div>
                  <span class="rrg-doc-label">Inquilino</span>
                  <strong>{{ r.nomeInquilino || '—' }}</strong>
                  <span class="rrg-doc-sub">NIF {{ r.nifInquilino || '—' }}</span>
                </div>
              </section>

              <section class="rrg-doc-row">
                <div>
                  <span class="rrg-doc-label">Imóvel</span>
                  <strong>{{ r.moradaImovel || '—' }}</strong>
                </div>
                <div>
                  <span class="rrg-doc-label">Mês de referência</span>
                  <strong>{{ formatMes(r.mesReferencia) }}</strong>
                </div>
              </section>

              <table class="rrg-doc-amounts">
                <tbody>
                  <tr>
                    <td>Valor da renda</td>
                    <td class="rrg-doc-num">{{ r.valorMensal | number:'1.2-2' }} €</td>
                  </tr>
                  <tr>
                    <td>Retenção na fonte ({{ r.retencaoIRSPct }}%)</td>
                    <td class="rrg-doc-num">− {{ r.valorRetido | number:'1.2-2' }} €</td>
                  </tr>
                  <tr class="rrg-doc-total">
                    <td>Valor líquido recebido</td>
                    <td class="rrg-doc-num">{{ r.valorLiquido | number:'1.2-2' }} €</td>
                  </tr>
                </tbody>
              </table>

              <footer class="rrg-doc-footer">
                Emitido em {{ r.emittedAt | date:'dd/MM/yyyy HH:mm' }} · Recibo de Renda Eletrónico — Categoria F
              </footer>
            </div>
          } @else {
            <div class="rrg-preview-empty">
              <strong>Sem recibos emitidos</strong>
              <p>Preenche o formulário e clica em <em>Emitir recibo</em> para visualizar o preview.</p>
            </div>
          }
        </aside>
      </div>

      @if (svc.receipts().length > 1) {
        <section class="rrg-history">
          <h3 class="rrg-section-title">Histórico desta sessão</h3>
          <ul class="rrg-history-list">
            @for (r of svc.receipts(); track r.id) {
              <li class="rrg-history-item">
                <span class="rrg-h-num">{{ r.numeroSerie }}</span>
                <span class="rrg-h-month">{{ formatMes(r.mesReferencia) }}</span>
                <span class="rrg-h-tenant">{{ r.nomeInquilino || '—' }}</span>
                <span class="rrg-h-value">{{ r.valorLiquido | number:'1.2-2' }} €</span>
                <button type="button" class="rrg-h-remove" (click)="svc.remove(r.id)" aria-label="Remover">×</button>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .rrg-root {
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

    .rrg-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .rrg-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .rrg-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .rrg-counter {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      padding: 8px 14px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .rrg-counter-num {
      font-size: 18px;
      font-weight: 700;
    }
    .rrg-counter-label {
      font-size: 10px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    .rrg-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .rrg-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .rrg-group {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 0;
    }
    .rrg-group legend {
      padding: 0 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .rrg-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .rrg-field { display: flex; flex-direction: column; gap: 4px; }
    .rrg-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .rrg-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .rrg-error {
      font-size: 11px;
      color: var(--md-sys-color-error, #b3261e);
    }

    .rrg-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 14px;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    .rrg-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 8px 9px;
    }
    .rrg-input--invalid {
      border-color: var(--md-sys-color-error, #b3261e);
    }

    .rrg-actions { display: flex; gap: 8px; }
    .rrg-submit {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
      border-radius: 20px;
      padding: 10px 22px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .rrg-submit:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .rrg-clear {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      border-radius: 20px;
      padding: 10px 18px;
      font-size: 13px;
      cursor: pointer;
    }

    .rrg-preview {
      display: flex;
      flex-direction: column;
    }
    .rrg-preview-empty {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
    }
    .rrg-preview-empty strong {
      display: block;
      margin-bottom: 4px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .rrg-doc {
      background: #fff;
      color: #111;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-family: 'Times New Roman', Georgia, serif;
    }
    .rrg-doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111;
      padding-bottom: 8px;
    }
    .rrg-doc-issuer {
      font-size: 11px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #666;
    }
    .rrg-doc-title {
      margin: 4px 0 0;
      font-size: 18px;
    }
    .rrg-doc-id {
      text-align: right;
    }
    .rrg-doc-id-label {
      display: block;
      font-size: 10px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: #666;
    }
    .rrg-doc-id strong {
      font-size: 16px;
    }
    .rrg-doc-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .rrg-doc-row > div {
      display: flex;
      flex-direction: column;
    }
    .rrg-doc-label {
      font-size: 10px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: #666;
    }
    .rrg-doc-sub {
      font-size: 11px;
      color: #444;
    }

    .rrg-doc-amounts {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .rrg-doc-amounts td {
      padding: 6px 4px;
      border-bottom: 1px solid #ddd;
    }
    .rrg-doc-num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .rrg-doc-total td {
      font-weight: 700;
      border-bottom: 2px solid #111;
      border-top: 2px solid #111;
      font-size: 16px;
    }
    .rrg-doc-footer {
      font-size: 10px;
      color: #666;
      border-top: 1px dashed #ccc;
      padding-top: 8px;
    }

    .rrg-section-title {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .rrg-history-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .rrg-history-item {
      display: grid;
      grid-template-columns: auto 1fr 1fr auto auto;
      gap: 12px;
      align-items: center;
      padding: 8px 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 8px;
      font-size: 13px;
    }
    .rrg-h-num {
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .rrg-h-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .rrg-h-remove {
      background: transparent;
      border: none;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 18px;
      cursor: pointer;
    }

    @media (max-width: 900px) {
      .rrg-grid { grid-template-columns: 1fr; }
      .rrg-row { grid-template-columns: 1fr; }
    }
  `],
})
export class RentReceiptGeneratorComponent {
  protected readonly svc = inject(RentReceiptService);

  protected readonly senhNome = signal<string>('');
  protected readonly senhNif  = signal<string>('');
  protected readonly inqNome  = signal<string>('');
  protected readonly inqNif   = signal<string>('');
  protected readonly morada   = signal<string>('');
  protected readonly mes      = signal<string>(currentMonthISO());
  protected readonly valor    = signal<number>(0);
  protected readonly retencao = signal<number>(25);

  protected readonly senhNifValid = computed(() => isValidNIF(this.senhNif()));
  protected readonly inqNifValid  = computed(() => isValidNIF(this.inqNif()));

  protected readonly last = computed<RentReceipt | undefined>(
    () => this.svc.receipts()[0],
  );

  protected canSubmit(): boolean {
    return (
      this.senhNome().trim().length > 0 &&
      this.inqNome().trim().length > 0 &&
      this.senhNifValid() &&
      this.inqNifValid() &&
      this.valor() > 0 &&
      this.mes().length > 0
    );
  }

  protected onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.canSubmit()) return;
    this.svc.generate({
      nomeSenhorio:   this.senhNome(),
      nifSenhorio:    this.senhNif(),
      nomeInquilino:  this.inqNome(),
      nifInquilino:   this.inqNif(),
      moradaImovel:   this.morada(),
      mesReferencia:  this.mes(),
      valorMensal:    this.valor(),
      retencaoIRSPct: this.retencao(),
    });
  }

  protected clearAll(): void {
    this.svc.clear();
  }

  protected getVal(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected getNum(e: Event): number {
    const n = Number((e.target as HTMLInputElement).value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  protected formatMes(iso: string): string {
    return formatMes(iso);
  }
}
