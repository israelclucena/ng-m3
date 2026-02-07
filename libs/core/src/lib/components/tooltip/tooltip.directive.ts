import {
  Directive,
  ElementRef,
  input,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

export type TooltipVariant = 'plain' | 'rich';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * IU Tooltip — M3 Directive-based tooltip.
 *
 * Usage:
 *   <button [iuTooltip]="'Save draft'" tooltipPosition="bottom">Save</button>
 *   <span [iuTooltip]="'Details here'" tooltipVariant="rich">Info</span>
 */
@Directive({
  selector: '[iuTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  /** Tooltip text */
  iuTooltip = input.required<string>();

  /** Variant: plain (default) or rich */
  tooltipVariant = input<TooltipVariant>('plain');

  /** Position */
  tooltipPosition = input<TooltipPosition>('top');

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  private onMouseEnter = () => this.show();
  private onMouseLeave = () => this.hide();
  private onFocus = () => this.show();
  private onBlur = () => this.hide();

  constructor() {
    const native = this.el.nativeElement;
    native.addEventListener('mouseenter', this.onMouseEnter);
    native.addEventListener('mouseleave', this.onMouseLeave);
    native.addEventListener('focus', this.onFocus);
    native.addEventListener('blur', this.onBlur);
  }

  ngOnDestroy(): void {
    this.removeTooltip();
    const native = this.el.nativeElement;
    native.removeEventListener('mouseenter', this.onMouseEnter);
    native.removeEventListener('mouseleave', this.onMouseLeave);
    native.removeEventListener('focus', this.onFocus);
    native.removeEventListener('blur', this.onBlur);
  }

  private show(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTimeout = setTimeout(() => {
      this.createTooltip();
    }, 500);
  }

  private hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hideTimeout = setTimeout(() => {
      this.removeTooltip();
    }, 100);
  }

  private createTooltip(): void {
    if (this.tooltipEl) return;

    const text = this.iuTooltip();
    if (!text) return;

    const variant = this.tooltipVariant();
    const position = this.tooltipPosition();

    this.tooltipEl = this.renderer.createElement('div');
    this.tooltipEl!.className = `iu-tooltip iu-tooltip--${variant} iu-tooltip--${position}`;
    this.tooltipEl!.textContent = text;

    // Inject styles if not present
    this.ensureStyles();

    document.body.appendChild(this.tooltipEl!);

    // Position relative to host
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tipEl = this.tooltipEl!;

    // Need to measure after append
    requestAnimationFrame(() => {
      if (!this.tooltipEl) return;
      const tipRect = tipEl.getBoundingClientRect();
      const gap = 8;
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = hostRect.top - tipRect.height - gap;
          left = hostRect.left + (hostRect.width - tipRect.width) / 2;
          break;
        case 'bottom':
          top = hostRect.bottom + gap;
          left = hostRect.left + (hostRect.width - tipRect.width) / 2;
          break;
        case 'left':
          top = hostRect.top + (hostRect.height - tipRect.height) / 2;
          left = hostRect.left - tipRect.width - gap;
          break;
        case 'right':
          top = hostRect.top + (hostRect.height - tipRect.height) / 2;
          left = hostRect.right + gap;
          break;
      }

      tipEl.style.top = `${top + window.scrollY}px`;
      tipEl.style.left = `${left + window.scrollX}px`;
      tipEl.classList.add('iu-tooltip--visible');
    });
  }

  private removeTooltip(): void {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  private stylesInjected = false;
  private ensureStyles(): void {
    if (this.stylesInjected || document.getElementById('iu-tooltip-styles')) return;
    this.stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'iu-tooltip-styles';
    style.textContent = `
      .iu-tooltip {
        position: absolute;
        z-index: 1000;
        padding: 6px 8px;
        border-radius: 4px;
        font-family: 'Roboto', sans-serif;
        font-size: 12px;
        line-height: 16px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        max-width: 200px;
        word-wrap: break-word;
      }
      .iu-tooltip--visible {
        opacity: 1;
      }
      .iu-tooltip--plain {
        background: var(--md-sys-color-inverse-surface, #313033);
        color: var(--md-sys-color-inverse-on-surface, #f4eff4);
      }
      .iu-tooltip--rich {
        background: var(--md-sys-color-surface-container, #f1ecf1);
        color: var(--md-sys-color-on-surface, #1d1b20);
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 320px;
        font-size: 14px;
        line-height: 20px;
        box-shadow: 0 2px 6px 2px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.3);
      }
    `;
    document.head.appendChild(style);
  }
}
