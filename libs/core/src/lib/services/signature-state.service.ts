/**
 * @fileoverview SignatureStateService — Sprint 036
 *
 * Tracks the e-signature state for a lease agreement signing flow.
 * Stores the captured signature data URLs for both landlord and tenant,
 * orchestrates signing order, and drives the LeaseSigningFlowComponent.
 *
 * State machine: landlord_pending → landlord_signed → tenant_pending → tenant_signed → completed
 *
 * Feature flag: E_SIGNATURE_MODULE
 *
 * @example
 * ```ts
 * const svc = inject(SignatureStateService);
 * svc.startFlow('lease-001', 'landlord');
 * svc.captureSignature('landlord', dataUrl);
 * svc.state(); // 'landlord_signed'
 * ```
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { LeaseAgreementService } from './lease-agreement.service';
import { NotificationBellService } from '../components/notification-bell/notification-bell.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SigningState =
  | 'idle'
  | 'landlord_pending'
  | 'landlord_signed'
  | 'tenant_pending'
  | 'tenant_signed'
  | 'completed';

export type SignerRole = 'landlord' | 'tenant';

export interface SignatureEntry {
  role: SignerRole;
  /** Data URL of the drawn signature (PNG). */
  dataUrl: string;
  /** ISO timestamp when captured. */
  signedAt: string;
  /** Display name of the signer. */
  signerName: string;
}

export interface SigningFlowState {
  leaseId: string;
  state: SigningState;
  landlordSignature: SignatureEntry | null;
  tenantSignature: SignatureEntry | null;
  completedAt: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * SignatureStateService
 *
 * Signal-based service that orchestrates the dual-signature lease signing flow.
 * Integrates with LeaseAgreementService to persist signature state and with
 * NotificationBellService to notify the other party.
 *
 * Feature flag: E_SIGNATURE_MODULE
 */
@Injectable({ providedIn: 'root' })
export class SignatureStateService {
  private readonly leaseSvc = inject(LeaseAgreementService);
  private readonly notifSvc = inject(NotificationBellService);

  // ─── Private state ─────────────────────────────────────────────────────────
  private readonly _flow = signal<SigningFlowState | null>(null);

  // ─── Public signals ────────────────────────────────────────────────────────

  /** Current flow state, or null if no flow is active. */
  readonly flow = this._flow.asReadonly();

  /** Current signing state. */
  readonly state = computed<SigningState>(() => this._flow()?.state ?? 'idle');

  /** True while any signing step is in progress. */
  readonly isActive = computed(() => this.state() !== 'idle');

  /** True when both parties have signed. */
  readonly isCompleted = computed(() => this.state() === 'completed');

  /** Landlord signature entry, if captured. */
  readonly landlordSignature = computed(() => this._flow()?.landlordSignature ?? null);

  /** Tenant signature entry, if captured. */
  readonly tenantSignature = computed(() => this._flow()?.tenantSignature ?? null);

  // ─── Flow control ──────────────────────────────────────────────────────────

  /**
   * Start a signing flow for a lease.
   * @param leaseId - The lease agreement ID.
   * @param initiatingRole - The role who is signing first (usually 'landlord').
   */
  startFlow(leaseId: string, initiatingRole: SignerRole = 'landlord'): void {
    this._flow.set({
      leaseId,
      state: initiatingRole === 'landlord' ? 'landlord_pending' : 'tenant_pending',
      landlordSignature: null,
      tenantSignature: null,
      completedAt: null,
    });
  }

  /**
   * Capture a signature for the given role and advance the state machine.
   * @param role - Who is signing.
   * @param dataUrl - The canvas PNG data URL.
   * @param signerName - Display name for the confirmation UI.
   */
  captureSignature(role: SignerRole, dataUrl: string, signerName: string): void {
    const flow = this._flow();
    if (!flow) return;

    const entry: SignatureEntry = {
      role,
      dataUrl,
      signedAt: new Date().toISOString(),
      signerName,
    };

    let nextState: SigningState;
    let updated: SigningFlowState;

    if (role === 'landlord') {
      nextState = 'landlord_signed';
      updated = { ...flow, landlordSignature: entry, state: nextState };
      // Notify tenant
      this.notifSvc.push(
        'alert',
        'Contrato Pronto para Assinar',
        `${signerName} assinou o contrato. A sua assinatura está pendente.`,
        '/lease',
      );
    } else {
      nextState = 'tenant_signed';
      updated = { ...flow, tenantSignature: entry, state: nextState };
    }

    this._flow.set(updated);

    // Check if both signed → complete
    if (updated.landlordSignature && updated.tenantSignature) {
      this._completeFlow(updated);
    }
  }

  /**
   * Advance from landlord_signed to tenant_pending (after landlord signs).
   */
  advanceToTenant(): void {
    const flow = this._flow();
    if (!flow || flow.state !== 'landlord_signed') return;
    this._flow.update(f => f ? { ...f, state: 'tenant_pending' } : f);
  }

  /** Reset and clear the active flow. */
  resetFlow(): void {
    this._flow.set(null);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private _completeFlow(flow: SigningFlowState): void {
    const completed: SigningFlowState = {
      ...flow,
      state: 'completed',
      completedAt: new Date().toISOString(),
    };
    this._flow.set(completed);

    // Mark lease as active in LeaseAgreementService
    this.leaseSvc.sign(flow.leaseId, 'landlord');
    this.leaseSvc.sign(flow.leaseId, 'tenant');

    // Final notification
    this.notifSvc.push(
      'alert',
      'Contrato Assinado por Ambas as Partes ✓',
      'O contrato de arrendamento está agora activo. Bem-vindo à sua nova casa!',
      '/lease',
    );
  }
}
