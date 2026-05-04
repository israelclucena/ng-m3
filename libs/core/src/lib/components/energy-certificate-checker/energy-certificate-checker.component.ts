import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EnergyCertificateService,
  PT_ENERGY_CLASS_ORDER,
  type EnergyClass,
  type EnergyPropertyType,
} from '../../services/energy-certificate.service';

const PROPERTY_TYPES: readonly { value: EnergyPropertyType; label: string }[] = [
  { value: 'habitacao', label: 'Habitação' },
  { value: 'comercio',  label: 'Comércio' },
  { value: 'servico',   label: 'Serviços' },
];

const CLASS_BADGE_COLORS: Readonly<Record<EnergyClass, { bg: string; fg: string }>> = {
  'A+': { bg: '#0f6e0f', fg: '#ffffff' },
  A:    { bg: '#1f9d1f', fg: '#ffffff' },
  B:    { bg: '#67c23a', fg: '#ffffff' },
  'B-': { bg: '#a4d65e', fg: '#1c1b1f' },
  C:    { bg: '#f0c419', fg: '#1c1b1f' },
  D:    { bg: '#f39c12', fg: '#ffffff' },
  E:    { bg: '#e67e22', fg: '#ffffff' },
  F:    { bg: '#c0392b', fg: '#ffffff' },
};

/**
 * PT Energy Certificate (Certificado Energético) checker.
 *
 * Validates expiry, shows class badge, computes potential savings
 * and surfaces legal compliance per DL 118/2013. Mandatory for any
 * sale/rental listing in PT.
 *
 * @example
 * <iu-energy-certificate-checker />
 */
