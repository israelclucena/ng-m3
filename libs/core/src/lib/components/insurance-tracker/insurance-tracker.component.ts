import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InsuranceTrackerService,
  InsurancePolicy,
  InsuranceType,
} from '../../services/insurance-tracker.service';

type Tab = 'active' | 'expiring' | 'expired';

interface NewPolicyDraft {
  propertyId: string;
  insurer: string;
  policyNumber: string;
  type: InsuranceType;
  startDate: string;
  endDate: string;
  premium: number;
}

const emptyDraft = (): NewPolicyDraft => ({
  propertyId: '',
  insurer: '',
  policyNumber: '',
  type: 'multirriscos',
  startDate: '',
  endDate: '',
  premium: 0,
});

const TYPE_LABEL: Record<InsuranceType, string> = {
  multirriscos: 'Multirriscos',
  rc: 'Resp. Civil',
  conteudo: 'Conteúdo',
};

const DAY_MS = 86_400_000;

const daysBetween = (a: string, b: string): number => {
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / DAY_MS);
};

/**
 * Visual companion for {@link InsuranceTrackerService}.
 *
 * Three-tab layout (Activas / A expirar / Expiradas) listing policies as
 * cards grouped by type, with quick-actions to renew or remove. A modal
 * form adds new policies. M3 tokens, signals only, no `@material/web`.
 *
 * @example
 * <iu-insurance-tracker />
 */
