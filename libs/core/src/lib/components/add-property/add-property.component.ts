import { Component, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  createSignalForm,
  required,
  maxLength,
  range,
} from '../../utils/signal-form';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * Data collected across the Add Property multi-step form.
 * Feature flag: `ADD_PROPERTY`
 */
export interface NewPropertyForm {
  // Step 1 — Basic Info
  title: string;
  type: 'apartment' | 'studio' | 'house' | 'penthouse' | 'villa';
  location: string;
  address: string;

  // Step 2 — Details
  priceMonthly: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  availableFrom: string;
  furnished: boolean;
  petsAllowed: boolean;

  // Step 3 — Description + Media
  description: string;
  features: string[];
  imageUrls: string[];

  // Step 4 — Review (no new fields)
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-add-property` — multi-step property listing creation form.
 *
 * Uses the existing `iu-stepper` design language (same visual step header)
 * with M3 inputs/tokens throughout. 4 steps: Basic Info → Details →
 * Description & Media → Review & Submit.
 *
 * State is driven by the project `createSignalForm` utility (Signal Forms —
 * no RxJS, no `FormsModule`/`ngModel`): the eight text/select/number/date
 * inputs live in `form`, while the interactive controls (steppers, toggles,
 * feature chips, image list) are plain writable signals.
 *
 * Feature flag: `ADD_PROPERTY`
 *
 * @example
 * ```html
 * <iu-add-property
 *   (submitted)="onPropertySubmit($event)"
 *   (cancelled)="showAddForm.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'iu-add-property',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-add-property">

      <!-- ── Step Progress ── -->
      <div class="step-track" role="list">
        @for (step of steps; track step.index; let i = $index) {
          <div class="step-item" role="listitem" [class.done]="currentStep() > i" [class.active]="currentStep() === i">
            <div class="step-bubble">
              @if (currentStep() > i) {
                <span class="material-symbols-outlined">check</span>
              } @else {
                {{ i + 1 }}
              }
            </div>
            <span class="step-label">{{ step.label }}</span>
            @if (i < steps.length - 1) {
              <div class="step-connector"></div>
            }
          </div>
        }
      </div>

      <!-- ── Form Body ── -->
      <div class="form-body">

        <!-- STEP 0 — Basic Info -->
        @if (currentStep() === 0) {
          <div class="form-section">
            <h3 class="section-title">Informações Básicas</h3>

            <div class="field-group">
              <label class="field-label" for="ap-title">Título do anúncio *</label>
              <input class="field-input" id="ap-title" type="text" placeholder="Ex: Apartamento T2 renovado em Príncipe Real"
                maxlength="100"
                [value]="form.fields.title.value()"
                (input)="form.fields.title.setValue($any($event.target).value)"
                (blur)="form.fields.title.touch()" />
              <span class="field-hint">{{ form.fields.title.value().length }}/100 caracteres</span>
              @if (form.fields.title.showError()) {
                <span class="field-error">{{ form.fields.title.firstError() }}</span>
              }
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label" for="ap-type">Tipo de imóvel *</label>
                <select class="field-select" id="ap-type"
                  [value]="form.fields.type.value()"
                  (change)="form.fields.type.setValue($any($event.target).value)"
                  (blur)="form.fields.type.touch()">
                  <option value="">-- selecionar --</option>
                  <option value="apartment">Apartamento</option>
                  <option value="studio">Estúdio</option>
                  <option value="house">Moradia</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="villa">Villa</option>
                </select>
                @if (form.fields.type.showError()) {
                  <span class="field-error">{{ form.fields.type.firstError() }}</span>
                }
              </div>
              <div class="field-group">
                <label class="field-label" for="ap-location">Zona / Bairro *</label>
                <input class="field-input" id="ap-location" type="text" placeholder="Ex: Príncipe Real, Lisboa"
                  [value]="form.fields.location.value()"
                  (input)="form.fields.location.setValue($any($event.target).value)"
                  (blur)="form.fields.location.touch()" />
                @if (form.fields.location.showError()) {
                  <span class="field-error">{{ form.fields.location.firstError() }}</span>
                }
              </div>
            </div>

            <div class="field-group">
              <label class="field-label" for="ap-address">Endereço completo</label>
              <input class="field-input" id="ap-address" type="text" placeholder="Rua, número, código postal"
                [value]="form.fields.address.value()"
                (input)="form.fields.address.setValue($any($event.target).value)" />
            </div>
          </div>
        }