@Component({
  selector: 'iu-energy-certificate-checker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ec-root">
      <header class="ec-header">
        <div>
          <h2 class="ec-title">Certificado Energético</h2>
          <p class="ec-subtitle">Validação ADENE · obrigatório para listing PT (DL 118/2013)</p>
        </div>
        <button type="button" class="ec-reset" (click)="svc.reset()">Reset</button>
      </header>

      <div class="ec-grid">
        <section class="ec-inputs">
          <label class="ec-field">
            <span class="ec-label">Número do certificado</span>
            <input type="text" class="ec-input"
              [value]="svc.numeroCertificado()" (input)="setNumero($event)" />
          </label>

          <label class="ec-field">
            <span class="ec-label">Classe energética</span>
            <select class="ec-input" [value]="svc.classe()" (change)="setClasse($event)">
              @for (c of classes; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>

          <label class="ec-field">
            <span class="ec-label">Data de emissão</span>
            <input type="date" class="ec-input"
              [value]="svc.dataEmissao()" (input)="setData($event)" />
          </label>

          <label class="ec-field">
            <span class="ec-label">Tipo de imóvel</span>
            <select class="ec-input" [value]="svc.tipoImovel()" (change)="setTipo($event)">
              @for (t of tipos; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
            <span class="ec-helper">Validade default: habitação 10 anos · comércio/serviços 6 anos</span>
          </label>

          <label class="ec-field">
            <span class="ec-label">Validade (anos)</span>
            <input type="number" min="1" max="20" step="1" class="ec-input"
              [value]="svc.validadeAnos()" (input)="setValidade($event)" />
          </label>

          <label class="ec-field">
            <span class="ec-label">Área útil (m²)</span>
            <span class="ec-helper">Usada na estimativa de poupança kWh/ano</span>
            <input type="number" min="0" step="1" class="ec-input"
              [value]="svc.areaM2()" (input)="setArea($event)" />
          </label>
        </section>

        <section class="ec-outputs">
          <div class="ec-badge-wrap">
            <span class="ec-badge"
              [style.background]="badgeColor().bg"
              [style.color]="badgeColor().fg">
              {{ svc.classe() }}
            </span>
            <span class="ec-badge-label">Classe atual</span>
          </div>

          <div class="ec-out" [class.ec-out--alert]="!svc.valido()" [class.ec-out--ok]="svc.valido()">
            <span class="ec-out-label">{{ svc.valido() ? 'Válido' : 'Expirado' }}</span>
            <span class="ec-out-value">
              {{ svc.valido() ? svc.diasParaExpirar() + ' dias restantes' : Math.abs(svc.diasParaExpirar()) + ' dias expirado' }}
            </span>
            <span class="ec-out-detail">Expira a {{ svc.dataExpiracao() }}</span>
          </div>

          <div class="ec-out">
            <span class="ec-out-label">Poupança potencial vs classe A</span>
            <span class="ec-out-value-sm">{{ svc.economiaPotencialKwhAno() | number:'1.0-0' }} kWh/ano</span>
            <span class="ec-out-detail">
              Para área {{ svc.areaM2() }} m² · referência {{ refClassUpperTxt() }}
            </span>
          </div>

          <div class="ec-out ec-out--legal">
            <span class="ec-out-label">Multa legal sem CE válido</span>
            <span class="ec-out-value-sm">{{ svc.multaSemCertificado().min }} – {{ svc.multaSemCertificado().max }} €</span>
            <span class="ec-out-detail">Art. 18.º DL 118/2013</span>
          </div>
        </section>
      </div>

      <section class="ec-recommend">
        <h3 class="ec-section-title">Recomendação</h3>
        <p class="ec-recommend-text">{{ svc.recomendacaoMelhoria() }}</p>
      </section>

      <footer class="ec-footer">
        <span class="ec-bench-dot"></span>
        Tabela classes ADENE: A+ ≤25 · A 26–50 · B 51–100 · B- 101–150 · C 151–200 · D 201–250 · E 251–350 · F &gt;350 (kWh/m²/ano).
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ec-root {
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

    .ec-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .ec-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ec-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ec-reset {
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-family: inherit;
    }

    .ec-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .ec-inputs, .ec-outputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ec-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ec-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ec-helper {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ec-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .ec-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 9px 11px;
    }

    .ec-badge-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
    }
    .ec-badge {
      width: 96px;
      height: 96px;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -1px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
    }
    .ec-badge-label {
      font-size: 11px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ec-out {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ec-out--ok {
      background: #e6f4ea;
      border-left: 4px solid #1f9d1f;
    }
    .ec-out--alert {
      background: #fde8e6;
      border-left: 4px solid #c0392b;
    }
    .ec-out--legal {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
    }
    .ec-out-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ec-out-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ec-out-value-sm {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ec-out-detail {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ec-recommend {
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .ec-recommend-text {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      line-height: 1.5;
    }
    .ec-section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .ec-footer {
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ec-bench-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary, #6750a4);
    }

    @media (max-width: 720px) {
      .ec-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class EnergyCertificateCheckerComponent {
  protected readonly svc = inject(EnergyCertificateService);
  protected readonly Math = Math;
  protected readonly classes = PT_ENERGY_CLASS_ORDER;
  protected readonly tipos = PROPERTY_TYPES;

  protected readonly badgeColor = computed(() => CLASS_BADGE_COLORS[this.svc.classe()]);

  protected readonly refClassUpperTxt = computed(() => {
    const cls = this.svc.classe();
    if (cls === 'A+' || cls === 'A') return 'já no benchmark';
    return `classe ${cls} → A`;
  });

  protected setNumero(e: Event): void {
    this.svc.setNumero((e.target as HTMLInputElement).value);
  }
  protected setClasse(e: Event): void {
    this.svc.setClasse((e.target as HTMLSelectElement).value as EnergyClass);
  }
  protected setData(e: Event): void {
    this.svc.setDataEmissao((e.target as HTMLInputElement).value);
  }
  protected setTipo(e: Event): void {
    this.svc.setTipoImovel((e.target as HTMLSelectElement).value as EnergyPropertyType);
  }
  protected setValidade(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setValidadeAnos(n);
  }
  protected setArea(e: Event): void {
    const n = Number((e.target as HTMLInputElement).value);
    this.svc.setAreaM2(n);
  }
}