@Component({
  selector: 'iu-insurance-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="it-root">
      <header class="it-header">
        <div>
          <h2 class="it-title">Seguros do Imóvel</h2>
          <p class="it-subtitle">
            {{ svc.activePolicies().length }} activas · {{ svc.expiringSoon().length }} a expirar · {{ svc.expired().length }} expiradas
          </p>
        </div>
        <button type="button" class="it-add" (click)="openForm()">
          + Adicionar apólice
        </button>
      </header>

      <nav class="it-tabs" role="tablist">
        <button
          role="tab"
          type="button"
          class="it-tab"
          [class.it-tab--active]="tab() === 'active'"
          (click)="tab.set('active')"
        >
          Activas
          <span class="it-tab-count">{{ svc.activePolicies().length }}</span>
        </button>
        <button
          role="tab"
          type="button"
          class="it-tab"
          [class.it-tab--active]="tab() === 'expiring'"
          [class.it-tab--warn]="svc.expiringSoon().length > 0"
          (click)="tab.set('expiring')"
        >
          A expirar (30 dias)
          <span class="it-tab-count">{{ svc.expiringSoon().length }}</span>
        </button>
        <button
          role="tab"
          type="button"
          class="it-tab"
          [class.it-tab--active]="tab() === 'expired'"
          [class.it-tab--alert]="svc.expired().length > 0"
          (click)="tab.set('expired')"
        >
          Expiradas
          <span class="it-tab-count">{{ svc.expired().length }}</span>
        </button>
      </nav>

      @let list = currentList();
      @if (list.length === 0) {
        <div class="it-empty">
          <p class="it-empty-title">{{ emptyTitle() }}</p>
          <p class="it-empty-line">{{ emptyHint() }}</p>
          @if (tab() === 'active') {
            <button type="button" class="it-empty-cta" (click)="openForm()">
              Registar primeira apólice
            </button>
          }
        </div>
      } @else {
        <ul class="it-list">
          @for (p of list; track p.id) {
            <li class="it-card" [attr.data-status]="statusOf(p)">
              <header class="it-card-head">
                <div class="it-card-titleblock">
                  <span class="it-card-type" [attr.data-type]="p.type">{{ typeLabel(p.type) }}</span>
                  <h3 class="it-card-title">{{ p.insurer }}</h3>
                  <span class="it-card-meta">Apólice {{ p.policyNumber }} · imóvel {{ p.propertyId }}</span>
                </div>
                <div class="it-card-premium">
                  <span class="it-card-premium-value">{{ p.premium | number:'1.0-0' }} €</span>
                  <span class="it-card-premium-label">prémio anual</span>
                </div>
              </header>
              <div class="it-card-body">
                <div class="it-card-range">
                  <span class="it-range-label">Início</span>
                  <span class="it-range-value">{{ p.startDate }}</span>
                </div>
                <div class="it-card-range">
                  <span class="it-range-label">Fim</span>
                  <span class="it-range-value">{{ p.endDate }}</span>
                </div>
                <div class="it-card-range">
                  <span class="it-range-label">Estado</span>
                  <span class="it-range-value it-range-status">{{ statusLine(p) }}</span>
                </div>
              </div>
              <footer class="it-card-actions">
                @if (statusOf(p) !== 'active' || daysLeft(p) <= 30) {
                  <button type="button" class="it-act it-act--primary" (click)="renew(p)">
                    Renovar +1 ano
                  </button>
                }
                <button type="button" class="it-act it-act--ghost" (click)="svc.removePolicy(p.id)">
                  Remover
                </button>
              </footer>
            </li>
          }
        </ul>
      }

      @if (formOpen()) {
        <div class="it-modal-backdrop" (click)="closeForm()">
          <form class="it-modal" (click)="$event.stopPropagation()" (submit)="submit($event)">
            <header class="it-modal-head">
              <h3 class="it-modal-title">Nova apólice</h3>
              <button type="button" class="it-modal-close" aria-label="Fechar" (click)="closeForm()">×</button>
            </header>
            <div class="it-modal-grid">
              <label class="it-field">
                <span class="it-label">Tipo</span>
                <select class="it-input" [value]="draft().type" (change)="setType($event)">
                  <option value="multirriscos">Multirriscos</option>
                  <option value="rc">Responsabilidade Civil</option>
                  <option value="conteudo">Conteúdo</option>
                </select>
              </label>
              <label class="it-field">
                <span class="it-label">Imóvel (ID)</span>
                <input class="it-input" type="text" [value]="draft().propertyId" (input)="setField('propertyId', $event)" required />
              </label>
              <label class="it-field">
                <span class="it-label">Seguradora</span>
                <input class="it-input" type="text" [value]="draft().insurer" (input)="setField('insurer', $event)" required />
              </label>
              <label class="it-field">
                <span class="it-label">Nº de apólice</span>
                <input class="it-input" type="text" [value]="draft().policyNumber" (input)="setField('policyNumber', $event)" required />
              </label>
              <label class="it-field">
                <span class="it-label">Início</span>
                <input class="it-input" type="date" [value]="draft().startDate" (input)="setField('startDate', $event)" required />
              </label>
              <label class="it-field">
                <span class="it-label">Fim</span>
                <input class="it-input" type="date" [value]="draft().endDate" (input)="setField('endDate', $event)" required />
              </label>
              <label class="it-field it-field--span2">
                <span class="it-label">Prémio anual (€)</span>
                <input class="it-input" type="number" min="0" step="1" [value]="draft().premium" (input)="setPremium($event)" required />
              </label>
            </div>
            <footer class="it-modal-actions">
              <button type="button" class="it-act it-act--ghost" (click)="closeForm()">Cancelar</button>
              <button type="submit" class="it-act it-act--primary" [disabled]="!canSubmit()">Adicionar</button>
            </footer>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .it-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 1100px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .it-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .it-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .it-add {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
      border-radius: 20px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .it-add:hover { filter: brightness(1.05); }

    .it-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .it-tab {
      background: transparent;
      border: none;
      padding: 10px 16px 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }
    .it-tab:hover {
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-tab--active {
      color: var(--md-sys-color-primary, #6750a4);
      border-bottom-color: var(--md-sys-color-primary, #6750a4);
    }
    .it-tab--warn .it-tab-count {
      background: #FFB300;
      color: #3F2A00;
    }
    .it-tab--alert .it-tab-count {
      background: var(--md-sys-color-error, #b3261e);
      color: var(--md-sys-color-on-error, #fff);
    }
    .it-tab-count {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 10px;
      padding: 1px 8px;
      font-size: 11px;
      font-weight: 700;
    }

    .it-empty {
      padding: 48px 24px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      text-align: center;
    }
    .it-empty-title {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-empty-line {
      margin: 0 0 16px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .it-empty-cta {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
      border-radius: 20px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }

    .it-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 12px;
    }
    .it-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-left: 4px solid var(--md-sys-color-primary, #6750a4);
    }
    .it-card[data-status="expiring"] {
      border-left-color: #FFB300;
    }
    .it-card[data-status="expired"] {
      border-left-color: var(--md-sys-color-error, #b3261e);
      background: var(--md-sys-color-error-container, #f9dedc);
    }

    .it-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .it-card-titleblock {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .it-card-type {
      align-self: flex-start;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 8px;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }
    .it-card-type[data-type="rc"] {
      background: #DDE7F4;
      color: #163C66;
    }
    .it-card-type[data-type="conteudo"] {
      background: #E5F0DD;
      color: #2F4A1A;
    }
    .it-card-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-card-meta {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .it-card-premium {
      text-align: right;
      display: flex;
      flex-direction: column;
    }
    .it-card-premium-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-card-premium-label {
      font-size: 10px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .it-card-body {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .it-card-range {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .it-range-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .it-range-value {
      font-size: 12px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-range-status {
      font-weight: 600;
    }

    .it-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .it-act {
      border-radius: 16px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .it-act:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .it-act--primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
    }
    .it-act--ghost {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .it-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .it-modal {
      background: var(--md-sys-color-surface-container-high, #fff);
      border-radius: 16px;
      padding: 24px;
      max-width: 560px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: var(--md-sys-elevation-level3, 0 6px 16px rgba(0,0,0,.18));
    }
    .it-modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .it-modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-modal-close {
      background: transparent;
      border: none;
      font-size: 24px;
      line-height: 1;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
    }
    .it-modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .it-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .it-field--span2 {
      grid-column: span 2;
    }
    .it-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .it-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 14px;
      font-family: inherit;
    }
    .it-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 7px 9px;
    }
    .it-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (max-width: 640px) {
      .it-card-body { grid-template-columns: 1fr 1fr; }
      .it-modal-grid { grid-template-columns: 1fr; }
      .it-field--span2 { grid-column: auto; }
    }
  `],
})
export class InsuranceTrackerComponent {
  protected readonly svc = inject(InsuranceTrackerService);

  protected readonly tab = signal<Tab>('active');
  protected readonly formOpen = signal(false);
  protected readonly draft = signal<NewPolicyDraft>(emptyDraft());

  protected readonly currentList = computed<readonly InsurancePolicy[]>(() => {
    switch (this.tab()) {
      case 'active':   return this.svc.activePolicies();
      case 'expiring': return this.svc.expiringSoon();
      case 'expired':  return this.svc.expired();
    }
  });

  protected readonly emptyTitle = computed(() => {
    switch (this.tab()) {
      case 'active':   return 'Sem apólices activas';
      case 'expiring': return 'Nenhuma apólice a expirar';
      case 'expired':  return 'Sem apólices expiradas';
    }
  });

  protected readonly emptyHint = computed(() => {
    switch (this.tab()) {
      case 'active':   return 'Regista a primeira apólice para começar a acompanhar coberturas.';
      case 'expiring': return 'Tudo em ordem nos próximos 30 dias.';
      case 'expired':  return 'Não há apólices fora do prazo.';
    }
  });

  protected readonly canSubmit = computed(() => {
    const d = this.draft();
    return !!d.propertyId && !!d.insurer && !!d.policyNumber && !!d.startDate && !!d.endDate && d.premium > 0;
  });

  protected typeLabel(t: InsuranceType): string {
    return TYPE_LABEL[t];
  }

  protected daysLeft(p: InsurancePolicy): number {
    return daysBetween(this.svc.today(), p.endDate);
  }

  protected statusOf(p: InsurancePolicy): 'active' | 'expiring' | 'expired' {
    const d = this.daysLeft(p);
    if (d < 0) return 'expired';
    if (d <= 30) return 'expiring';
    return 'active';
  }

  protected statusLine(p: InsurancePolicy): string {
    const d = this.daysLeft(p);
    if (d < 0) return `Expirada há ${Math.abs(d)} dia(s)`;
    if (d === 0) return 'Expira hoje';
    if (d <= 30) return `Expira em ${d} dia(s)`;
    return `${d} dias restantes`;
  }

  protected openForm(): void {
    this.draft.set(emptyDraft());
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected setField(key: keyof Omit<NewPolicyDraft, 'type' | 'premium'>, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.draft.update(d => ({ ...d, [key]: v }));
  }

  protected setType(e: Event): void {
    const v = (e.target as HTMLSelectElement).value as InsuranceType;
    this.draft.update(d => ({ ...d, type: v }));
  }

  protected setPremium(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    const n = Number(raw);
    this.draft.update(d => ({ ...d, premium: Number.isFinite(n) && n >= 0 ? n : 0 }));
  }

  protected submit(e: Event): void {
    e.preventDefault();
    if (!this.canSubmit()) return;
    this.svc.addPolicy(this.draft());
    this.closeForm();
  }

  protected renew(p: InsurancePolicy): void {
    const base = Date.parse(p.endDate);
    if (Number.isNaN(base)) return;
    const next = new Date(base + 365 * DAY_MS).toISOString().slice(0, 10);
    this.svc.renewPolicy(p.id, next);
  }
}
