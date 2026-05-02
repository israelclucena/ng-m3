import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunicationCenterStateService } from '../../services/communication-center-state.service';
import {
  LandlordCommunicationTemplatesService,
  TemplateCategory,
} from '../../services/landlord-communication-templates.service';

interface CategoryMeta {
  readonly id: TemplateCategory;
  readonly label: string;
  readonly icon: string;
}

const CATEGORY_ORDER: ReadonlyArray<CategoryMeta> = [
  { id: 'lease',   label: 'Contrato',     icon: '📄' },
  { id: 'rent',    label: 'Renda',        icon: '💶' },
  { id: 'deposit', label: 'Caução',       icon: '🔒' },
  { id: 'works',   label: 'Obras',        icon: '🔧' },
  { id: 'visits',  label: 'Visitas',      icon: '📅' },
];

/**
 * Visual companion for {@link LandlordCommunicationTemplatesService}.
 *
 * Two-column layout: left sidebar lists templates grouped by category, right
 * pane shows placeholder inputs + live-filled preview + send / copy actions.
 * History of dispatched messages is stacked below the preview.
 *
 * State lives in {@link CommunicationCenterStateService}; this component is
 * purely view + event delegation. M3 tokens, no `@material/web`.
 *
 * @example
 * <iu-communication-center />
 */