        <!-- STEP 1 — Details -->
        @if (currentStep() === 1) {
          <div class="form-section">
            <h3 class="section-title">Detalhes do Imóvel</h3>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label" for="ap-price">Renda mensal (€) *</label>
                <input class="field-input" id="ap-price" type="number" placeholder="1200" min="100"
                  [value]="form.fields.priceMonthly.value()"
                  (input)="form.fields.priceMonthly.setValue(+$any($event.target).value)"
                  (blur)="form.fields.priceMonthly.touch()" />
                @if (form.fields.priceMonthly.showError()) {
                  <span class="field-error">{{ form.fields.priceMonthly.firstError() }}</span>
                }
              </div>
              <div class="field-group">
                <label class="field-label" for="ap-available">Disponível a partir de</label>
                <input class="field-input" id="ap-available" type="date"
                  [value]="form.fields.availableFrom.value()"
                  (input)="form.fields.availableFrom.setValue($any($event.target).value)" />
              </div>
            </div>

            <div class="field-row three-col">
              <div class="field-group">
                <span class="field-label" id="ap-bedrooms-label">Quartos</span>
                <div class="number-control" role="group" aria-labelledby="ap-bedrooms-label">
                  <button class="num-btn" (click)="adjust('bedrooms', -1)" [disabled]="bedrooms() <= 0">−</button>
                  <span class="num-val">{{ bedrooms() === 0 ? 'Studio' : bedrooms() }}</span>
                  <button class="num-btn" (click)="adjust('bedrooms', 1)" [disabled]="bedrooms() >= 10">+</button>
                </div>
              </div>
              <div class="field-group">
                <span class="field-label" id="ap-bathrooms-label">WC</span>
                <div class="number-control" role="group" aria-labelledby="ap-bathrooms-label">
                  <button class="num-btn" (click)="adjust('bathrooms', -1)" [disabled]="bathrooms() <= 1">−</button>
                  <span class="num-val">{{ bathrooms() }}</span>
                  <button class="num-btn" (click)="adjust('bathrooms', 1)" [disabled]="bathrooms() >= 5">+</button>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label" for="ap-area">Área (m²)</label>
                <input class="field-input" id="ap-area" type="number" placeholder="75" min="10"
                  [value]="form.fields.areaSqm.value()"
                  (input)="form.fields.areaSqm.setValue(+$any($event.target).value)" />
              </div>
            </div>

            <div class="toggle-row">
              <div class="toggle-item">
                <span class="toggle-track" role="switch" tabindex="0" aria-label="Mobilado"
                  [class.on]="furnished()" [attr.aria-checked]="furnished()"
                  (click)="furnished.set(!furnished())"
                  (keydown.enter)="furnished.set(!furnished())"
                  (keydown.space)="furnished.set(!furnished()); $event.preventDefault()">
                  <span class="toggle-thumb"></span>
                </span>
                <span class="toggle-label">
                  <span class="material-symbols-outlined">chair</span>
                  Mobilado
                </span>
              </div>
              <div class="toggle-item">
                <span class="toggle-track" role="switch" tabindex="0" aria-label="Aceita animais"
                  [class.on]="petsAllowed()" [attr.aria-checked]="petsAllowed()"
                  (click)="petsAllowed.set(!petsAllowed())"
                  (keydown.enter)="petsAllowed.set(!petsAllowed())"
                  (keydown.space)="petsAllowed.set(!petsAllowed()); $event.preventDefault()">
                  <span class="toggle-thumb"></span>
                </span>
                <span class="toggle-label">
                  <span class="material-symbols-outlined">pets</span>
                  Aceita animais
                </span>
              </div>
            </div>
          </div>
        }

