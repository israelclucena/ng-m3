import {
  Component, ChangeDetectionStrategy, inject, input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoveInChecklistService } from '../../services/move-in-checklist.service';
import type { MoveInCategory } from '../../services/move-in-checklist.service';

interface CategoryMeta {
  readonly id: MoveInCategory;
  readonly label: string;
  readonly icon: string;
}

const CATEGORY_ORDER: ReadonlyArray<CategoryMeta> = [
  { id: 'utilities',  label: 'Serviços',     icon: '⚡' },
  { id: 'admin',      label: 'Administrativo', icon: '📑' },
  { id: 'financial',  label: 'Financeiro',   icon: '💶' },
  { id: 'logistics',  label: 'Logística',    icon: '📦' },
  { id: 'inspection', label: 'Inspeção',     icon: '🔍' },
];

/**
 * MoveInChecklistComponent — tenant move-in checklist for Portuguese rentals.
 *
 * Shows progress meter, per-category breakdown, and toggleable task items.
 * Built with M3 design tokens + native primitives only (no `@material/web`
 * components beyond CSS vars), since Material Web is in maintenance mode and
 * M3 Expressive will not land for the Web library.
 *
 * @example
 * <iu-move-in-checklist [showCategoryProgress]="true" />
 */
@Component({
  selector: 'iu-move-in-checklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="mc-root">

      <!-- Header + global progress -->
      <header class="mc-header">
        <div>
          <h2 class="mc-title">Move-In Checklist</h2>
          <p class="mc-subtitle">
            {{ svc.completed() }}/{{ svc.total() }} tarefas
            @if (svc.isComplete()) {
              · pronto para mudar! 🎉
            }
          </p>
        </div>
        <div class="mc-progress-circle" [class.complete]="svc.isComplete()">
          <span class="mc-progress-pct">{{ svc.progressPct() }}%</span>
        </div>
      </header>

      <!-- Linear progress bar -->
      <div class="mc-bar">
        <div class="mc-bar-fill" [style.width.%]="svc.progressPct()"></div>
      </div>

      <!-- Per-category sections -->
      @for (cat of categories; track cat.id) {
        @let group = svc.byCategory().get(cat.id);
        @let prog = svc.categoryProgress().get(cat.id);
        @if (group && group.length > 0) {
          <section class="mc-cat">
            <header class="mc-cat-header">
              <span class="mc-cat-icon" aria-hidden="true">{{ cat.icon }}</span>
              <h3 class="mc-cat-title">{{ cat.label }}</h3>
              @if (showCategoryProgress() && prog) {
                <span class="mc-cat-counter" [class.done]="prog.done === prog.total">
                  {{ prog.done }}/{{ prog.total }}
                </span>
              }
            </header>

            <ul class="mc-list">
              @for (task of group; track task.id) {
                <li class="mc-item" [class.done]="task.done">
                  <button
                    type="button"
                    class="mc-checkbox"
                    role="checkbox"
                    [attr.aria-checked]="task.done"
                    [attr.aria-label]="task.label"
                    (click)="svc.toggle(task.id)"
                  >
                    @if (task.done) {
                      <span class="mc-check" aria-hidden="true">✓</span>
                    }
                  </button>
                  <div class="mc-task-body">
                    <span class="mc-task-label">{{ task.label }}</span>
                    @if (task.hint) {
                      <span class="mc-task-hint">{{ task.hint }}</span>
                    }
                  </div>
                  <span class="mc-task-when">
                    @if (task.daysBeforeMoveIn > 0) {
                      D-{{ task.daysBeforeMoveIn }}
                    } @else if (task.daysBeforeMoveIn === 0) {
                      D-0
                    } @else {
                      D+{{ -task.daysBeforeMoveIn }}
                    }
                  </span>
                </li>
              }
            </ul>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .mc-root {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      max-width: 760px;
      font-family: var(--md-sys-typescale-body-medium-font, system-ui, sans-serif);
    }

    .mc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 14px;
    }
    .mc-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mc-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .mc-progress-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--md-sys-color-secondary-container, #e8def8);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.25s;
    }
    .mc-progress-circle.complete {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
    }
    .mc-progress-pct {
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .mc-bar {
      width: 100%;
      height: 6px;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .mc-bar-fill {
      height: 100%;
      background: var(--md-sys-color-primary, #6750a4);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .mc-cat { margin-bottom: 22px; }
    .mc-cat:last-child { margin-bottom: 0; }
    .mc-cat-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .mc-cat-icon { font-size: 18px; }
    .mc-cat-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .mc-cat-counter {
      margin-left: auto;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 10px;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mc-cat-counter.done {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .mc-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .mc-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      transition: background 0.15s;
    }
    .mc-item:hover {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
    }
    .mc-item.done {
      opacity: 0.6;
    }
    .mc-item.done .mc-task-label {
      text-decoration: line-through;
    }

    .mc-checkbox {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: 2px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fff);
      cursor: pointer;
      flex-shrink: 0;
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s;
      padding: 0;
    }
    .mc-item.done .mc-checkbox {
      background: var(--md-sys-color-primary, #6750a4);
      border-color: var(--md-sys-color-primary, #6750a4);
    }
    .mc-check {
      color: var(--md-sys-color-on-primary, #fff);
      font-weight: 700;
      font-size: 14px;
      line-height: 1;
    }

    .mc-task-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .mc-task-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      line-height: 1.3;
    }
    .mc-task-hint {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      line-height: 1.3;
    }
    .mc-task-when {
      font-size: 11px;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      padding: 3px 8px;
      border-radius: 8px;
      align-self: center;
      flex-shrink: 0;
    }
  `],
})
export class MoveInChecklistComponent {
  readonly svc = inject(MoveInChecklistService);

  /** Show per-category x/y counters in section headers. */
  readonly showCategoryProgress = input<boolean>(true);

  readonly categories = CATEGORY_ORDER;
}
