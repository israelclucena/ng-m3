import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TagInputTag {
  value: string;
  label?: string;
}

export interface TagInputChange {
  tags: TagInputTag[];
  added?: TagInputTag;
  removed?: TagInputTag;
}

/**
 * TagInput — Chip-style tag input with autocomplete and validation.
 *
 * Supports keyboard navigation, custom separators, and suggestion filtering.
 * Uses Angular Signals; no RxJS. M3 design tokens throughout.
 *
 * @example
 * ```html
 * <iu-tag-input
 *   placeholder="Add skills..."
 *   [suggestions]="['Angular', 'TypeScript', 'RxJS']"
 *   [maxTags]="5"
 *   (tagsChange)="onTagsChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-tag-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="iu-tag-input"
      [class.iu-tag-input--focused]="focused()"
      [class.iu-tag-input--disabled]="disabled()"
      [class.iu-tag-input--error]="!!errorMessage()"
      (click)="focusInput()"
    >
      <!-- Tags -->
      @for (tag of tags(); track tag.value) {
        <span class="iu-tag-input__tag">
          <span class="iu-tag-input__tag-label">{{ tag.label || tag.value }}</span>
          @if (!disabled()) {
            <button
              class="iu-tag-input__tag-remove"
              (mousedown)="removeTag($event, tag)"
              [attr.aria-label]="'Remove ' + (tag.label || tag.value)"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </span>
      }

      <!-- Input field -->
      @if (!maxReached()) {
        <input
          #tagInputEl
          class="iu-tag-input__input"
          [placeholder]="tags().length === 0 ? placeholder() : ''"
          [value]="inputValue()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          [attr.aria-label]="label()"
          [attr.aria-autocomplete]="suggestions().length ? 'list' : 'none'"
          autocomplete="off"
        />
      }

      <!-- Autocomplete dropdown -->
      @if (showSuggestions() && filteredSuggestions().length > 0) {
        <div class="iu-tag-input__dropdown" role="listbox">
          @for (suggestion of filteredSuggestions(); track suggestion; let i = $index) {
            <div
              class="iu-tag-input__suggestion"
              [class.iu-tag-input__suggestion--active]="activeIndex() === i"
              role="option"
              (mousedown)="addSuggestion($event, suggestion)"
              (mouseenter)="activeIndex.set(i)"
            >
              {{ suggestion }}
            </div>
          }
        </div>
      }
    </div>

    <!-- Helper/Error text -->
    @if (errorMessage()) {
      <p class="iu-tag-input__error">
        <span class="material-symbols-outlined">error</span>
        {{ errorMessage() }}
      </p>
    } @else if (helperText()) {
      <p class="iu-tag-input__helper">{{ helperText() }}</p>
    }

    @if (maxTags() && maxTags()! > 0) {
      <p class="iu-tag-input__count">{{ tags().length }}/{{ maxTags() }}</p>
    }
  `,
  styles: [`
    :host { display: block; }

    .iu-tag-input {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      min-height: 56px;
      padding: 8px 12px;
      border-radius: 4px 4px 0 0;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-bottom: 1px solid var(--md-sys-color-on-surface-variant, #49454f);
      cursor: text;
      position: relative;
      transition: border-color 0.2s;

      &--focused {
        border-bottom: 2px solid var(--md-sys-color-primary, #6750a4);
      }

      &--error {
        border-bottom: 2px solid var(--md-sys-color-error, #b3261e);
      }

      &--disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }
    }

    .iu-tag-input__tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px 0 12px;
      height: 32px;
      border-radius: 8px;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-size: 14px;
      font-weight: 500;
    }

    .iu-tag-input__tag-label {
      line-height: 32px;
    }

    .iu-tag-input__tag-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 50%;
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      padding: 0;

      &:hover {
        background: rgba(0,0,0,0.12);
      }

      .material-symbols-outlined { font-size: 14px; }
    }

    .iu-tag-input__input {
      flex: 1;
      min-width: 120px;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      caret-color: var(--md-sys-color-primary, #6750a4);

      &::placeholder {
        color: var(--md-sys-color-on-surface-variant, #49454f);
      }
    }

    .iu-tag-input__dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 4px;
      box-shadow: var(--md-sys-elevation-2, 0 2px 6px rgba(0,0,0,.15));
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
    }

    .iu-tag-input__suggestion {
      padding: 12px 16px;
      cursor: pointer;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);

      &--active,
      &:hover {
        background: var(--md-sys-color-primary-container, #eaddff);
      }
    }

    .iu-tag-input__error,
    .iu-tag-input__helper,
    .iu-tag-input__count {
      font-size: 12px;
      margin: 4px 12px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .iu-tag-input__error {
      color: var(--md-sys-color-error, #b3261e);
      .material-symbols-outlined { font-size: 14px; }
    }

    .iu-tag-input__helper {
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-tag-input__count {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      justify-content: flex-end;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagInputComponent {
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('tagInputEl');

  // ── Inputs ──
  /** Visible label (for aria) */
  label = input<string>('Tags');
  /** Input placeholder */
  placeholder = input<string>('Add tag...');
  /** Initial/controlled tag list */
  value = input<TagInputTag[]>([]);
  /** Autocomplete suggestions */
  suggestions = input<string[]>([]);
  /** Max tags allowed (0 = unlimited) */
  maxTags = input<number>(0);
  /** Characters that trigger tag creation */
  separators = input<string[]>([',', 'Enter']);
  /** Whether input is disabled */
  disabled = input<boolean>(false);
  /** Helper text below the input */
  helperText = input<string>('');
  /** Override validation error message */
  errorMessage = input<string>('');

  // ── Outputs ──
  /** Emits on every change */
  tagsChange = output<TagInputChange>();

  // ── Internal state ──
  readonly tags = signal<TagInputTag[]>([]);
  readonly inputValue = signal('');
  readonly focused = signal(false);
  readonly activeIndex = signal(-1);
  readonly showSuggestions = signal(false);

  readonly maxReached = computed(() =>
    this.maxTags() > 0 && this.tags().length >= this.maxTags()
  );

  readonly filteredSuggestions = computed(() => {
    const q = this.inputValue().toLowerCase();
    const existing = new Set(this.tags().map(t => t.value.toLowerCase()));
    return this.suggestions()
      .filter(s => s.toLowerCase().includes(q) && !existing.has(s.toLowerCase()))
      .slice(0, 8);
  });

  constructor() {
    // Sync initial value
    effect(() => {
      this.tags.set([...this.value()]);
    });
  }

  /** @internal */
  focusInput(): void {
    this.inputEl()?.nativeElement.focus();
  }

  /** @internal */
  onFocus(): void {
    this.focused.set(true);
    this.showSuggestions.set(true);
  }

  /** @internal */
  onBlur(): void {
    this.focused.set(false);
    // Small delay so click on suggestion fires first
    setTimeout(() => {
      this.showSuggestions.set(false);
      this.activeIndex.set(-1);
      // Commit lingering input as tag on blur
      const v = this.inputValue().trim();
      if (v) this.commitTag(v);
    }, 150);
  }

  /** @internal */
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    // Check for separator chars (except Enter, handled in keydown)
    const sep = this.separators().filter(s => s !== 'Enter').find(s => value.endsWith(s));
    if (sep) {
      const tag = value.slice(0, -sep.length).trim();
      if (tag) this.commitTag(tag);
      this.inputValue.set('');
      (event.target as HTMLInputElement).value = '';
    } else {
      this.inputValue.set(value);
    }
    this.showSuggestions.set(true);
    this.activeIndex.set(-1);
  }

  /** @internal */
  onKeydown(event: KeyboardEvent): void {
    const suggestions = this.filteredSuggestions();

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (this.activeIndex() >= 0 && suggestions[this.activeIndex()]) {
          this.commitTag(suggestions[this.activeIndex()]);
        } else {
          const v = this.inputValue().trim();
          if (v) this.commitTag(v);
        }
        break;

      case 'Backspace':
        if (!this.inputValue() && this.tags().length > 0) {
          const last = this.tags()[this.tags().length - 1];
          this.removeTagByValue(last.value);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => Math.min(i + 1, suggestions.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, -1));
        break;

      case 'Escape':
        this.showSuggestions.set(false);
        break;
    }
  }

  /** @internal */
  removeTag(event: MouseEvent, tag: TagInputTag): void {
    event.stopPropagation();
    this.removeTagByValue(tag.value);
  }

  /** @internal */
  addSuggestion(event: MouseEvent, suggestion: string): void {
    event.preventDefault();
    this.commitTag(suggestion);
  }

  private commitTag(value: string): void {
    if (!value || this.maxReached()) return;
    const existing = this.tags().find(t => t.value.toLowerCase() === value.toLowerCase());
    if (existing) return;

    const newTag: TagInputTag = { value };
    this.tags.update(tags => [...tags, newTag]);
    this.inputValue.set('');
    const inputEl = this.inputEl()?.nativeElement;
    if (inputEl) inputEl.value = '';
    this.showSuggestions.set(false);
    this.activeIndex.set(-1);
    this.tagsChange.emit({ tags: this.tags(), added: newTag });
  }

  private removeTagByValue(value: string): void {
    const removed = this.tags().find(t => t.value === value);
    this.tags.update(tags => tags.filter(t => t.value !== value));
    if (removed) {
      this.tagsChange.emit({ tags: this.tags(), removed });
    }
  }
}
