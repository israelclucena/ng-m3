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

export interface StepperStep {
  /** Step label */
  label: string;
  /** Optional description below the label */
  description?: string;
  /** Material Symbols icon (overrides step number) */
  icon?: string;
  /** Whether this step is optional */
  optional?: boolean;
  /** Whether this step has an error */
  hasError?: boolean;
}

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperMode = 'linear' | 'free';

export interface StepChangeEvent {
  previousIndex: number;
  currentIndex: number;
}

/**
 * Stepper — Multi-step wizard with linear and free navigation modes.
 *
 * Supports horizontal/vertical orientation, optional steps, error states,
 * and custom icons. Uses Angular Signals; no RxJS.
 *
 * @example
 * ```html
 * <iu-stepper
 *   [steps]="steps"
 *   [activeStep]="currentStep"
 *   orientation="horizontal"
 *   mode="linear"
 *   (stepChange)="onStepChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="iu-stepper"
      [class.iu-stepper--horizontal]="orientation() === 'horizontal'"
      [class.iu-stepper--vertical]="orientation() === 'vertical'"
      [class.iu-stepper--linear]="mode() === 'linear'"
      role="tablist"
      [attr.aria-orientation]="orientation()"
    >
      @for (step of steps(); track step.label; let i = $index) {
        <!-- Step indicator row -->
        <div
          class="iu-stepper__step"
          [class.iu-stepper__step--active]="i === activeStep()"
          [class.iu-stepper__step--completed]="isCompleted(i)"
          [class.iu-stepper__step--error]="step.hasError"
          [class.iu-stepper__step--clickable]="isClickable(i)"
          role="tab"
          [attr.aria-selected]="i === activeStep()"
          [attr.aria-label]="step.label"
          (click)="onStepClick(i)"
          (keydown.enter)="onStepClick(i)"
          [attr.tabindex]="i === activeStep() ? 0 : -1"
        >
          <!-- Step bubble -->
          <div class="iu-stepper__bubble">
            @if (step.hasError) {
              <span class="material-symbols-outlined">error</span>
            } @else if (isCompleted(i)) {
              <span class="material-symbols-outlined">check</span>
            } @else if (step.icon) {
              <span class="material-symbols-outlined">{{ step.icon }}</span>
            } @else {
              <span class="iu-stepper__number">{{ i + 1 }}</span>
            }
          </div>

          <!-- Step labels -->
          <div class="iu-stepper__labels">
            <span class="iu-stepper__label">{{ step.label }}</span>
            @if (step.optional) {
              <span class="iu-stepper__optional">Optional</span>
            }
            @if (step.description) {
              <span class="iu-stepper__description">{{ step.description }}</span>
            }
          </div>

          <!-- Connector line (not after last step) -->
          @if (i < steps().length - 1) {
            <div class="iu-stepper__connector"></div>
          }
        </div>
      }
    </div>

    <!-- Step content slot (vertical mode) -->
    @if (orientation() === 'vertical') {
      <div class="iu-stepper__content">
        <ng-content />
      </div>
    }

    <!-- Navigation controls -->
    @if (showControls()) {
      <div class="iu-stepper__nav">
        <button
          class="iu-stepper__btn iu-stepper__btn--back"
          [disabled]="activeStep() === 0"
          (click)="back()"
        >
          <span class="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        @if (activeStep() < steps().length - 1) {
          <button
            class="iu-stepper__btn iu-stepper__btn--next"
            (click)="next()"
          >
            Next
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        } @else {
          <button
            class="iu-stepper__btn iu-stepper__btn--finish"
            (click)="finish()"
          >
            <span class="material-symbols-outlined">check</span>
            Finish
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .iu-stepper {
      display: flex;

      &--horizontal {
        flex-direction: row;
        align-items: flex-start;
        gap: 0;
      }

      &--vertical {
        flex-direction: column;
        gap: 0;
      }
    }

    /* ── Step ── */
    .iu-stepper__step {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 12px;
      cursor: default;
      outline: none;

      .iu-stepper--vertical & {
        flex-direction: row;
        align-items: flex-start;
        flex: none;
        padding: 0 0 24px 0;
        position: relative;
      }

      &--clickable {
        cursor: pointer;

        &:hover .iu-stepper__bubble {
          box-shadow: 0 0 0 4px var(--md-sys-color-primary-container, #eaddff);
        }
      }
    }

    /* ── Bubble ── */
    .iu-stepper__bubble {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 14px;
      font-weight: 600;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 0.2s, color 0.2s, box-shadow 0.2s;

      .material-symbols-outlined { font-size: 18px; }

      .iu-stepper__step--active & {
        background: var(--md-sys-color-primary, #6750a4);
        color: var(--md-sys-color-on-primary, #fff);
      }

      .iu-stepper__step--completed & {
        background: var(--md-sys-color-primary, #6750a4);
        color: var(--md-sys-color-on-primary, #fff);
      }

      .iu-stepper__step--error & {
        background: var(--md-sys-color-error, #b3261e);
        color: var(--md-sys-color-on-error, #fff);
      }
    }

    /* ── Labels ── */
    .iu-stepper__labels {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;

      .iu-stepper--horizontal & {
        display: none; /* hidden in compact horizontal mode */
      }
    }

    .iu-stepper__label {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);

      .iu-stepper__step--active & {
        color: var(--md-sys-color-primary, #6750a4);
        font-weight: 600;
      }

      .iu-stepper__step--completed & {
        color: var(--md-sys-color-on-surface, #1c1b1f);
      }
    }

    .iu-stepper__optional {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
    }

    .iu-stepper__description {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Connector ── */
    .iu-stepper__connector {
      flex: 1;
      height: 2px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      transition: background 0.3s;

      .iu-stepper--horizontal & {
        margin: 0 8px;
        margin-top: 16px;
        align-self: flex-start;
        flex: 1;
      }

      .iu-stepper--vertical & {
        width: 2px;
        height: auto;
        flex: none;
        position: absolute;
        left: 15px;
        top: 32px;
        bottom: 0;
      }

      .iu-stepper__step--completed ~ .iu-stepper__step & {
        background: var(--md-sys-color-primary, #6750a4);
      }
    }

    /* ── Navigation ── */
    .iu-stepper__nav {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }

    .iu-stepper__btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      border-radius: 20px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      .material-symbols-outlined { font-size: 18px; }
    }
    .iu-stepper__btn--back {
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      border: 1px solid var(--md-sys-color-outline, #79747e);
    }
    .iu-stepper__btn--back:hover:not(:disabled) {
      background: var(--md-sys-color-surface-container, #f3edf7);
    }
    .iu-stepper__btn--back:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }
    .iu-stepper__btn--next {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      margin-left: auto;
    }
    .iu-stepper__btn--next:hover {
      background: var(--md-sys-color-primary, #7965af);
    }
    .iu-stepper__btn--finish {
      background: var(--md-sys-color-tertiary, #7d5260);
      color: var(--md-sys-color-on-tertiary, #fff);
      margin-left: auto;
    }
    .iu-stepper__btn--finish:hover {
      background: var(--md-sys-color-tertiary, #6b4252);
    }

    .iu-stepper__content {
      margin-left: 44px;
      padding: 16px 0;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  /** Step definitions */
  steps = input<StepperStep[]>([]);
  /** Currently active step index (0-based) */
  activeStep = input<number>(0);
  /** Orientation */
  orientation = input<StepperOrientation>('horizontal');
  /** Navigation mode */
  mode = input<StepperMode>('linear');
  /** Whether to show built-in navigation buttons */
  showControls = input<boolean>(true);

  /** Emits when the active step changes */
  stepChange = output<StepChangeEvent>();
  /** Emits when the last step's Finish button is clicked */
  finished = output<void>();

  readonly _activeStep = signal(0);

  constructor() {
    // Sync external activeStep input to internal signal
    // Note: In production, use model() when Angular 17.1+ available
  }

  /** @internal */
  isCompleted(index: number): boolean {
    return index < (this.activeStep());
  }

  /** @internal */
  isClickable(index: number): boolean {
    if (this.mode() === 'free') return true;
    // Linear: only completed and active are reachable
    return index <= this.activeStep();
  }

  /** @internal */
  onStepClick(index: number): void {
    if (!this.isClickable(index)) return;
    this.stepChange.emit({ previousIndex: this.activeStep(), currentIndex: index });
  }

  /** @internal — built-in nav */
  next(): void {
    if (this.activeStep() < this.steps().length - 1) {
      this.stepChange.emit({
        previousIndex: this.activeStep(),
        currentIndex: this.activeStep() + 1,
      });
    }
  }

  /** @internal — built-in nav */
  back(): void {
    if (this.activeStep() > 0) {
      this.stepChange.emit({
        previousIndex: this.activeStep(),
        currentIndex: this.activeStep() - 1,
      });
    }
  }

  /** @internal — finish */
  finish(): void {
    this.finished.emit();
  }
}
