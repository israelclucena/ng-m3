import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardShortcutService } from './keyboard-shortcut.service';

/**
 * ShortcutHelpOverlay — Modal overlay showing all registered keyboard shortcuts.
 *
 * Toggled by pressing `?`. Add this component once in your app root.
 *
 * @example
 * ```html
 * <iu-shortcut-help-overlay />
 * ```
 */
@Component({
  selector: 'iu-shortcut-help-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (service.helpVisible()) {
      <div class="iu-shortcut-overlay" (click)="service.helpVisible.set(false)">
        <div class="iu-shortcut-overlay__panel" (click)="$event.stopPropagation()">
          <div class="iu-shortcut-overlay__header">
            <h2 class="iu-shortcut-overlay__title">Keyboard Shortcuts</h2>
            <button class="iu-shortcut-overlay__close" (click)="service.helpVisible.set(false)">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="iu-shortcut-overlay__body">
            @for (entry of categoryEntries(); track entry[0]) {
              <div class="iu-shortcut-overlay__category">
                <h3 class="iu-shortcut-overlay__category-title">{{ entry[0] }}</h3>
                @for (shortcut of entry[1]; track shortcut.id) {
                  <div class="iu-shortcut-overlay__item">
                    <span class="iu-shortcut-overlay__desc">{{ shortcut.description }}</span>
                    <kbd class="iu-shortcut-overlay__kbd">{{ formatKeys(shortcut.keys) }}</kbd>
                  </div>
                }
              </div>
            }
            <div class="iu-shortcut-overlay__category">
              <h3 class="iu-shortcut-overlay__category-title">Help</h3>
              <div class="iu-shortcut-overlay__item">
                <span class="iu-shortcut-overlay__desc">Show this overlay</span>
                <kbd class="iu-shortcut-overlay__kbd">?</kbd>
              </div>
              <div class="iu-shortcut-overlay__item">
                <span class="iu-shortcut-overlay__desc">Close overlay</span>
                <kbd class="iu-shortcut-overlay__kbd">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './shortcut-help-overlay.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutHelpOverlayComponent {
  readonly service = inject(KeyboardShortcutService);

  categoryEntries() {
    return Array.from(this.service.shortcutsByCategory().entries());
  }

  /** Format key combo for display */
  formatKeys(keys: string): string {
    return keys
      .split('+')
      .map(k => {
        switch (k.toLowerCase()) {
          case 'ctrl': return 'Ctrl';
          case 'alt': return 'Alt';
          case 'shift': return 'Shift';
          case 'escape': return 'Esc';
          default: return k.toUpperCase();
        }
      })
      .join(' + ');
  }
}
