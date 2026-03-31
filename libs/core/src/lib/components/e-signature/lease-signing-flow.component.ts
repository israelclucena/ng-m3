/**
 * @fileoverview LeaseSigningFlowComponent — Sprint 036
 *
 * `iu-lease-signing-flow` — Orchestrates the dual-signature lease signing flow.
 *
 * Step-by-step flow:
 *   1. Landlord reviews the lease summary and draws their signature.
 *   2. Confirmation screen — "Waiting for tenant..."
 *   3. Tenant reviews and draws their signature.
 *   4. Both signatures displayed — lease transitions to ACTIVE.
 *
 * Integrates with SignatureStateService and LeaseAgreementService.
 *
 * Feature flag: E_SIGNATURE_MODULE
 *
 * @example
 * ```html
 * <iu-lease-signing-flow
 *   [leaseId]="'lease-001'"
 *   [currentRole]="'landlord'"
 *   [currentUserName]="'João Costa'"
 *   (completed)="onFlowCompleted($event)" />
 * ```
 */
import {
  Component, input, output, inject, signal, computed, OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignaturePadComponent } from './signature-pad.component';
import { SignatureStateService, SignerRole } from '../../services/signature-state.service';
import { LeaseAgreementService } from '../../services/lease-agreement.service';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-lease-signing-flow`
 *
 * Multi-step signing orchestrator. Shows the correct step based on current
 * signing state and current user's role. Emits `completed` when both parties
 * have signed and the lease becomes active.
 *
 * Feature flag: E_SIGNATURE_MODULE
 */
@Component({
  selector: 'iu-lease-signing-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SignaturePadComponent],
  template: `
    <div class="lsf-container">
      <!-- Header -->
      <div class="lsf-header">
        <span class="material-symbols-outlined lsf-header-icon">verified</span>
        <div>
          <h2 class="lsf-title">Assinatura Digital do Contrato</h2>
          <p class="lsf-subtitle">{{ lease()?.propertyTitle }}</p>
        </div>
        <div class="lsf-progress">
          <div class="lsf-step" [class.lsf-step--done]="landlordDone()" [class.lsf-step--active]="isLandlordStep()">
            <span class="material-symbols-outlined">{{ landlordDone() ? 'check_circle' : 'business_center' }}</span>
            <span>Senhorio</span>
          </div>
          <div class="lsf-connector" [class.lsf-connector--active]="landlordDone()"></div>
          <div class="lsf-step" [class.lsf-step--done]="tenantDone()" [class.lsf-step--active]="isTenantStep()">
            <span class="material-symbols-outlined">{{ tenantDone() ? 'check_circle' : 'person' }}</span>
            <span>Inquilino</span>
          </div>
        </div>
      </div>

      @switch (sigSvc.state()) {

        <!-- IDLE / not started -->
        @case ('idle') {
          <div class="lsf-idle">
            <div class="lsf-idle-icon">
              <span class="material-symbols-outlined">description</span>
            </div>
            <h3>Iniciar Processo de Assinatura</h3>
            <p>O senhorio deve assinar primeiro. Em seguida, o inquilino receberá uma notificação para assinar.</p>
            @if (currentRole() === 'landlord') {
              <button type="button" class="lsf-btn lsf-btn--filled" (click)="startFlow()">
                <span class="material-symbols-outlined">draw</span>
                Começar a Assinar
              </button>
            } @else {
              <p class="lsf-waiting-msg">
                <span class="material-symbols-outlined">hourglass_top</span>
                A aguardar a assinatura do senhorio...
              </p>
            }
          </div>
        }

        <!-- LANDLORD PENDING — landlord draws signature -->
        @case ('landlord_pending') {
          <div class="lsf-step-section">
            <div class="lsf-step-header">
              <span class="lsf-step-num">1</span>
              <div>
                <h3 class="lsf-step-title">Assinatura do Senhorio</h3>
                <p class="lsf-step-desc">Reveja o contrato e assine na área abaixo.</p>
              </div>
            </div>

            <!-- Lease summary -->
            @if (lease()) {
              <div class="lsf-summary">
                <div class="lsf-summary-row">
                  <span>Propriedade</span><strong>{{ lease()!.propertyTitle }}</strong>
                </div>
                <div class="lsf-summary-row">
                  <span>Inquilino</span><strong>{{ lease()!.tenantName }}</strong>
                </div>
                <div class="lsf-summary-row">
                  <span>Renda</span><strong>{{ lease()!.monthlyRent }}€/mês</strong>
                </div>
                <div class="lsf-summary-row">
                  <span>Duração</span><strong>{{ lease()!.startDate }} → {{ lease()!.endDate }}</strong>
                </div>
              </div>
            }

            <iu-signature-pad
              label="Assinatura do Senhorio"
              [signerName]="currentUserName()"
              (confirmed)="onLandlordSigned($event)"
            />

            <label class="lsf-consent">
              <input type="checkbox" [(ngModel)]="consentChecked" />
              Li e aceito todos os termos e condições do contrato de arrendamento.
            </label>
          </div>
        }

        <!-- LANDLORD SIGNED — waiting for tenant -->
        @case ('landlord_signed') {
          <div class="lsf-wait-panel">
            <div class="lsf-sig-preview">
              <div class="lsf-sig-preview-label">
                <span class="material-symbols-outlined">check_circle</span>
                Assinatura do Senhorio Capturada
              </div>
              @if (sigSvc.landlordSignature(); as sig) {
                <img [src]="sig.dataUrl" class="lsf-sig-img" alt="Assinatura do senhorio" />
                <p class="lsf-sig-date">{{ formatDate(sig.signedAt) }}</p>
              }
            </div>

            @if (currentRole() === 'landlord') {
              <div class="lsf-wait-msg">
                <span class="material-symbols-outlined lsf-wait-icon">schedule</span>
                <p>A aguardar que o inquilino <strong>{{ lease()?.tenantName }}</strong> assine...</p>
                <button type="button" class="lsf-btn lsf-btn--outlined" (click)="sigSvc.advanceToTenant()">
                  <span class="material-symbols-outlined">arrow_forward</span>
                  Enviar para o Inquilino (Demo)
                </button>
              </div>
            } @else {
              <!-- Tenant sees this — landlord signed, now it's their turn -->
              <div class="lsf-tenant-cta">
                <p>O senhorio já assinou. É agora a sua vez.</p>
                <button type="button" class="lsf-btn lsf-btn--filled" (click)="sigSvc.advanceToTenant()">
                  <span class="material-symbols-outlined">draw</span>
                  Assinar Agora
                </button>
              </div>
            }
          </div>
        }

        <!-- TENANT PENDING — tenant draws signature -->
        @case ('tenant_pending') {
          <div class="lsf-step-section">
            <div class="lsf-step-header">
              <span class="lsf-step-num">2</span>
              <div>
                <h3 class="lsf-step-title">Assinatura do Inquilino</h3>
                <p class="lsf-step-desc">O senhorio já assinou. Agora é a sua vez.</p>
              </div>
            </div>

            <!-- Landlord signature preview -->
            @if (sigSvc.landlordSignature(); as sig) {
              <div class="lsf-prev-sig">
                <span class="material-symbols-outlined">check_circle</span>
                <span>{{ sig.signerName }} assinou em {{ formatDate(sig.signedAt) }}</span>
                <img [src]="sig.dataUrl" class="lsf-prev-sig-img" alt="Assinatura do senhorio" />
              </div>
            }

            <iu-signature-pad
              label="Assinatura do Inquilino"
              [signerName]="currentUserName()"
              (confirmed)="onTenantSigned($event)"
            />
          </div>
        }

        <!-- COMPLETED — both signed -->
        @case ('completed') {
          <div class="lsf-complete">
            <div class="lsf-complete-icon">
              <span class="material-symbols-outlined">verified</span>
            </div>
            <h3 class="lsf-complete-title">Contrato Assinado!</h3>
            <p class="lsf-complete-subtitle">
              Ambas as partes assinaram. O contrato está agora activo.
            </p>

            <div class="lsf-sigs-row">
              @if (sigSvc.landlordSignature(); as lsig) {
                <div class="lsf-final-sig">
                  <div class="lsf-final-sig-label">
                    <span class="material-symbols-outlined">business_center</span>
                    Senhorio — {{ lsig.signerName }}
                  </div>
                  <img [src]="lsig.dataUrl" class="lsf-sig-img" alt="Assinatura do senhorio" />
                  <p class="lsf-sig-date">{{ formatDate(lsig.signedAt) }}</p>
                </div>
              }
              @if (sigSvc.tenantSignature(); as tsig) {
                <div class="lsf-final-sig">
                  <div class="lsf-final-sig-label">
                    <span class="material-symbols-outlined">person</span>
                    Inquilino — {{ tsig.signerName }}
                  </div>
                  <img [src]="tsig.dataUrl" class="lsf-sig-img" alt="Assinatura do inquilino" />
                  <p class="lsf-sig-date">{{ formatDate(tsig.signedAt) }}</p>
                </div>
              }
            </div>

            <div class="lsf-complete-actions">
              <button type="button" class="lsf-btn lsf-btn--filled" (click)="emitCompleted()">
                <span class="material-symbols-outlined">open_in_new</span>
                Ver Contrato Activo
              </button>
              <button type="button" class="lsf-btn lsf-btn--outlined" (click)="sigSvc.resetFlow()">
                Fechar
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .lsf-container {
      background: var(--md-sys-color-surface);
      border-radius: 20px;
      padding: 28px;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .lsf-header {
      display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap;
    }
    .lsf-header-icon { font-size: 36px; color: var(--md-sys-color-primary); }
    .lsf-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--md-sys-color-on-surface); }
    .lsf-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant); }
    .lsf-progress {
      margin-left: auto;
      display: flex; align-items: center; gap: 8px;
    }
    .lsf-step {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      font-size: 11px; font-weight: 600; color: var(--md-sys-color-on-surface-variant);
      transition: color 0.2s;
    }
    .lsf-step .material-symbols-outlined { font-size: 20px; }
    .lsf-step--active { color: var(--md-sys-color-primary); }
    .lsf-step--done { color: var(--md-sys-color-primary); }
    .lsf-connector {
      width: 32px; height: 2px;
      background: var(--md-sys-color-outline-variant);
      border-radius: 1px; transition: background 0.3s;
    }
    .lsf-connector--active { background: var(--md-sys-color-primary); }
    /* Idle */
    .lsf-idle {
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      padding: 32px; text-align: center;
    }
    .lsf-idle-icon .material-symbols-outlined { font-size: 56px; color: var(--md-sys-color-primary); }
    .lsf-idle h3 { margin: 0; font-size: 18px; color: var(--md-sys-color-on-surface); }
    .lsf-idle p { margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant); max-width: 400px; }
    .lsf-waiting-msg {
      display: flex; align-items: center; gap: 6px;
      font-size: 14px; color: var(--md-sys-color-on-surface-variant);
    }
    /* Step section */
    .lsf-step-section { display: flex; flex-direction: column; gap: 16px; }
    .lsf-step-header { display: flex; align-items: flex-start; gap: 14px; }
    .lsf-step-num {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .lsf-step-title { margin: 0; font-size: 17px; font-weight: 700; color: var(--md-sys-color-on-surface); }
    .lsf-step-desc { margin: 4px 0 0; font-size: 13px; color: var(--md-sys-color-on-surface-variant); }
    /* Summary */
    .lsf-summary {
      background: var(--md-sys-color-surface-container-low);
      border-radius: 12px; padding: 14px 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .lsf-summary-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; color: var(--md-sys-color-on-surface-variant);
    }
    .lsf-summary-row strong { color: var(--md-sys-color-on-surface); font-weight: 600; }
    /* Consent */
    .lsf-consent {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 13px; color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
    }
    /* Wait panel */
    .lsf-wait-panel { display: flex; flex-direction: column; gap: 20px; }
    .lsf-sig-preview {
      padding: 16px; border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    .lsf-sig-preview-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: var(--md-sys-color-primary); margin-bottom: 8px;
    }
    .lsf-sig-img {
      max-width: 100%; border-radius: 8px;
      background: #fff; border: 1px solid var(--md-sys-color-outline-variant);
    }
    .lsf-sig-date { margin: 6px 0 0; font-size: 11px; color: var(--md-sys-color-on-surface-variant); }
    .lsf-wait-msg {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 20px; text-align: center; color: var(--md-sys-color-on-surface-variant);
    }
    .lsf-wait-icon { font-size: 40px; color: var(--md-sys-color-secondary); }
    .lsf-wait-msg p { margin: 0; font-size: 14px; }
    .lsf-tenant-cta {
      display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px; text-align: center;
    }
    /* Previous signature strip */
    .lsf-prev-sig {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 10px 14px; border-radius: 10px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container); font-size: 13px;
    }
    .lsf-prev-sig-img { height: 36px; border-radius: 4px; background: #fff; }
    /* Completed */
    .lsf-complete {
      display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 16px;
    }
    .lsf-complete-icon .material-symbols-outlined { font-size: 56px; color: var(--md-sys-color-primary); }
    .lsf-complete-title { margin: 0; font-size: 22px; font-weight: 700; color: var(--md-sys-color-on-surface); }
    .lsf-complete-subtitle { margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant); }
    .lsf-sigs-row { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; width: 100%; }
    .lsf-final-sig {
      flex: 1; min-width: 200px; max-width: 280px;
      padding: 14px; border-radius: 12px;
      border: 1.5px solid var(--md-sys-color-primary);
      display: flex; flex-direction: column; gap: 8px;
    }
    .lsf-final-sig-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600; color: var(--md-sys-color-primary);
    }
    .lsf-complete-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    /* Buttons */
    .lsf-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 20px;
      font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
    }
    .lsf-btn--filled { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .lsf-btn--outlined {
      border: 1.5px solid var(--md-sys-color-primary);
      background: transparent; color: var(--md-sys-color-primary);
    }
  `],
})
export class LeaseSigningFlowComponent implements OnInit {
  readonly sigSvc = inject(SignatureStateService);
  private readonly leaseSvc = inject(LeaseAgreementService);

  /** @input The lease ID to sign */
  readonly leaseId = input.required<string>();

  /** @input The current user's role in this flow */
  readonly currentRole = input.required<SignerRole>();

  /** @input Display name of the current user */
  readonly currentUserName = input.required<string>();

  /** @output Emits lease ID when both parties have signed */
  readonly completed = output<string>();

  consentChecked = false;

  readonly lease = computed(() => {
    const id = this.leaseId();
    return id ? this.leaseSvc.getById(id) : null;
  });

  readonly landlordDone = computed(() => {
    const s = this.sigSvc.state();
    return s === 'landlord_signed' || s === 'tenant_pending' || s === 'tenant_signed' || s === 'completed';
  });

  readonly tenantDone = computed(() => {
    const s = this.sigSvc.state();
    return s === 'tenant_signed' || s === 'completed';
  });

  readonly isLandlordStep = computed(() => this.sigSvc.state() === 'landlord_pending');
  readonly isTenantStep = computed(() => this.sigSvc.state() === 'tenant_pending');

  ngOnInit(): void {
    // Auto-start if already idle
    if (this.sigSvc.state() === 'idle') {
      // Don't auto-start; let the user trigger
    }
  }

  startFlow(): void {
    this.sigSvc.startFlow(this.leaseId(), 'landlord');
  }

  onLandlordSigned(dataUrl: string): void {
    this.sigSvc.captureSignature('landlord', dataUrl, this.currentUserName());
  }

  onTenantSigned(dataUrl: string): void {
    this.sigSvc.captureSignature('tenant', dataUrl, this.currentUserName());
  }

  emitCompleted(): void {
    this.completed.emit(this.leaseId());
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