        <!-- STEP 2 — Description & Media -->
        @if (currentStep() === 2) {
          <div class="form-section">
            <h3 class="section-title">Descrição e Média</h3>

            <div class="field-group">
              <label class="field-label" for="ap-description">Descrição do imóvel *</label>
              <textarea class="field-textarea" id="ap-description" rows="5" maxlength="1000"
                placeholder="Descreve o imóvel: localização, estado de conservação, vizinhança, transportes próximos..."
                [value]="form.fields.description.value()"
                (input)="form.fields.description.setValue($any($event.target).value)"></textarea>
              <span class="field-hint">{{ form.fields.description.value().length }}/1000 caracteres</span>
            </div>

            <div class="field-group">
              <span class="field-label" id="ap-features-label">Características</span>
              <div class="features-grid" role="group" aria-labelledby="ap-features-label">
                @for (feat of featureOptions; track feat.key) {
                  <button type="button" class="feat-chip" [class.selected]="hasFeature(feat.key)" (click)="toggleFeature(feat.key)">
                    <span class="material-symbols-outlined">{{ feat.icon }}</span>
                    {{ feat.label }}
                  </button>
                }
              </div>
            </div>

            <div class="field-group">
              <label class="field-label" for="ap-images">URLs de imagens (uma por linha)</label>
              <textarea class="field-textarea" id="ap-images" rows="3"
                placeholder="https://images.unsplash.com/..."
                [value]="imageUrls().join('\n')"
                (blur)="onImagesInput($event)"></textarea>
              <span class="field-hint">Suporta URLs do Unsplash, Cloudinary ou directo.</span>
            </div>
          </div>
        }