@Component({
  selector: 'iu-communication-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="cc-root">
      <header class="cc-header">
        <div>
          <h2 class="cc-title">Centro de Comunicações</h2>
          <p class="cc-subtitle">Templates NRAU prontos a usar · {{ totalTemplates() }} modelos</p>
        </div>
        @if (state.historyEntries().length > 0) {
          <button type="button" class="cc-clear" (click)="state.clearHistory()">
            Limpar histórico
          </button>
        }
      </header>

      <div class="cc-grid">
        <!-- LEFT: template picker grouped by category -->
        <aside class="cc-sidebar">
          @for (cat of categories; track cat.id) {
            @let group = templatesByCategory().get(cat.id);
            @if (group && group.length > 0) {
              <section class="cc-cat">
                <header class="cc-cat-head">
                  <span class="cc-cat-icon" aria-hidden="true">{{ cat.icon }}</span>
                  <h3 class="cc-cat-label">{{ cat.label }}</h3>
                </header>
                <ul class="cc-tpl-list">
                  @for (t of group; track t.id) {
                    <li>
                      <button
                        type="button"
                        class="cc-tpl-btn"
                        [class.cc-tpl-btn--active]="state.selectedTemplateId() === t.id"
                        (click)="state.selectTemplate(t.id)"
                      >
                        <span class="cc-tpl-title">{{ t.titulo }}</span>
                        @if (t.legalReference) {
                          <span class="cc-tpl-legal">{{ t.legalReference }}</span>
                        }
                      </button>
                    </li>
                  }
                </ul>
              </section>
            }
          }
        </aside>

        <!-- RIGHT: editor + preview -->
        <section class="cc-main">
          @let tpl = state.currentTemplate();
          @if (!tpl) {
            <div class="cc-empty">
              <p class="cc-empty-line">Escolhe um template à esquerda para começar.</p>
            </div>
          } @else {
            <article class="cc-editor">
              <header class="cc-editor-head">
                <h3 class="cc-editor-title">{{ tpl.titulo }}</h3>
                @if (tpl.legalReference) {
                  <span class="cc-editor-legal">{{ tpl.legalReference }}</span>
                }
              </header>

              @if (tpl.placeholders.length > 0) {
                <section class="cc-fields">
                  <h4 class="cc-section-title">Variáveis</h4>
                  <div class="cc-fields-grid">
                    @for (ph of tpl.placeholders; track ph) {
                      <label class="cc-field">
                        <span class="cc-field-label">
                          {{ ph }}
                          @if (isMissing(ph)) {
                            <span class="cc-field-missing" aria-label="Em falta">•</span>
                          }
                        </span>
                        <input
                          type="text"
                          class="cc-input"
                          [value]="state.placeholderValues()[ph] ?? ''"
                          (input)="onPlaceholder(ph, $event)"
                          [attr.placeholder]="'{{' + ph + '}}'"
                        />
                      </label>
                    }
                  </div>
                </section>
              }

              <section class="cc-preview">
                <header class="cc-preview-head">
                  <h4 class="cc-section-title">Pré-visualização</h4>
                  @if (state.missingPlaceholders().length > 0) {
                    <span class="cc-preview-warn">
                      {{ state.missingPlaceholders().length }} variável(eis) em falta
                    </span>
                  }
                </header>
                <pre class="cc-preview-body">{{ state.filledBody() }}</pre>
                @if (tpl.requiresSignature) {
                  <p class="cc-sign-hint">Esta comunicação requer assinatura.</p>
                }
              </section>

              <footer class="cc-actions">
                <button
                  type="button"
                  class="cc-action cc-action--ghost"
                  (click)="copy()"
                  [disabled]="!state.canSend()"
                >Copiar</button>
                <button
                  type="button"
                  class="cc-action cc-action--primary"
                  (click)="state.send()"
                  [disabled]="!state.canSend()"
                >Enviar</button>
              </footer>
            </article>
          }

          @if (state.historyEntries().length > 0) {
            <section class="cc-history">
              <h4 class="cc-section-title">Histórico</h4>
              <ul class="cc-history-list">
                @for (h of state.historyEntries(); track h.id) {
                  <li class="cc-history-item">
                    <header class="cc-history-head">
                      <span class="cc-history-mode" [attr.data-mode]="h.mode">
                        {{ h.mode === 'sent' ? 'Enviado' : 'Copiado' }}
                      </span>
                      <span class="cc-history-title">{{ h.templateTitle }}</span>
                      <time class="cc-history-time">{{ h.sentAt | date:'short' }}</time>
                    </header>
                  </li>
                }
              </ul>
            </section>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .cc-root {
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

    .cc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .cc-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .cc-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .cc-clear {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
    }
    .cc-clear:hover {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
    }

    .cc-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
    }

    .cc-sidebar {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 640px;
      overflow-y: auto;
    }
    .cc-cat-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .cc-cat-icon { font-size: 16px; }
    .cc-cat-label {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .cc-tpl-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cc-tpl-btn {
      width: 100%;
      text-align: left;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-family: inherit;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .cc-tpl-btn:hover {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
    }
    .cc-tpl-btn--active {
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }
    .cc-tpl-title {
      font-size: 13px;
      font-weight: 600;
    }
    .cc-tpl-legal {
      font-size: 10px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .cc-main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cc-empty {
      padding: 48px 24px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      text-align: center;
    }
    .cc-empty-line {
      margin: 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .cc-editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cc-editor-head {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cc-editor-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .cc-editor-legal {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .cc-section-title {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .cc-fields-grid {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    .cc-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cc-field-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cc-field-missing {
      color: var(--md-sys-color-error, #b3261e);
      font-size: 18px;
      line-height: 0;
    }
    .cc-input {
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 14px;
      font-family: inherit;
    }
    .cc-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
      padding: 7px 9px;
    }

    .cc-preview-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .cc-preview-warn {
      font-size: 11px;
      color: var(--md-sys-color-error, #b3261e);
      background: var(--md-sys-color-error-container, #f9dedc);
      padding: 2px 8px;
      border-radius: 8px;
    }
    .cc-preview-body {
      margin: 0;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 10px;
      padding: 14px 16px;
      font-family: var(--md-sys-typescale-body-medium-font, ui-monospace, "SF Mono", monospace);
      font-size: 13px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 320px;
      overflow-y: auto;
    }
    .cc-sign-hint {
      margin: 6px 0 0;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
    }

    .cc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .cc-action {
      border-radius: 20px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .cc-action:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .cc-action--primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border: none;
    }
    .cc-action--ghost {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .cc-history-list {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cc-history-item {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .cc-history-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cc-history-mode {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 2px 8px;
      border-radius: 8px;
    }
    .cc-history-mode[data-mode="sent"] {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .cc-history-mode[data-mode="copied"] {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }
    .cc-history-title {
      flex: 1;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .cc-history-time {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    @media (max-width: 820px) {
      .cc-grid { grid-template-columns: 1fr; }
      .cc-sidebar { max-height: none; }
    }
  `],
})
export class CommunicationCenterComponent {
  protected readonly state = inject(CommunicationCenterStateService);
  private readonly templatesSvc = inject(LandlordCommunicationTemplatesService);

  protected readonly categories = CATEGORY_ORDER;
  protected readonly templatesByCategory = this.templatesSvc.byCategory;
  protected readonly totalTemplates = () => this.templatesSvc.templates().length;

  protected onPlaceholder(key: string, e: Event): void {
    this.state.setPlaceholder(key, (e.target as HTMLInputElement).value);
  }

  protected isMissing(key: string): boolean {
    return this.state.missingPlaceholders().includes(key);
  }

  protected copy(): void {
    const entry = this.state.copyToClipboard();
    if (entry && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(entry.body).catch(() => void 0);
    }
  }
}
