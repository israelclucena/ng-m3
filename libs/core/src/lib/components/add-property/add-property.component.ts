import { Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="iu-add-property">

      <!-- ── Step Progress ── -->
      <div class="step-track" role="list">
        @for (step of steps; track step.index; let i = $index) {
          <div class="step-item" [class.done]="currentStep() > i" [class.active]="currentStep() === i">
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
              <label class="field-label">Título do anúncio *</label>
              <input class="field-input" type="text" placeholder="Ex: Apartamento T2 renovado em Príncipe Real"
                [(ngModel)]="form.title" maxlength="100" />
              <span class="field-hint">{{ form.title.length }}/100 caracteres</span>
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Tipo de imóvel *</label>
                <select class="field-select" [(ngModel)]="form.type">
                  <option value="">-- selecionar --</option>
                  <option value="apartment">Apartamento</option>
                  <option value="studio">Estúdio</option>
                  <option value="house">Moradia</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="villa">Villa</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Zona / Bairro *</label>
                <input class="field-input" type="text" placeholder="Ex: Príncipe Real, Lisboa" [(ngModel)]="form.location" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Endereço completo</label>
              <input class="field-input" type="text" placeholder="Rua, número, código postal" [(ngModel)]="form.address" />
            </div>
          </div>
        }

        <!-- STEP 1 — Details -->
        @if (currentStep() === 1) {
          <div class="form-section">
            <h3 class="section-title">Detalhes do Imóvel</h3>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Renda mensal (€) *</label>
                <input class="field-input" type="number" placeholder="1200" min="100" [(ngModel)]="form.priceMonthly" />
              </div>
              <div class="field-group">
                <label class="field-label">Disponível a partir de</label>
                <input class="field-input" type="date" [(ngModel)]="form.availableFrom" />
              </div>
            </div>

            <div class="field-row three-col">
              <div class="field-group">
                <label class="field-label">Quartos</label>
                <div class="number-control">
                  <button class="num-btn" (click)="adjust('bedrooms', -1)" [disabled]="form.bedrooms <= 0">−</button>
                  <span class="num-val">{{ form.bedrooms === 0 ? 'Studio' : form.bedrooms }}</span>
                  <button class="num-btn" (click)="adjust('bedrooms', 1)" [disabled]="form.bedrooms >= 10">+</button>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">WC</label>
                <div class="number-control">
                  <button class="num-btn" (click)="adjust('bathrooms', -1)" [disabled]="form.bathrooms <= 1">−</button>
                  <span class="num-val">{{ form.bathrooms }}</span>
                  <button class="num-btn" (click)="adjust('bathrooms', 1)" [disabled]="form.bathrooms >= 5">+</button>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Área (m²)</label>
                <input class="field-input" type="number" placeholder="75" min="10" [(ngModel)]="form.areaSqm" />
              </div>
            </div>

            <div class="toggle-row">
              <label class="toggle-item">
                <span class="toggle-track" [class.on]="form.furnished" (click)="form.furnished = !form.furnished">
                  <span class="toggle-thumb"></span>
                </span>
                <span class="toggle-label">
                  <span class="material-symbols-outlined">chair</span>
                  Mobilado
                </span>
              </label>
              <label class="toggle-item">
                <span class="toggle-track" [class.on]="form.petsAllowed" (click)="form.petsAllowed = !form.petsAllowed">
                  <span class="toggle-thumb"></span>
                </span>
                <span class="toggle-label">
                  <span class="material-symbols-outlined">pets</span>
                  Aceita animais
                </span>
              </label>
            </div>
          </div>
        }

        <!-- STEP 2 — Description & Media -->
        @if (currentStep() === 2) {
          <div class="form-section">
            <h3 class="section-title">Descrição e Média</h3>

            <div class="field-group">
              <label class="field-label">Descrição do imóvel *</label>
              <textarea class="field-textarea" rows="5" maxlength="1000"
                placeholder="Descreve o imóvel: localização, estado de conservação, vizinhança, transportes próximos..."
                [(ngModel)]="form.description"></textarea>
              <span class="field-hint">{{ form.description.length }}/1000 caracteres</span>
            </div>

            <div class="field-group">
              <label class="field-label">Características</label>
              <div class="features-grid">
                @for (feat of featureOptions; track feat.key) {
                  <label class="feat-chip" [class.selected]="hasFeature(feat.key)" (click)="toggleFeature(feat.key)">
                    <span class="material-symbols-outlined">{{ feat.icon }}</span>
                    {{ feat.label }}
                  </label>
                }
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">URLs de imagens (uma por linha)</label>
              <textarea class="field-textarea" rows="3"
                placeholder="https://images.unsplash.com/..."
                [value]="form.imageUrls.join('\n')"
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
                <span class="review-value">{{ form.title || '—' }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Tipo</span>
                <span class="review-value">{{ typeLabel(form.type) }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Localização</span>
                <span class="review-value">{{ form.location || '—' }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Renda mensal</span>
                <span class="review-value price">€{{ form.priceMonthly | number:'1.0-0' }}/mês</span>
              </div>
              <div class="review-row">
                <span class="review-label">Quartos / WC / Área</span>
                <span class="review-value">{{ form.bedrooms === 0 ? 'Studio' : form.bedrooms + ' qtos' }} · {{ form.bathrooms }} WC · {{ form.areaSqm }} m²</span>
              </div>
              @if (form.availableFrom) {
                <div class="review-row">
                  <span class="review-label">Disponível a partir de</span>
                  <span class="review-value">{{ form.availableFrom }}</span>
                </div>
              }
              <div class="review-row">
                <span class="review-label">Extras</span>
                <span class="review-value">
                  @if (form.furnished) { <span class="mini-chip">Mobilado</span> }
                  @if (form.petsAllowed) { <span class="mini-chip">Animais ✓</span> }
                  @for (f of form.features; track f) { <span class="mini-chip">{{ f }}</span> }
                </span>
              </div>
              @if (form.description) {
                <div class="review-row description-row">
                  <span class="review-label">Descrição</span>
                  <span class="review-value desc-preview">{{ form.description | slice:0:160 }}{{ form.description.length > 160 ? '…' : '' }}</span>
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

  form: NewPropertyForm = {
    title: '',
    type: '' as 'apartment',
    location: '',
    address: '',
    priceMonthly: 0,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 0,
    availableFrom: '',
    furnished: false,
    petsAllowed: false,
    description: '',
    features: [],
    imageUrls: [],
  };

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

  readonly isValid = computed(() => {
    return !!(this.form.title && this.form.type && this.form.location && this.form.priceMonthly > 0);
  });

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
    if (this.isValid()) {
      this.submitted.emit({ ...this.form });
    }
  }

  adjust(field: 'bedrooms' | 'bathrooms', delta: number): void {
    this.form[field] = Math.max(field === 'bedrooms' ? 0 : 1, Math.min(field === 'bedrooms' ? 10 : 5, this.form[field] + delta));
  }

  hasFeature(key: string): boolean {
    return this.form.features.includes(key);
  }

  toggleFeature(key: string): void {
    if (this.hasFeature(key)) {
      this.form.features = this.form.features.filter(f => f !== key);
    } else {
      this.form.features = [...this.form.features, key];
    }
  }

  onImagesInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.form.imageUrls = val.split('\n').map(s => s.trim()).filter(Boolean);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      apartment: 'Apartamento', studio: 'Estúdio',
      house: 'Moradia', penthouse: 'Penthouse', villa: 'Villa',
    };
    return map[type] ?? (type || '—');
  }
}