        <!-- STEP 3 — Review -->
        @if (currentStep() === 3) {
          <div class="form-section">
            <h3 class="section-title">Rever e Publicar</h3>

            <div class="review-card">
              <div class="review-row">
                <span class="review-label">Título</span>
                <span class="review-value">{{ form.fields.title.value() || '—' }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Tipo</span>
                <span class="review-value">{{ typeLabel(form.fields.type.value()) }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Localização</span>
                <span class="review-value">{{ form.fields.location.value() || '—' }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Renda mensal</span>
                <span class="review-value price">€{{ form.fields.priceMonthly.value() | number:'1.0-0' }}/mês</span>
              </div>
              <div class="review-row">
                <span class="review-label">Quartos / WC / Área</span>
                <span class="review-value">{{ bedrooms() === 0 ? 'Studio' : bedrooms() + ' qtos' }} · {{ bathrooms() }} WC · {{ form.fields.areaSqm.value() }} m²</span>
              </div>
              @if (form.fields.availableFrom.value()) {
                <div class="review-row">
                  <span class="review-label">Disponível a partir de</span>
                  <span class="review-value">{{ form.fields.availableFrom.value() }}</span>
                </div>
              }
              <div class="review-row">
                <span class="review-label">Extras</span>
                <span class="review-value">
                  @if (furnished()) { <span class="mini-chip">Mobilado</span> }
                  @if (petsAllowed()) { <span class="mini-chip">Animais ✓</span> }
                  @for (f of features(); track f) { <span class="mini-chip">{{ f }}</span> }
                </span>
              </div>
              @if (form.fields.description.value()) {
                <div class="review-row description-row">
                  <span class="review-label">Descrição</span>
                  <span class="review-value desc-preview">{{ form.fields.description.value() | slice:0:160 }}{{ form.fields.description.value().length > 160 ? '…' : '' }}</span>
                </div>
              }
            </div>

            @if (!isValid()) {
              <div class="validation-warn">
                <span class="material-symbols-outlined">warning</span>
                Preenche os campos obrigatórios: título, tipo, zona e renda mensal.
              </div>
            }
          </div>
        }

      </div>

      <!-- ── Navigation ── -->
      <div class="form-nav">
        <button class="nav-btn secondary" (click)="onBack()" [disabled]="currentStep() === 0">
          <span class="material-symbols-outlined">arrow_back</span>
          Anterior
        </button>

        <div class="nav-dots">
          @for (step of steps; track step.index; let i = $index) {
            <span class="dot" [class.active]="currentStep() === i"></span>
          }
        </div>

        @if (currentStep() < steps.length - 1) {
          <button class="nav-btn primary" (click)="onNext()">
            Seguinte
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        } @else {
          <button class="nav-btn success" (click)="onSubmit()" [disabled]="!isValid()">
            <span class="material-symbols-outlined">publish</span>
            Publicar Imóvel
          </button>
        }
      </div>

      <!-- Cancel -->
      <div class="cancel-wrap">
        <button class="cancel-btn" (click)="cancelled.emit()">Cancelar</button>
      </div>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .iu-add-property {
      font-family: 'Roboto', sans-serif;
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 24px;
      padding: 28px;
      max-width: 680px;
      margin: 0 auto;
    }

    /* ── Step track ── */
    .step-track {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 32px;
      position: relative;
    }

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex: 1;
      position: relative;
    }

    .step-bubble {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fffbfe);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 0.3s;
      z-index: 1;
    }

    .step-item.active .step-bubble {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }

    .step-item.done .step-bubble {
      border-color: var(--md-sys-color-secondary, #625b71);
      background: var(--md-sys-color-secondary, #625b71);
      color: var(--md-sys-color-on-secondary, #fff);
    }

    .step-item.done .step-bubble .material-symbols-outlined { font-size: 18px; }

    .step-label {
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
      white-space: nowrap;
    }

    .step-item.active .step-label { color: var(--md-sys-color-primary, #6750a4); font-weight: 700; }

    .step-connector {
      position: absolute;
      top: 17px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      z-index: 0;
    }

    .step-item.done .step-connector {
      background: var(--md-sys-color-secondary, #625b71);
    }

    /* ── Form ── */
    .form-body { min-height: 280px; }

    .form-section { animation: fadeIn 0.2s ease; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

    .section-title {
      margin: 0 0 20px;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 18px;
    }

    .field-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .field-input,
    .field-select,
    .field-textarea {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface-container-lowest, #fffbfe);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 0.2s;
      width: 100%;
      box-sizing: border-box;
    }

    .field-input:focus,
    .field-select:focus,
    .field-textarea:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px rgba(103,80,164,.12);
    }

    .field-textarea { resize: vertical; min-height: 100px; }

    .field-hint {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .field-error {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--md-sys-color-error, #b3261e);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .field-row.three-col { grid-template-columns: 1fr 1fr 1fr; }

    @media (max-width: 540px) {
      .field-row { grid-template-columns: 1fr; }
      .field-row.three-col { grid-template-columns: 1fr 1fr; }
    }

    /* ── Number controls ── */
    .number-control {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface-container-lowest, #fffbfe);
    }

    .num-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: transparent;
      color: var(--md-sys-color-primary, #6750a4);
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .num-btn:hover:not(:disabled) { background: var(--md-sys-color-primary-container, #eaddff); }
    .num-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .num-val {
      flex: 1;
      text-align: center;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    /* ── Toggle row ── */
    .toggle-row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .toggle-track {
      width: 44px;
      height: 26px;
      border-radius: 100px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      position: relative;
      transition: background 0.2s;
      cursor: pointer;
    }

    .toggle-track.on { background: var(--md-sys-color-primary, #6750a4); }

    .toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.2s;
    }

    .toggle-track.on .toggle-thumb { transform: translateX(18px); }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .toggle-label .material-symbols-outlined { font-size: 18px; color: var(--md-sys-color-primary, #6750a4); }

    /* ── Features grid ── */
    .features-grid {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .feat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: 100px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: inherit;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }

    .feat-chip.selected {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .feat-chip .material-symbols-outlined { font-size: 15px; }

    /* ── Review ── */
    .review-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .review-row {
      display: flex;
      gap: 12px;
      font-size: 0.9rem;
    }

    .review-label {
      min-width: 140px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }

    .review-value {
      color: var(--md-sys-color-on-surface, #1c1b1f);
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .review-value.price {
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 700;
    }

    .description-row { align-items: flex-start; }
    .desc-preview { font-size: 0.85rem; opacity: 0.8; }

    .mini-chip {
      padding: 2px 8px;
      border-radius: 100px;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .validation-warn {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
      font-size: 0.85rem;
    }

    .validation-warn .material-symbols-outlined { font-size: 18px; }

    /* ── Navigation ── */
    .form-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 28px;
    }

    .nav-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      transition: background 0.2s, width 0.2s;
    }

    .dot.active {
      background: var(--md-sys-color-primary, #6750a4);
      width: 20px;
      border-radius: 4px;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 100px;
      border: none;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s, background 0.2s;
    }

    .nav-btn .material-symbols-outlined { font-size: 18px; }

    .nav-btn.primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }

    .nav-btn.secondary {
      background: var(--md-sys-color-surface-container, #ece6f0);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .nav-btn.success {
      background: #2e7d32;
      color: #fff;
    }

    .nav-btn:hover:not(:disabled) { opacity: 0.9; }
    .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .cancel-wrap {
      margin-top: 12px;
      text-align: center;
    }

    .cancel-btn {
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
    }
  `],
})
export class AddPropertyComponent {
  /** Emits the completed form data on successful submission. */
  readonly submitted = output<NewPropertyForm>();

  /** Emits when user clicks "Cancelar". */
  readonly cancelled = output<void>();

  readonly currentStep = signal(0);

  readonly steps = [
    { index: 0, label: 'Informações' },
    { index: 1, label: 'Detalhes' },
    { index: 2, label: 'Descrição' },
    { index: 3, label: 'Publicar' },
  ];

  /**
   * Signal-form state for the eight free-text / select / number / date inputs.
   * Required validators back `isValid()`; `showError()` drives inline messages.
   */
  readonly form = createSignalForm({
    title:         { value: '', validators: [required('Título obrigatório'), maxLength(100, 'Máximo 100 caracteres')] },
    type:          { value: '' as NewPropertyForm['type'] | '', validators: [required('Tipo obrigatório')] },
    location:      { value: '', validators: [required('Zona obrigatória')] },
    address:       { value: '' },
    priceMonthly:  { value: 0, validators: [range(1, 1_000_000, 'Renda deve ser maior que 0')] },
    areaSqm:       { value: 0 },
    availableFrom: { value: '' },
    description:   { value: '', validators: [maxLength(1000, 'Máximo 1000 caracteres')] },
  });

  // ── Interactive (non-text) controls — plain writable signals ──────────────
  readonly bedrooms    = signal(1);
  readonly bathrooms   = signal(1);
  readonly furnished   = signal(false);
  readonly petsAllowed = signal(false);
  readonly features    = signal<string[]>([]);
  readonly imageUrls   = signal<string[]>([]);

  readonly featureOptions = [
    { key: 'Varanda', label: 'Varanda', icon: 'balcony' },
    { key: 'Terraço', label: 'Terraço', icon: 'roofing' },
    { key: 'Garagem', label: 'Garagem', icon: 'garage' },
    { key: 'Elevador', label: 'Elevador', icon: 'elevator' },
    { key: 'Piscina', label: 'Piscina', icon: 'pool' },
    { key: 'AC', label: 'AC / Aquecimento', icon: 'ac_unit' },
    { key: 'Porteiro', label: 'Porteiro', icon: 'security' },
    { key: 'Arrecadação', label: 'Arrecadação', icon: 'warehouse' },
  ];

  /**
   * True when the four required inputs (title, type, location, priceMonthly)
   * pass validation. Backed directly by the signal form's field validity.
   */
  readonly isValid = computed(() =>
    !this.form.fields.title.invalid() &&
    !this.form.fields.type.invalid() &&
    !this.form.fields.location.invalid() &&
    !this.form.fields.priceMonthly.invalid()
  );

  onNext(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  onBack(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  onSubmit(): void {
    // Mark all fields touched (reveals inline errors); bail if invalid.
    this.form.submit();
    if (!this.isValid()) return;
    this.submitted.emit(this.snapshot());
  }

  /** Assemble the flat `NewPropertyForm` payload from form + signal state. */
  private snapshot(): NewPropertyForm {
    const v = this.form.value();
    return {
      title: v.title,
      type: (v.type || 'apartment') as NewPropertyForm['type'],
      location: v.location,
      address: v.address,
      priceMonthly: v.priceMonthly,
      bedrooms: this.bedrooms(),
      bathrooms: this.bathrooms(),
      areaSqm: v.areaSqm,
      availableFrom: v.availableFrom,
      furnished: this.furnished(),
      petsAllowed: this.petsAllowed(),
      description: v.description,
      features: [...this.features()],
      imageUrls: [...this.imageUrls()],
    };
  }

  adjust(field: 'bedrooms' | 'bathrooms', delta: number): void {
    const sig = field === 'bedrooms' ? this.bedrooms : this.bathrooms;
    const lo = field === 'bedrooms' ? 0 : 1;
    const hi = field === 'bedrooms' ? 10 : 5;
    sig.set(Math.max(lo, Math.min(hi, sig() + delta)));
  }

  hasFeature(key: string): boolean {
    return this.features().includes(key);
  }

  toggleFeature(key: string): void {
    this.features.update(list =>
      list.includes(key) ? list.filter(f => f !== key) : [...list, key]
    );
  }

  onImagesInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.imageUrls.set(val.split('\n').map(s => s.trim()).filter(Boolean));
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      apartment: 'Apartamento', studio: 'Estúdio',
      house: 'Moradia', penthouse: 'Penthouse', villa: 'Villa',
    };
    return map[type] ?? (type || '—');
  }
}
