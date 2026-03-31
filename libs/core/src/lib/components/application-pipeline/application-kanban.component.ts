/**
 * @fileoverview ApplicationKanbanComponent — Sprint 036
 *
 * `iu-application-kanban` — Kanban board for the application pipeline.
 *
 * 4-column board: Applied → Under Review → Approved / Rejected.
 * Each card shows applicant name, property, income, and quick actions.
 * Column headers show counts and drag-target zones (visual-only).
 *
 * Feature flag: APPLICATION_PIPELINE
 *
 * @example
 * ```html
 * <iu-application-kanban
 *   [landlordId]="'landlord-001'"
 *   (applicationApproved)="onApproved($event)"
 *   (applicationRejected)="onRejected($event)" />
 * ```
 */
import {
  Component, input, output, inject, signal, computed, OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApplicationPipelineService,
  KanbanColumn,
} from '../../services/application-pipeline.service';
import { TenantApplication } from '../../services/tenant-application.service';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-application-kanban`
 *
 * Kanban board view for the full application pipeline.
 * Cards can be moved between columns via action buttons.
 *
 * Feature flag: APPLICATION_PIPELINE
 */
@Component({
  selector: 'iu-application-kanban',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ak-board">
      <!-- Board header -->
      <div class="ak-board-header">
        <h2 class="ak-title">
          <span class="material-symbols-outlined">view_kanban</span>
          Pipeline de Candidaturas
        </h2>
        <div class="ak-stats">
          <span class="ak-stat">
            <span class="material-symbols-outlined">people</span>
            {{ pipelineSvc.totalCount() }} candidatos
          </span>
          @if (pipelineSvc.columnCounts().approved > 0) {
            <span class="ak-stat ak-stat--success">
              <span class="material-symbols-outlined">check_circle</span>
              {{ pipelineSvc.columnCounts().approved }} aprovados
            </span>
          }
        </div>
      </div>

      @if (pipelineSvc.loading()) {
        <div class="ak-loading">
          <span class="ak-spinner"></span>
          <p>A carregar pipeline...</p>
        </div>
      } @else {
        <!-- Columns -->
        <div class="ak-columns">
          @for (col of pipelineSvc.columnDefs(); track col.id) {
            <div class="ak-column" [attr.data-col]="col.id">
              <!-- Column header -->
              <div class="ak-col-header" [attr.data-color]="col.color">
                <span class="material-symbols-outlined ak-col-icon">{{ col.icon }}</span>
                <span class="ak-col-label">{{ col.label }}</span>
                <span class="ak-col-count">{{ col.applications.length }}</span>
              </div>

              <!-- Cards -->
              <div class="ak-cards">
                @for (app of col.applications; track app.id) {
                  <div
                    class="ak-card"
                    [class.ak-card--selected]="selectedId() === app.id"
                    (click)="toggleSelect(app.id)"
                  >
                    <!-- Card top row -->
                    <div class="ak-card-top">
                      <div class="ak-avatar">{{ initials(app.tenantName) }}</div>
                      <div class="ak-card-info">
                        <div class="ak-applicant-name">{{ app.tenantName }}</div>
                        <div class="ak-property-name">{{ app.propertyTitle }}</div>
                      </div>
                      <div class="ak-income-badge">{{ app.monthlyIncome }}€</div>
                    </div>

                    <!-- Card meta -->
                    <div class="ak-card-meta">
                      <span class="ak-meta-item">
                        <span class="material-symbols-outlined">work</span>
                        {{ employmentShort(app.employmentType) }}
                      </span>
                      <span class="ak-meta-item">
                        <span class="material-symbols-outlined">group</span>
                        {{ app.numOccupants }} pessoas
                      </span>
                      @if (app.hasPets) {
                        <span class="ak-meta-item">
                          <span class="material-symbols-outlined">pets</span>
                          Animais
                        </span>
                      }
                    </div>

                    <!-- Card date -->
                    <div class="ak-card-date">
                      <span class="material-symbols-outlined">schedule</span>
                      {{ formatDate(app.submittedAt ?? app.createdAt) }}
                    </div>

                    <!-- Quick actions (shown when selected or hovered) -->
                    @if (selectedId() === app.id) {
                      <div class="ak-card-actions">
                        @if (col.id === 'applied') {
                          <button type="button" class="ak-action-btn ak-action-btn--review"
                            (click)="moveToReview(app.id, $event)">
                            <span class="material-symbols-outlined">search</span>
                            Em Análise
                          </button>
                        }
                        @if (col.id === 'applied' || col.id === 'underReview') {
                          <button type="button" class="ak-action-btn ak-action-btn--approve"
                            (click)="approve(app.id, $event)">
                            <span class="material-symbols-outlined">check</span>
                            Aprovar
                          </button>
                          <button type="button" class="ak-action-btn ak-action-btn--reject"
                            (click)="startReject(app.id, $event)">
                            <span class="material-symbols-outlined">close</span>
                            Recusar
                          </button>
                        }
                        @if (col.id === 'approved') {
                          <button type="button" class="ak-action-btn ak-action-btn--primary"
                            (click)="emitApproved(app.id, $event)">
                            <span class="material-symbols-outlined">description</span>
                            Criar Contrato
                          </button>
                        }
                      </div>
                    }

                    <!-- Rejection reason input -->
                    @if (rejectingId() === app.id) {
                      <div class="ak-reject-form" (click)="$event.stopPropagation()">
                        <textarea
                          class="ak-reject-input"
                          rows="2"
                          placeholder="Motivo de recusa (opcional)..."
                          [value]="rejectReason()"
                          (input)="rejectReason.set($any($event.target).value)"
                        ></textarea>
                        <div class="ak-reject-btns">
                          <button type="button" class="ak-action-btn ak-action-btn--ghost"
                            (click)="rejectingId.set(null)">Cancelar</button>
                          <button type="button" class="ak-action-btn ak-action-btn--reject"
                            (click)="confirmReject(app.id, $event)">Confirmar</button>
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (col.applications.length === 0) {
                  <div class="ak-empty-col">
                    <span class="material-symbols-outlined">{{ col.icon }}</span>
                    <p>Sem candidaturas</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ak-board {
      background: var(--md-sys-color-surface);
      border-radius: 20px;
      padding: 24px;
      overflow: hidden;
    }
    .ak-board-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .ak-title {
      display: flex; align-items: center; gap: 8px;
      margin: 0; font-size: 20px; font-weight: 700; color: var(--md-sys-color-on-surface);
    }
    .ak-stats { display: flex; gap: 12px; }
    .ak-stat {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 12px;
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant); font-size: 13px;
    }
    .ak-stat .material-symbols-outlined { font-size: 16px; }
    .ak-stat--success { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .ak-loading {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 48px; color: var(--md-sys-color-on-surface-variant);
    }
    .ak-spinner {
      width: 24px; height: 24px;
      border: 3px solid var(--md-sys-color-outline-variant);
      border-top-color: var(--md-sys-color-primary);
      border-radius: 50%; animation: ak-spin 0.7s linear infinite;
    }
    @keyframes ak-spin { to { transform: rotate(360deg); } }
    /* Columns */
    .ak-columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      min-height: 400px;
      overflow-x: auto;
    }
    @media (max-width: 900px) {
      .ak-columns { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .ak-columns { grid-template-columns: 1fr; }
    }
    .ak-column {
      background: var(--md-sys-color-surface-container-lowest);
      border-radius: 14px;
      overflow: hidden;
      min-width: 0;
    }
    .ak-col-header {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
    }
    .ak-col-header[data-color="secondary"] { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .ak-col-header[data-color="tertiary"]  { background: var(--md-sys-color-tertiary-container);  color: var(--md-sys-color-on-tertiary-container); }
    .ak-col-header[data-color="primary"]   { background: var(--md-sys-color-primary-container);   color: var(--md-sys-color-on-primary-container); }
    .ak-col-header[data-color="error"]     { background: var(--md-sys-color-error-container);     color: var(--md-sys-color-on-error-container); }
    .ak-col-icon { font-size: 18px; }
    .ak-col-label { font-weight: 700; font-size: 13px; flex: 1; }
    .ak-col-count {
      min-width: 22px; height: 22px; border-radius: 11px;
      background: rgba(0,0,0,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    /* Cards */
    .ak-cards {
      padding: 10px; display: flex; flex-direction: column; gap: 8px;
      min-height: 100px;
    }
    .ak-card {
      background: var(--md-sys-color-surface);
      border: 1.5px solid var(--md-sys-color-outline-variant);
      border-radius: 10px; padding: 12px;
      cursor: pointer; transition: all 0.15s;
    }
    .ak-card:hover { border-color: var(--md-sys-color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .ak-card--selected { border-color: var(--md-sys-color-primary); background: var(--md-sys-color-surface-container-low); }
    .ak-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .ak-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 12px;
    }
    .ak-card-info { flex: 1; min-width: 0; }
    .ak-applicant-name { font-weight: 600; font-size: 13px; color: var(--md-sys-color-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ak-property-name { font-size: 11px; color: var(--md-sys-color-on-surface-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ak-income-badge {
      padding: 2px 8px; border-radius: 8px; font-size: 12px; font-weight: 700;
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-primary);
      white-space: nowrap;
    }
    .ak-card-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
    .ak-meta-item {
      display: flex; align-items: center; gap: 3px;
      font-size: 11px; color: var(--md-sys-color-on-surface-variant);
    }
    .ak-meta-item .material-symbols-outlined { font-size: 13px; }
    .ak-card-date {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: var(--md-sys-color-on-surface-variant);
    }
    .ak-card-date .material-symbols-outlined { font-size: 13px; }
    .ak-card-actions {
      display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .ak-action-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 10px; border-radius: 14px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.12s;
    }
    .ak-action-btn .material-symbols-outlined { font-size: 14px; }
    .ak-action-btn--review  { background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }
    .ak-action-btn--approve { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .ak-action-btn--reject  { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
    .ak-action-btn--primary { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .ak-action-btn--ghost   { background: transparent; color: var(--md-sys-color-on-surface-variant); }
    .ak-reject-form { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
    .ak-reject-input {
      width: 100%; padding: 8px; border-radius: 8px; box-sizing: border-box;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface); font-family: inherit; font-size: 12px;
      resize: none;
    }
    .ak-reject-btns { display: flex; gap: 6px; justify-content: flex-end; }
    .ak-empty-col {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 24px; color: var(--md-sys-color-on-surface-variant); opacity: 0.5;
      font-size: 13px; text-align: center;
    }
    .ak-empty-col .material-symbols-outlined { font-size: 28px; }
    .ak-empty-col p { margin: 0; }
  `],
})
export class ApplicationKanbanComponent implements OnInit {
  readonly pipelineSvc = inject(ApplicationPipelineService);

