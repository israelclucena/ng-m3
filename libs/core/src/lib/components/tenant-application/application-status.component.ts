/**
 * @fileoverview ApplicationStatusComponent — Sprint 035
 *
 * `iu-application-status` — Landlord review panel for tenant applications.
 *
 * Lists all pending/reviewed applications for a property. Landlord can approve, reject,
 * or mark under-review. Shows applicant details, income, references, and cover letter.
 *
 * Feature flag: APPLICATION_REVIEW
 *
 * @example
 * ```html
 * <iu-application-status
 *   [landlordId]="'landlord-001'"
 *   (approved)="onApproved($event)"
 *   (rejected)="onRejected($event)" />
 * ```
 */
import { Component, input, output, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TenantApplicationService,
  TenantApplication,
  ApplicationStatus,
} from '../../services/tenant-application.service';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-application-status`
 *
 * Landlord-facing panel to review, approve, or reject tenant applications.
 * Feature flag: APPLICATION_REVIEW
 */
@Component({
  selector: 'iu-application-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="as-container">
      <div class="as-header">
        <h2 class="as-title">
          <span class="material-symbols-outlined">assignment</span>
          Candidaturas
        </h2>
        <div class="as-filter">
          @for (f of filters; track f.value) {
            <button type="button" class="as-filter-btn"
              [class.active]="activeFilter() === f.value"
              (click)="activeFilter.set(f.value)">
              {{ f.label }}
              @if (countByStatus(f.value) > 0) {
                <span class="as-badge">{{ countByStatus(f.value) }}</span>
              }
            </button>
          }
        </div>
      </div>

      @if (svc.loading()) {
        <div class="as-loading">
          <span class="as-spinner"></span>
          <p>A carregar candidaturas...</p>
        </div>
      } @else if (filtered().length === 0) {
        <div class="as-empty">
          <span class="material-symbols-outlined">inbox</span>
          <p>Sem candidaturas {{ activeFilter() === 'all' ? '' : 'neste estado' }}.</p>
        </div>
      } @else {
        <div class="as-list">
          @for (app of filtered(); track app.id) {
            <div class="as-card" [class.expanded]="expandedId() === app.id">
              <!-- Card header -->
              <div class="as-card-header" (click)="toggle(app.id)">
                <div class="as-applicant">
                  <div class="as-avatar">{{ initials(app.tenantName) }}</div>
                  <div class="as-applicant-info">
                    <div class="as-applicant-name">{{ app.tenantName }}</div>
                    <div class="as-applicant-meta">{{ app.propertyTitle }} · {{ app.tenantEmail }}</div>
                  </div>
                </div>
                <div class="as-card-right">
                  <span class="as-status-chip" [attr.data-status]="app.status">
                    {{ statusLabel(app.status) }}
                  </span>
                  <span class="as-income">{{ app.monthlyIncome }}€/mês</span>
                  <span class="material-symbols-outlined as-chevron">
                    {{ expandedId() === app.id ? 'expand_less' : 'expand_more' }}
                  </span>
                </div>
              </div>

              <!-- Expanded detail -->
              @if (expandedId() === app.id) {
                <div class="as-detail">
                  <!-- Info grid -->
                  <div class="as-info-grid">
                    <div class="as-info-item">
                      <span class="as-info-label">Situação</span>
                      <span class="as-info-value">{{ employmentLabel(app.employmentType) }}</span>
                    </div>
                    <div class="as-info-item">
                      <span class="as-info-label">Profissão</span>
                      <span class="as-info-value">{{ app.occupation }}</span>
                    </div>
                    @if (app.employer) {
                      <div class="as-info-item">
                        <span class="as-info-label">Empregador</span>
                        <span class="as-info-value">{{ app.employer }}</span>
                      </div>
                    }
                    <div class="as-info-item">
                      <span class="as-info-label">Nacionalidade</span>
                      <span class="as-info-value">{{ app.nationality }}</span>
                    </div>
                    <div class="as-info-item">
                      <span class="as-info-label">NIF</span>
                      <span class="as-info-value">{{ app.nif }}</span>
                    </div>
                    <div class="as-info-item">
                      <span class="as-info-label">Ocupantes</span>
                      <span class="as-info-value">{{ app.numOccupants }}</span>
                    </div>
                    <div class="as-info-item">
                      <span class="as-info-label">Animais</span>
                      <span class="as-info-value">{{ app.hasPets ? 'Sim' : 'Não' }}</span>
                    </div>
                    <div class="as-info-item">
                      <span class="as-info-label">Submetido em</span>
                      <span class="as-info-value">{{ formatDate(app.submittedAt) }}</span>
                    </div>
                  </div>

                  <!-- Income ratio -->
                  <div class="as-income-ratio">
                    <span class="as-info-label">Rácio Rendimento/Renda</span>
                    <div class="as-ratio-bar">
                      <div class="as-ratio-fill" [style.width.%]="Math.min(ratioPercent(app.monthlyIncome), 100)"
                        [class.good]="ratioPercent(app.monthlyIncome) >= 70"
                        [class.warn]="ratioPercent(app.monthlyIncome) < 70"></div>
                    </div>
                    <span class="as-ratio-label">{{ app.monthlyIncome }}€ rendimento</span>
                  </div>

                  <!-- References -->
                  @if (app.references.length > 0) {
                    <div class="as-refs">
                      <div class="as-section-title">Referências ({{ app.references.length }})</div>
                      @for (ref of app.references; track ref.id) {
                        <div class="as-ref-item">
                          <span class="material-symbols-outlined">person</span>
                          <div>
                            <div class="as-ref-name">{{ ref.name }}</div>
                            <div class="as-ref-rel">{{ refRelLabel(ref.relationship) }}{{ ref.phone ? ' · ' + ref.phone : '' }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- Cover letter -->
                  <div class="as-cover-letter">
                    <div class="as-section-title">Carta de Apresentação</div>
                    <p class="as-cover-text">{{ app.coverLetter }}</p>
                  </div>

                  <!-- Review notes (if any) -->
                  @if (app.reviewNotes) {
                    <div class="as-review-notes">
                      <span class="material-symbols-outlined">sticky_note_2</span>
                      {{ app.reviewNotes }}
                    </div>
                  }
                  @if (app.rejectionReason) {
                    <div class="as-rejection-reason">
                      <span class="material-symbols-outlined">cancel</span>
                      Motivo de recusa: {{ app.rejectionReason }}
                    </div>
                  }

                  <!-- Actions -->
                  @if (app.status === 'submitted' || app.status === 'under-review') {
                    @if (rejectingId() === app.id) {
                      <div class="as-reject-input">
                        <textarea class="as-reason-input" rows="3"
                          placeholder="Motivo da recusa..."
                          [value]="rejectReason()"
                          (input)="rejectReason.set($any($event.target).value)"></textarea>
                        <div class="as-action-row">
                          <button type="button" class="as-btn as-btn--text" (click)="rejectingId.set(null)">Cancelar</button>
                          <button type="button" class="as-btn as-btn--danger" (click)="confirmReject(app.id)">Confirmar Recusa</button>
                        </div>
                      </div>
                    } @else {
                      <div class="as-actions">
                        @if (app.status === 'submitted') {
                          <button type="button" class="as-btn as-btn--outlined" (click)="markReview(app.id)">
                            <span class="material-symbols-outlined">visibility</span>
                            Em Análise
                          </button>
                        }
                        <button type="button" class="as-btn as-btn--danger-outlined" (click)="rejectingId.set(app.id); rejectReason.set('')">
                          <span class="material-symbols-outlined">close</span>
                          Recusar
                        </button>
                        <button type="button" class="as-btn as-btn--approve" (click)="approveApp(app.id)">
                          <span class="material-symbols-outlined">check_circle</span>
                          Aprovar
                        </button>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .as-container {
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      padding: 24px;
      max-width: 760px;
    }
    .as-header { margin-bottom: 20px; }
    .as-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 20px; font-weight: 700; color: var(--md-sys-color-on-surface);
      margin: 0 0 16px;
    }
    .as-filter { display: flex; gap: 8px; flex-wrap: wrap; }
    .as-filter-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: transparent; color: var(--md-sys-color-on-surface-variant);
      cursor: pointer; font-size: 13px; transition: all 0.15s;
    }
    .as-filter-btn.active {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-weight: 600;
    }
    .as-badge {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-radius: 10px; padding: 1px 6px; font-size: 11px;
    }
    .as-loading, .as-empty {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 48px; color: var(--md-sys-color-on-surface-variant); text-align: center;
    }
    .as-empty .material-symbols-outlined { font-size: 40px; }
    .as-spinner {
      width: 24px; height: 24px;
      border: 3px solid var(--md-sys-color-outline-variant);
      border-top-color: var(--md-sys-color-primary);
      border-radius: 50%; animation: as-spin 0.7s linear infinite;
    }
    @keyframes as-spin { to { transform: rotate(360deg); } }
    .as-list { display: flex; flex-direction: column; gap: 10px; }
    .as-card {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px; overflow: hidden;
      transition: border-color 0.15s;
    }
    .as-card.expanded { border-color: var(--md-sys-color-primary); }
    .as-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; cursor: pointer; gap: 12px;
      background: var(--md-sys-color-surface-container-low);
    }
    .as-card-header:hover { background: var(--md-sys-color-surface-container); }
    .as-applicant { display: flex; align-items: center; gap: 10px; }
    .as-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
    }
    .as-applicant-name { font-weight: 600; font-size: 15px; color: var(--md-sys-color-on-surface); }
    .as-applicant-meta { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .as-card-right { display: flex; align-items: center; gap: 10px; }
    .as-status-chip {
      padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }
    .as-status-chip[data-status="submitted"] { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .as-status-chip[data-status="under-review"] { background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }
    .as-status-chip[data-status="approved"] { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .as-status-chip[data-status="rejected"] { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
    .as-status-chip[data-status="withdrawn"] { background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
    .as-income { font-size: 14px; font-weight: 700; color: var(--md-sys-color-primary); }
    .as-chevron { color: var(--md-sys-color-on-surface-variant); }
    .as-detail { padding: 16px; border-top: 1px solid var(--md-sys-color-outline-variant); }
    .as-info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px; margin-bottom: 16px;
    }
    .as-info-item {
      padding: 8px 12px; border-radius: 8px;
      background: var(--md-sys-color-surface-container-low);
      display: flex; flex-direction: column; gap: 2px;
    }
    .as-info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--md-sys-color-on-surface-variant); }
    .as-info-value { font-size: 14px; font-weight: 600; color: var(--md-sys-color-on-surface); }
    .as-income-ratio { margin-bottom: 16px; }
    .as-ratio-bar {
      height: 8px; background: var(--md-sys-color-surface-variant);
      border-radius: 4px; margin: 6px 0; overflow: hidden;
    }
    .as-ratio-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
    .as-ratio-fill.good { background: var(--md-sys-color-primary); }
    .as-ratio-fill.warn { background: var(--md-sys-color-error); }
    .as-ratio-label { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .as-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 8px; }
    .as-refs { margin-bottom: 14px; }
    .as-ref-item {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 8px; border-radius: 8px;
      background: var(--md-sys-color-surface-container-low);
      margin-bottom: 6px;
    }
    .as-ref-item .material-symbols-outlined { color: var(--md-sys-color-primary); font-size: 18px; margin-top: 2px; }
    .as-ref-name { font-weight: 600; font-size: 14px; color: var(--md-sys-color-on-surface); }
    .as-ref-rel { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .as-cover-letter { margin-bottom: 14px; }
    .as-cover-text {
      font-size: 14px; line-height: 1.6; color: var(--md-sys-color-on-surface);
      background: var(--md-sys-color-surface-container-low);
      padding: 12px; border-radius: 8px; margin: 0;
    }
    .as-review-notes, .as-rejection-reason {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;
    }
    .as-review-notes { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .as-rejection-reason { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
    .as-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .as-reject-input { margin-top: 8px; }
    .as-reason-input {
      width: 100%; padding: 10px; border-radius: 8px; box-sizing: border-box;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface); font-family: inherit; font-size: 14px;
      margin-bottom: 10px;
    }
    .as-action-row { display: flex; justify-content: flex-end; gap: 8px; }
    .as-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px;
      font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
    }
    .as-btn--text { background: transparent; color: var(--md-sys-color-primary); }
    .as-btn--outlined { border: 1.5px solid var(--md-sys-color-primary); background: transparent; color: var(--md-sys-color-primary); }
    .as-btn--danger-outlined { border: 1.5px solid var(--md-sys-color-error); background: transparent; color: var(--md-sys-color-error); }
    .as-btn--danger { background: var(--md-sys-color-error); color: var(--md-sys-color-on-error); }
    .as-btn--approve { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
  `],
})
export class ApplicationStatusComponent implements OnInit {
  readonly svc = inject(TenantApplicationService);

