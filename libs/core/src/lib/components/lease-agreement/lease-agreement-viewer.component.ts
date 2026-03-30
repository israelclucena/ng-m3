/**
 * @fileoverview LeaseAgreementViewerComponent — Sprint 035
 *
 * `iu-lease-agreement-viewer` — View a lease agreement in full with signing support.
 *
 * Shows all lease details, attached documents, signature status, and a sign CTA.
 * Accepts the full `LeaseAgreement` object or just a lease ID to look up.
 *
 * Feature flag: LEASE_VIEWER
 *
 * @example
 * ```html
 * <iu-lease-agreement-viewer
 *   [leaseId]="'lease-001'"
 *   [currentUserId]="'tenant-001'"
 *   [currentUserRole]="'tenant'"
 *   (signed)="onSigned($event)" />
 * ```
 */
import { Component, input, output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LeaseAgreementService,
  LeaseAgreement,
  LeaseStatus,
} from '../../services/lease-agreement.service';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-lease-agreement-viewer`
 *
 * Read-only + sign-action viewer for a lease agreement.
 * Shows status badge, parties, financial terms, document list, and sign CTA.
 *
 * Feature flag: LEASE_VIEWER
 */
@Component({
  selector: 'iu-lease-agreement-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lav-container">
      @if (!lease()) {
        <div class="lav-empty">
          <span class="material-symbols-outlined">description</span>
          <p>Contrato não encontrado.</p>
        </div>
      } @else {
        <!-- Header bar -->
        <div class="lav-header">
          <div class="lav-header-info">
            <span class="material-symbols-outlined lav-doc-icon">description</span>
            <div>
              <h2 class="lav-title">Contrato de Arrendamento</h2>
              <p class="lav-subtitle">{{ lease()!.propertyTitle }}</p>
            </div>
          </div>
          <span class="lav-status-badge" [attr.data-status]="lease()!.status">
            <span class="material-symbols-outlined">{{ statusIcon(lease()!.status) }}</span>
            {{ statusLabel(lease()!.status) }}
          </span>
        </div>

        <!-- Parties -->
        <div class="lav-section">
          <h3 class="lav-section-title">Partes</h3>
          <div class="lav-parties">
            <div class="lav-party">
              <span class="material-symbols-outlined">person</span>
              <div>
                <div class="lav-party-role">Inquilino</div>
                <div class="lav-party-name">{{ lease()!.tenantName }}</div>
                <div class="lav-sig-status" [class.signed]="lease()!.signedByTenant">
                  <span class="material-symbols-outlined">{{ lease()!.signedByTenant ? 'check_circle' : 'pending' }}</span>
                  {{ lease()!.signedByTenant ? 'Assinado em ' + formatDate(lease()!.tenantSignedAt) : 'Aguarda assinatura' }}
                </div>
              </div>
            </div>
            <div class="lav-party-divider">
              <span class="material-symbols-outlined">handshake</span>
            </div>
            <div class="lav-party">
              <span class="material-symbols-outlined">business_center</span>
              <div>
                <div class="lav-party-role">Senhorio</div>
                <div class="lav-party-name">{{ lease()!.landlordName }}</div>
                <div class="lav-sig-status" [class.signed]="lease()!.signedByLandlord">
                  <span class="material-symbols-outlined">{{ lease()!.signedByLandlord ? 'check_circle' : 'pending' }}</span>
                  {{ lease()!.signedByLandlord ? 'Assinado em ' + formatDate(lease()!.landlordSignedAt) : 'Aguarda assinatura' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Financial terms -->
        <div class="lav-section">
          <h3 class="lav-section-title">Condições Financeiras</h3>
          <div class="lav-terms-grid">
            <div class="lav-term">
              <span class="lav-term-label">Renda Mensal</span>
              <span class="lav-term-value primary">{{ lease()!.monthlyRent | currency:'EUR':'symbol':'1.0-0':'pt' }}</span>
            </div>
            <div class="lav-term">
              <span class="lav-term-label">Depósito</span>
              <span class="lav-term-value">{{ lease()!.depositAmount | currency:'EUR':'symbol':'1.0-0':'pt' }}</span>
            </div>
            <div class="lav-term">
              <span class="lav-term-label">Início</span>
              <span class="lav-term-value">{{ lease()!.startDate }}</span>
            </div>
            <div class="lav-term">
              <span class="lav-term-label">Fim</span>
              <span class="lav-term-value">{{ lease()!.endDate }}</span>
            </div>
            <div class="lav-term">
              <span class="lav-term-label">Tipo</span>
              <span class="lav-term-value">{{ leaseTypeLabel(lease()!.leaseType) }}</span>
            </div>
            <div class="lav-term">
              <span class="lav-term-label">Morada</span>
              <span class="lav-term-value">{{ lease()!.propertyAddress }}</span>
            </div>
          </div>
        </div>

        <!-- Terms text -->
        <div class="lav-section">
          <h3 class="lav-section-title">Termos e Condições</h3>
          <div class="lav-terms-text">{{ lease()!.terms }}</div>
        </div>

        <!-- Documents -->
        @if (lease()!.documents.length > 0) {
          <div class="lav-section">
            <h3 class="lav-section-title">Documentos</h3>
            <div class="lav-docs">
              @for (doc of lease()!.documents; track doc.id) {
                <a class="lav-doc-item" [href]="doc.url" target="_blank">
                  <span class="material-symbols-outlined">picture_as_pdf</span>
                  <span class="lav-doc-name">{{ doc.name }}</span>
                  <span class="lav-doc-date">{{ formatDate(doc.uploadedAt) }}</span>
                  <span class="material-symbols-outlined lav-doc-dl">download</span>
                </a>
              }
            </div>
          </div>
        }

        <!-- Notes -->
        @if (lease()!.notes) {
          <div class="lav-section">
            <h3 class="lav-section-title">Notas</h3>
            <p class="lav-notes">{{ lease()!.notes }}</p>
          </div>
        }

        <!-- Sign CTA -->
        @if (canSign()) {
          <div class="lav-sign-cta">
            @if (signConfirming()) {
              <div class="lav-sign-confirm">
                <p>Confirma que leu e aceita todos os termos do contrato?</p>
                <div class="lav-sign-confirm-actions">
                  <button class="lav-btn lav-btn--text" (click)="signConfirming.set(false)">Cancelar</button>
                  <button class="lav-btn lav-btn--filled" [disabled]="signing()" (click)="confirmSign()">
                    @if (signing()) {
                      <span class="lav-spinner"></span>
                    } @else {
                      <span class="material-symbols-outlined">draw</span>
                    }
                    Assinar Contrato
                  </button>
                </div>
              </div>
            } @else {
              <button class="lav-btn lav-btn--filled lav-btn--sign" (click)="signConfirming.set(true)">
                <span class="material-symbols-outlined">draw</span>
                Assinar Contrato
              </button>
              <p class="lav-sign-hint">Ao assinar, declara que leu e aceita todos os termos.</p>
            }
          </div>
        }

        @if (signedSuccess()) {
          <div class="lav-sign-success">
            <span class="material-symbols-outlined">check_circle</span>
            <p>Contrato assinado com sucesso!</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .lav-container {
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      padding: 24px;
      max-width: 720px;
    }
    .lav-empty {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 48px; color: var(--md-sys-color-on-surface-variant); text-align: center;
    }
    .lav-empty .material-symbols-outlined { font-size: 48px; }
    .lav-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
    }
    .lav-header-info { display: flex; align-items: center; gap: 12px; }
    .lav-doc-icon { font-size: 32px; color: var(--md-sys-color-primary); }
    .lav-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--md-sys-color-on-surface); }
    .lav-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant); }
    .lav-status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
    }
    .lav-status-badge[data-status="active"] { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .lav-status-badge[data-status="draft"] { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .lav-status-badge[data-status="expired"] { background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
    .lav-status-badge[data-status="terminated"] { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
    .lav-section { margin-bottom: 24px; }
    .lav-section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
      color: var(--md-sys-color-on-surface-variant); margin: 0 0 12px;
    }
    .lav-parties { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .lav-party {
      flex: 1; min-width: 180px;
      display: flex; gap: 10px; align-items: flex-start;
      padding: 14px; border-radius: 12px;
      background: var(--md-sys-color-surface-container);
    }
    .lav-party .material-symbols-outlined { font-size: 24px; color: var(--md-sys-color-primary); margin-top: 2px; }
    .lav-party-role { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--md-sys-color-on-surface-variant); }
    .lav-party-name { font-weight: 600; font-size: 15px; color: var(--md-sys-color-on-surface); margin: 2px 0; }
    .lav-sig-status {
      display: flex; align-items: center; gap: 4px; font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .lav-sig-status .material-symbols-outlined { font-size: 14px; }
    .lav-sig-status.signed { color: var(--md-sys-color-primary); }
    .lav-party-divider {
      display: flex; align-items: center; padding-top: 18px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .lav-terms-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;
    }
    .lav-term {
      padding: 12px 16px; border-radius: 10px;
      background: var(--md-sys-color-surface-container-low);
      display: flex; flex-direction: column; gap: 4px;
    }
    .lav-term-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--md-sys-color-on-surface-variant); }
    .lav-term-value { font-weight: 600; font-size: 15px; color: var(--md-sys-color-on-surface); }
    .lav-term-value.primary { color: var(--md-sys-color-primary); font-size: 18px; }
    .lav-terms-text {
      padding: 16px; border-radius: 10px; white-space: pre-wrap;
      background: var(--md-sys-color-surface-container-low);
      font-size: 13px; line-height: 1.7; color: var(--md-sys-color-on-surface);
      max-height: 300px; overflow-y: auto;
    }
    .lav-docs { display: flex; flex-direction: column; gap: 8px; }
    .lav-doc-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 10px;
      background: var(--md-sys-color-surface-container-low);
      text-decoration: none; color: var(--md-sys-color-on-surface);
      transition: background 0.15s;
    }
    .lav-doc-item:hover { background: var(--md-sys-color-surface-container); }
    .lav-doc-item .material-symbols-outlined { color: var(--md-sys-color-error); }
    .lav-doc-name { flex: 1; font-size: 14px; }
    .lav-doc-date { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .lav-doc-dl { color: var(--md-sys-color-primary) !important; }
    .lav-notes { font-size: 14px; color: var(--md-sys-color-on-surface-variant); line-height: 1.6; }
    .lav-sign-cta {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      margin-top: 24px; padding: 20px;
      border-radius: 12px;
      border: 2px dashed var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
    }
    .lav-sign-confirm { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; text-align: center; }
    .lav-sign-confirm p { margin: 0; font-size: 14px; color: var(--md-sys-color-on-primary-container); }
    .lav-sign-confirm-actions { display: flex; gap: 12px; }
    .lav-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 20px;
      font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
    }
    .lav-btn--text { background: transparent; color: var(--md-sys-color-primary); }
    .lav-btn--filled { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .lav-btn--filled:disabled { opacity: 0.5; cursor: not-allowed; }
    .lav-btn--sign { font-size: 16px; padding: 12px 28px; }
    .lav-sign-hint { font-size: 12px; color: var(--md-sys-color-on-primary-container); margin: 0; }
    .lav-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: lav-spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes lav-spin { to { transform: rotate(360deg); } }
    .lav-sign-success {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      margin-top: 16px; padding: 16px;
      border-radius: 10px; background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container); text-align: center;
    }
    .lav-sign-success .material-symbols-outlined { font-size: 32px; }
  `],
})
export class LeaseAgreementViewerComponent {
  private readonly svc = inject(LeaseAgreementService);