  /** @input Landlord ID to load applications for */
  readonly landlordId = input.required<string>();

  /** @output Emits application ID when approved */
  readonly applicationApproved = output<string>();

  /** @output Emits application ID when rejected */
  readonly applicationRejected = output<string>();

  /** @output Emits application ID when "Create Lease" is clicked */
  readonly createLease = output<string>();

  readonly selectedId = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);
  readonly rejectReason = signal('');

  ngOnInit(): void {
    this.pipelineSvc.load(this.landlordId());
  }

  toggleSelect(id: string): void {
    this.selectedId.update(cur => cur === id ? null : id);
    if (this.rejectingId() !== id) this.rejectingId.set(null);
  }

  moveToReview(id: string, e: Event): void {
    e.stopPropagation();
    this.pipelineSvc.moveToReview(id);
    this.selectedId.set(null);
  }

  approve(id: string, e: Event): void {
    e.stopPropagation();
    this.pipelineSvc.approve(id);
    this.selectedId.set(null);
    this.applicationApproved.emit(id);
  }

  startReject(id: string, e: Event): void {
    e.stopPropagation();
    this.rejectingId.set(id);
    this.rejectReason.set('');
  }

  confirmReject(id: string, e: Event): void {
    e.stopPropagation();
    this.pipelineSvc.reject(id, this.rejectReason());
    this.rejectingId.set(null);
    this.selectedId.set(null);
    this.applicationRejected.emit(id);
  }

  emitApproved(id: string, e: Event): void {
    e.stopPropagation();
    this.createLease.emit(id);
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  employmentShort(type: string): string {
    const map: Record<string, string> = {
      employed: 'Empregado', 'self-employed': 'Independente',
      student: 'Estudante', retired: 'Reformado', unemployed: 'Desempregado',
    };
    return map[type] ?? type;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  }
}