  /** @input Landlord ID — loads all their applications */
  readonly landlordId = input.required<string>();

  /** @output Emits application ID when approved */
  readonly approved = output<string>();
  /** @output Emits application ID when rejected */
  readonly rejected = output<string>();

  readonly activeFilter = signal<ApplicationStatus | 'all'>('all');
  readonly expandedId = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);
  readonly rejectReason = signal('');

  readonly Math = Math;

  readonly filters: { value: ApplicationStatus | 'all'; label: string }[] = [
    { value: 'all',          label: 'Todas' },
    { value: 'submitted',    label: 'Novas' },
    { value: 'under-review', label: 'Em Análise' },
    { value: 'approved',     label: 'Aprovadas' },
    { value: 'rejected',     label: 'Recusadas' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.svc.applications();
    return this.svc.applications().filter(a => a.status === f);
  });

  ngOnInit(): void {
    this.svc.loadForLandlord(this.landlordId());
  }

  countByStatus(status: ApplicationStatus | 'all'): number {
    if (status === 'all') return this.svc.applications().length;
    return this.svc.applications().filter(a => a.status === status).length;
  }

  toggle(id: string): void {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  statusLabel(s: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      draft: 'Rascunho', submitted: 'Submetida', 'under-review': 'Em Análise',
      approved: 'Aprovada', rejected: 'Recusada', withdrawn: 'Retirada',
    };
    return map[s];
  }

  employmentLabel(type: string): string {
    const map: Record<string, string> = {
      employed: 'Trabalhador(a)', 'self-employed': 'Independente',
      student: 'Estudante', retired: 'Reformado(a)', unemployed: 'Desempregado(a)',
    };
    return map[type] ?? type;
  }

  refRelLabel(rel: string): string {
    const map: Record<string, string> = { landlord: 'Senhorio anterior', employer: 'Empregador', personal: 'Pessoal' };
    return map[rel] ?? rel;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  ratioPercent(income: number): number {
    // Assume 1200€ benchmark rent → 100% = income covers 3x rent
    return Math.round((income / (1200 * 3)) * 100);
  }

  markReview(id: string): void {
    this.svc.markUnderReview(id);
  }

  approveApp(id: string): void {
    this.svc.approve(id);
    this.expandedId.set(null);
    this.approved.emit(id);
  }

  confirmReject(id: string): void {
    this.svc.reject(id, this.rejectReason());
    this.rejectingId.set(null);
    this.expandedId.set(null);
    this.rejected.emit(id);
  }
}