  /** @input Lease ID to look up (alternative to passing full object) */
  readonly leaseId = input<string>();

  /** @input Full lease agreement (takes precedence over leaseId) */
  readonly leaseData = input<LeaseAgreement | null>(null);

  /** @input Current user ID (to determine if they can sign) */
  readonly currentUserId = input.required<string>();

  /** @input Current user role */
  readonly currentUserRole = input.required<'tenant' | 'landlord'>();

  /** @output Emits leaseId when user signs */
  readonly signed = output<string>();

  readonly signConfirming = signal(false);
  readonly signing = signal(false);
  readonly signedSuccess = signal(false);

  /** Resolved lease object */
  readonly lease = computed<LeaseAgreement | null>(() => {
    if (this.leaseData()) return this.leaseData();
    const id = this.leaseId();
    return id ? (this.svc.getById(id) ?? null) : null;
  });

  /** Whether the current user still needs to sign */
  readonly canSign = computed(() => {
    const l = this.lease();
    if (!l || l.status !== 'draft') return false;
    if (this.signedSuccess()) return false;
    const role = this.currentUserRole();
    return role === 'tenant' ? !l.signedByTenant : !l.signedByLandlord;
  });

  statusLabel(status: LeaseStatus): string {
    const map: Record<LeaseStatus, string> = {
      draft: 'Rascunho',
      active: 'Activo',
      expired: 'Expirado',
      terminated: 'Rescindido',
    };
    return map[status];
  }

  statusIcon(status: LeaseStatus): string {
    const map: Record<LeaseStatus, string> = {
      draft: 'edit_document',
      active: 'verified',
      expired: 'schedule',
      terminated: 'cancel',
    };
    return map[status];
  }

  leaseTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'fixed': 'Prazo Fixo',
      'month-to-month': 'Renovação Mensal',
      'short-term': 'Curta Duração',
    };
    return map[type] ?? type;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  confirmSign(): void {
    const l = this.lease();
    if (!l) return;
    this.signing.set(true);
    setTimeout(() => {
      this.svc.sign(l.id, this.currentUserRole());
      this.signing.set(false);
      this.signConfirming.set(false);
      this.signedSuccess.set(true);
      this.signed.emit(l.id);
    }, 600);
  }
}
