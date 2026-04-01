import {
  Component, ChangeDetectionStrategy, Input, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PropertyInspectionService,
} from '../../services/property-inspection.service';
import type { InspectionReport, RoomCondition } from '../../services/property-inspection.service';

/**
 * PropertyInspectionComponent — full inspection workflow UI.
 *
 * Renders all inspection reports for a property. Supports editing room
 * conditions and notes for in-progress inspections, completing with
 * inspector notes, and dual-signature sign-off.
 *
 * @example
 * <iu-property-inspection role="landlord" propertyId="prop-001" />
 */
@Component({
  selector: 'iu-property-inspection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pi-root">

      @if (svc.loading()) {
        <div class="pi-loading">
          <span class="material-symbols-outlined pi-loading-icon">search</span>
          <p>Loading inspection reports…</p>
        </div>
      } @else if (svc.reports().length === 0) {
        <div class="pi-empty">
          <span class="material-symbols-outlined pi-empty-icon">fact_check</span>
          <p>No inspection reports found for this property.</p>
        </div>
      } @else {
        @for (report of svc.reports(); track report.id) {
          <div class="pi-report" [class.pi-report--signed]="report.status === 'signed'">

            <!-- Report Header -->
            <div class="pi-report-header">
              <div class="pi-report-meta">
                <span class="pi-type-badge pi-type--{{ report.type }}">
                  <span class="material-symbols-outlined" style="font-size:14px">{{ typeIcon(report.type) }}</span>
                  {{ formatType(report.type) }}
                </span>
                <div>
                  <p class="pi-property-title">{{ report.propertyTitle }}</p>
                  <p class="pi-date">Scheduled: {{ report.scheduledDate }}
                    @if (report.completedDate) { · Completed: {{ report.completedDate }} }
                  </p>
                </div>
              </div>
              <span class="pi-status-chip pi-status--{{ report.status }}">
                {{ report.status | titlecase }}
              </span>
            </div>

            <!-- Room Grid -->
            <div class="pi-rooms">
              @for (room of report.rooms; track room.id) {
                <div class="pi-room">
                  <div class="pi-room-header">
                    <span class="pi-room-name">{{ room.name }}</span>
                    <span class="pi-condition-badge pi-cond--{{ room.condition }}">
                      {{ room.condition }}
                    </span>
                  </div>

                  @if (isEditable(report)) {
                    <div class="pi-room-edit">
                      <select
                        class="pi-select"
                        [ngModel]="room.condition"
                        (ngModelChange)="onConditionChange(report.id, room.id, $event)"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                        <option value="damaged">Damaged</option>
                      </select>
                      <input
                        class="pi-notes-input"
                        type="text"
                        placeholder="Notes…"
                        [ngModel]="room.notes"
                        (ngModelChange)="onNotesChange(report.id, room.id, $event)"
                      />
                    </div>
                  } @else if (room.notes) {
                    <p class="pi-room-notes">{{ room.notes }}</p>
                  }
                </div>
              }
            </div>

            <!-- Overall Condition Badge -->
            @if (report.overallCondition) {
              <div class="pi-overall">
                <span class="pi-overall-label">Overall Condition:</span>
                <span class="pi-condition-badge pi-cond--{{ report.overallCondition }}">
                  {{ report.overallCondition }}
                </span>
                @if (report.inspectorNotes) {
                  <span class="pi-inspector-notes-inline">{{ report.inspectorNotes }}</span>
                }
              </div>
            }

            <!-- Complete Section (in-progress) -->
            @if (report.status === 'in-progress') {
              <div class="pi-complete-section">
                <textarea
                  class="pi-inspector-textarea"
                  placeholder="Inspector summary notes…"
                  rows="3"
                  [(ngModel)]="notesBuffers[report.id]"
                ></textarea>
                <button
                  class="pi-complete-btn"
                  [disabled]="!notesBuffers[report.id]"
                  (click)="onComplete(report.id)"
                >
                  <span class="material-symbols-outlined" style="font-size:16px">check_circle</span>
                  Mark as Completed
                </button>
              </div>
            }

            <!-- Signature Section (completed) -->
            @if (report.status === 'completed') {
              <div class="pi-sign-section">
                <div class="pi-sign-parties">
                  <div class="pi-sign-party" [class.pi-sign-party--signed]="report.tenantSigned">
                    <span class="material-symbols-outlined">{{ report.tenantSigned ? 'verified' : 'pending' }}</span>
                    <div>
                      <span class="pi-sign-role">Tenant</span>
                      <span class="pi-sign-state">{{ report.tenantSigned ? 'Signed' : 'Signature pending' }}</span>
                    </div>
                  </div>
                  <div class="pi-sign-party" [class.pi-sign-party--signed]="report.landlordSigned">
                    <span class="material-symbols-outlined">{{ report.landlordSigned ? 'verified' : 'pending' }}</span>
                    <div>
                      <span class="pi-sign-role">Landlord</span>
                      <span class="pi-sign-state">{{ report.landlordSigned ? 'Signed' : 'Signature pending' }}</span>
                    </div>
                  </div>
                </div>
                <div class="pi-sign-actions">
                  @if (!report.tenantSigned) {
                    <button class="pi-sign-btn pi-sign-btn--tenant" (click)="svc.sign(report.id, 'tenant')">
                      Sign as Tenant
                    </button>
                  }
                  @if (!report.landlordSigned) {
                    <button class="pi-sign-btn pi-sign-btn--landlord" (click)="svc.sign(report.id, 'landlord')">
                      Sign as Landlord
                    </button>
                  }
                </div>
              </div>
            }

          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pi-root { display: flex; flex-direction: column; gap: 20px; }

    .pi-loading, .pi-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; text-align: center;
      color: var(--md-sys-color-on-surface-variant); font-size: 14px;
    }
    .pi-loading-icon, .pi-empty-icon { font-size: 48px; }

    .pi-report {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 16px;
      overflow: hidden;
      background: var(--md-sys-color-surface);
    }
    .pi-report--signed { border-color: var(--md-sys-color-tertiary); }

    .pi-report-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px;
      background: var(--md-sys-color-surface-container-low);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      flex-wrap: wrap; gap: 12px;
    }
    .pi-report-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

    .pi-type-badge {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 600;
      padding: 5px 12px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
    }
    .pi-type--move-in { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .pi-type--move-out { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
    .pi-type--routine { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .pi-type--emergency { background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }

    .pi-property-title { font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface); margin: 0 0 2px; }
    .pi-date { font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin: 0; }

    .pi-status-chip {
      font-size: 12px; padding: 4px 14px; border-radius: 20px; font-weight: 500;
    }
    .pi-status--draft { background: var(--md-sys-color-surface-container-high); color: var(--md-sys-color-on-surface-variant); }
    .pi-status--in-progress { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .pi-status--completed { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .pi-status--signed { background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }

    /* Rooms */
    .pi-rooms {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1px;
      background: var(--md-sys-color-outline-variant);
    }
    .pi-room {
      background: var(--md-sys-color-surface);
      padding: 14px 16px;
    }
    .pi-room-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 10px;
    }
    .pi-room-name { font-size: 13px; font-weight: 500; color: var(--md-sys-color-on-surface); }
    .pi-condition-badge {
      font-size: 11px; padding: 3px 10px; border-radius: 10px; font-weight: 500;
    }
    .pi-cond--excellent { background: #d4edda; color: #155724; }
    .pi-cond--good { background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }
    .pi-cond--fair { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .pi-cond--poor { background: #fff3cd; color: #856404; }
    .pi-cond--damaged { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }

    .pi-room-edit { display: flex; flex-direction: column; gap: 8px; }
    .pi-select, .pi-notes-input {
      width: 100%; padding: 7px 10px;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 8px; font-size: 13px;
      background: var(--md-sys-color-surface-container-low);
      color: var(--md-sys-color-on-surface);
      box-sizing: border-box;
    }
    .pi-room-notes { font-size: 13px; color: var(--md-sys-color-on-surface-variant); font-style: italic; margin: 4px 0 0; }

    /* Overall row */
    .pi-overall {
      display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
      padding: 12px 20px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-low);
    }
    .pi-overall-label { font-size: 13px; font-weight: 500; color: var(--md-sys-color-on-surface-variant); }
    .pi-inspector-notes-inline { font-size: 13px; color: var(--md-sys-color-on-surface-variant); font-style: italic; }

    /* Complete section */
    .pi-complete-section {
      padding: 16px 20px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      display: flex; flex-direction: column; gap: 12px;
    }
    .pi-inspector-textarea {
      width: 100%; padding: 10px 14px;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 12px; font-size: 14px; resize: vertical;
      background: var(--md-sys-color-surface-container-low);
      color: var(--md-sys-color-on-surface);
      box-sizing: border-box; font-family: inherit;
    }
    .pi-complete-btn {
      display: flex; align-items: center; gap: 8px;
      align-self: flex-end;
      background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
      border: none; border-radius: 20px; padding: 10px 24px;
      font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .pi-complete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Signature section */
    .pi-sign-section {
      padding: 16px 20px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      display: flex; flex-direction: column; gap: 14px;
    }
    .pi-sign-parties { display: flex; gap: 24px; flex-wrap: wrap; }
    .pi-sign-party {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px; flex: 1; min-width: 160px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .pi-sign-party--signed {
      border-color: var(--md-sys-color-tertiary);
      background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 40%, transparent);
      color: var(--md-sys-color-on-surface);
    }
    .pi-sign-party--signed .material-symbols-outlined { color: var(--md-sys-color-tertiary); }
    .pi-sign-role { display: block; font-size: 13px; font-weight: 500; }
    .pi-sign-state { display: block; font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .pi-sign-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .pi-sign-btn {
      border: none; border-radius: 20px; padding: 10px 24px;
      font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .pi-sign-btn--tenant { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .pi-sign-btn--landlord { background: var(--md-sys-color-secondary); color: var(--md-sys-color-on-secondary); }
  `],
})
export class PropertyInspectionComponent implements OnInit {
  protected readonly svc = inject(PropertyInspectionService);

  /** Buffer to hold inspector notes per report before completing */
  protected notesBuffers: Record<string, string> = {};

  /** Optional property filter — in real app would call svc.loadForProperty() */
  @Input() propertyId?: string;

  /** Role affects available actions (all roles see same UI for now) */
  @Input() role: 'tenant' | 'landlord' | 'inspector' = 'landlord';

  ngOnInit(): void {
    for (const r of this.svc.reports()) {
      this.notesBuffers[r.id] = '';
    }
  }

  protected isEditable(report: InspectionReport): boolean {
    return report.status === 'draft' || report.status === 'in-progress';
  }

  protected formatType(type: string): string {
    return type.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-');
  }

  protected typeIcon(type: string): string {
    const icons: Record<string, string> = {
      'move-in': 'move_to_inbox',
      'move-out': 'move_item',
      'routine': 'calendar_today',
      'emergency': 'emergency',
    };
    return icons[type] ?? 'fact_check';
  }

  protected onConditionChange(reportId: string, roomId: string, condition: RoomCondition): void {
    this.svc.updateRoom(reportId, roomId, { condition });
  }

  protected onNotesChange(reportId: string, roomId: string, notes: string): void {
    this.svc.updateRoom(reportId, roomId, { notes });
  }

  protected onComplete(reportId: string): void {
    this.svc.complete(reportId, this.notesBuffers[reportId] ?? '');
    this.notesBuffers[reportId] = '';
  }
}
