import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** M3-inspired palette swatches */
const M3_PALETTE = [
  // Row 1: Primary tones
  '#21005d', '#38006b', '#4a0072', '#6750a4', '#7965af', '#9a82db', '#b69df8', '#d0bcff', '#eaddff',
  // Row 2: Secondary
  '#1d192b', '#2b2640', '#4a4458', '#625b71', '#7a7289', '#958da5', '#b0a7c0', '#ccc2dc', '#e8def8',
  // Row 3: Tertiary
  '#31111d', '#492532', '#633b48', '#7d5260', '#986977', '#b58392', '#d29dac', '#efb8c8', '#ffd8e4',
  // Row 4: Error
  '#410002', '#690005', '#93000a', '#b3261e', '#c62828', '#d32f2f', '#ef5350', '#e57373', '#ffcdd2',
  // Row 5: Neutral
  '#000000', '#1c1b1f', '#313033', '#48464c', '#605d66', '#787579', '#938f96', '#aea9b4', '#cac4d0',
  '#ddd8e1', '#e6e0e9', '#f3edf7', '#fffbfe', '#ffffff',
];

/**
 * ColorPicker — M3 palette color picker with hex/rgb input and opacity slider.
 *
 * No canvas/WebGL; uses CSS grid for swatches. Pure Signal-based.
 *
 * @example
 * ```html
 * <iu-color-picker
 *   label="Brand color"
 *   [value]="'#6750a4'"
 *   (colorChange)="onColor($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-color-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-color-picker" [class.iu-color-picker--open]="open()">
      <!-- Trigger -->
      <div class="iu-color-picker__trigger" (click)="toggle()">
        <div
          class="iu-color-picker__swatch iu-color-picker__swatch--lg"
          [style.background-color]="previewColor()"
          [title]="currentHex()"
        ></div>
        <div class="iu-color-picker__trigger-text">
          <span class="iu-color-picker__label">{{ label() }}</span>
          <span class="iu-color-picker__hex">{{ currentHex() }}</span>
        </div>
        <span class="material-symbols-outlined iu-color-picker__arrow">
          {{ open() ? 'expand_less' : 'expand_more' }}
        </span>
      </div>

      <!-- Panel -->
      @if (open()) {
        <div class="iu-color-picker__panel" role="dialog" [attr.aria-label]="'Color picker: ' + label()">
          <!-- Palette -->
          <div class="iu-color-picker__palette">
            @for (color of palette; track color) {
              <button
                class="iu-color-picker__swatch"
                [style.background-color]="color"
                [class.iu-color-picker__swatch--selected]="currentHex().toLowerCase() === color.toLowerCase()"
                (click)="selectPaletteColor(color)"
                [attr.title]="color"
                [attr.aria-label]="color"
                [attr.aria-pressed]="currentHex().toLowerCase() === color.toLowerCase()"
              ></button>
            }
          </div>

          <div class="iu-color-picker__divider"></div>

          <!-- Hex input -->
          <div class="iu-color-picker__inputs">
            <div class="iu-color-picker__input-group">
              <label class="iu-color-picker__input-label">HEX</label>
              <input
                class="iu-color-picker__input"
                [value]="hexInput()"
                (input)="onHexInput($event)"
                (blur)="onHexBlur()"
                maxlength="7"
                placeholder="#6750a4"
                spellcheck="false"
              />
            </div>

            <div class="iu-color-picker__input-group">
              <label class="iu-color-picker__input-label">R</label>
              <input
                class="iu-color-picker__input iu-color-picker__input--sm"
                type="number"
                min="0" max="255"
                [value]="rgb().r"
                (input)="onRgbInput('r', $event)"
              />
            </div>
            <div class="iu-color-picker__input-group">
              <label class="iu-color-picker__input-label">G</label>
              <input
                class="iu-color-picker__input iu-color-picker__input--sm"
                type="number"
                min="0" max="255"
                [value]="rgb().g"
                (input)="onRgbInput('g', $event)"
              />
            </div>
            <div class="iu-color-picker__input-group">
              <label class="iu-color-picker__input-label">B</label>
              <input
                class="iu-color-picker__input iu-color-picker__input--sm"
                type="number"
                min="0" max="255"
                [value]="rgb().b"
                (input)="onRgbInput('b', $event)"
              />
            </div>
          </div>

          <!-- Opacity slider -->
          @if (showOpacity()) {
            <div class="iu-color-picker__opacity-row">
              <label class="iu-color-picker__input-label">Opacity</label>
              <input
                type="range"
                min="0" max="100"
                class="iu-color-picker__slider"
                [value]="opacity()"
                (input)="onOpacityInput($event)"
              />
              <span class="iu-color-picker__opacity-value">{{ opacity() }}%</span>
            </div>
          }

          <!-- Preview + confirm -->
          <div class="iu-color-picker__footer">
            <div class="iu-color-picker__preview-pair">
              <div class="iu-color-picker__preview-swatch" [style.background-color]="previewColor()"></div>
              <span class="iu-color-picker__preview-label">{{ previewColor() }}</span>
            </div>
            <button class="iu-color-picker__confirm" (click)="confirm()">Apply</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    .iu-color-picker {
      position: relative;
      display: inline-block;
    }

    /* ── Trigger ── */
    .iu-color-picker__trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-radius: 4px 4px 0 0;
      border-bottom: 1px solid var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      min-width: 200px;
      transition: border-color 0.2s;

      .iu-color-picker--open & {
        border-bottom: 2px solid var(--md-sys-color-primary, #6750a4);
      }
    }

    .iu-color-picker__trigger-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .iu-color-picker__label {
      font-size: 12px;
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 500;
    }

    .iu-color-picker__hex {
      font-size: 14px;
      font-family: monospace;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-color-picker__arrow {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 20px;
    }

    /* ── Swatch ── */
    .iu-color-picker__swatch {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.12);
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.1s, box-shadow 0.1s;

      &--lg {
        width: 32px;
        height: 32px;
        border-radius: 6px;
      }

      &--selected {
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--md-sys-color-primary, #6750a4);
        transform: scale(1.15);
        z-index: 1;
      }

      &:hover:not(&--lg) {
        transform: scale(1.2);
        z-index: 1;
      }
    }

    /* ── Panel ── */
    .iu-color-picker__panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 200;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 16px;
      box-shadow: var(--md-sys-elevation-3, 0 4px 12px rgba(0,0,0,.2));
      padding: 16px;
      min-width: 280px;
      animation: iu-cp-in 0.15s ease-out;
    }

    @keyframes iu-cp-in {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Palette grid ── */
    .iu-color-picker__palette {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 4px;
      margin-bottom: 12px;
    }

    /* ── Divider ── */
    .iu-color-picker__divider {
      height: 1px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      margin: 12px 0;
    }

    /* ── Inputs row ── */
    .iu-color-picker__inputs {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      margin-bottom: 12px;
    }

    .iu-color-picker__input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .iu-color-picker__input-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .iu-color-picker__input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 4px;
      background: transparent;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      outline: none;
      box-sizing: border-box;
      font-family: monospace;

      &:focus {
        border-color: var(--md-sys-color-primary, #6750a4);
        box-shadow: 0 0 0 1px var(--md-sys-color-primary, #6750a4);
      }

      &--sm {
        font-size: 12px;
        text-align: center;
      }
    }

    /* ── Opacity ── */
    .iu-color-picker__opacity-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .iu-color-picker__slider {
      flex: 1;
      accent-color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-color-picker__opacity-value {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      min-width: 36px;
      text-align: right;
    }

    /* ── Footer ── */
    .iu-color-picker__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }

    .iu-color-picker__preview-pair {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .iu-color-picker__preview-swatch {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.12);
    }

    .iu-color-picker__preview-label {
      font-size: 13px;
      font-family: monospace;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-color-picker__confirm {
      padding: 8px 20px;
      border: none;
      border-radius: 20px;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      &:hover { background: var(--md-sys-color-primary, #7965af); }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  readonly palette = M3_PALETTE;

  // ── Inputs ──
  /** Field label */
  label = input<string>('Color');
  /** Initial hex color */
  value = input<string>('#6750a4');
  /** Whether to show opacity slider */
  showOpacity = input<boolean>(true);

  // ── Outputs ──
  /** Emits hex string when a color is confirmed */
  colorChange = output<string>();
  /** Emits rgba string when confirmed (includes opacity) */
  colorChangeRgba = output<string>();

  // ── State ──
  readonly open = signal(false);
  readonly hexInput = signal('#6750a4');
  readonly opacity = signal(100);

  readonly rgb = computed(() => this.hexToRgb(this.hexInput()));

  readonly currentHex = computed(() => this.hexInput());

  readonly previewColor = computed(() => {
    const { r, g, b } = this.rgb();
    const a = this.opacity() / 100;
    return a < 1 ? `rgba(${r},${g},${b},${a.toFixed(2)})` : this.hexInput();
  });

  constructor() {
    // Sync initial value
  }

  toggle(): void { this.open.update(v => !v); }

  selectPaletteColor(color: string): void {
    this.hexInput.set(color);
  }

  onHexInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.hexInput.set(val);
  }

  onHexBlur(): void {
    // Normalize hex on blur
    const raw = this.hexInput();
    const normalized = this.normalizeHex(raw);
    if (normalized) this.hexInput.set(normalized);
  }

  onRgbInput(channel: 'r' | 'g' | 'b', event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(0, Math.min(255, val));
    const current = this.rgb();
    const updated = { ...current, [channel]: clamped };
    this.hexInput.set(this.rgbToHex(updated.r, updated.g, updated.b));
  }

  onOpacityInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.opacity.set(Math.max(0, Math.min(100, val)));
  }

  confirm(): void {
    const hex = this.currentHex();
    const { r, g, b } = this.rgb();
    const a = this.opacity() / 100;
    this.colorChange.emit(hex);
    this.colorChangeRgba.emit(`rgba(${r},${g},${b},${a.toFixed(2)})`);
    this.open.set(false);
  }

  // ── Helpers ──
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return { r: 103, g: 80, b: 164 };
    const n = parseInt(clean, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  private normalizeHex(val: string): string | null {
    const clean = val.trim().replace(/^#*/, '');
    if (clean.length === 3) {
      return '#' + clean.split('').map(c => c + c).join('');
    }
    if (clean.length === 6) return '#' + clean;
    return null;
  }
}
