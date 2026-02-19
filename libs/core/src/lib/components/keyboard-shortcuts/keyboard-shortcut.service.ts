import { Injectable, signal, computed, OnDestroy, NgZone, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface ShortcutBinding {
  /** Unique id for this shortcut */
  id: string;
  /** Key combo, e.g. "ctrl+k", "shift+?", "escape" */
  keys: string;
  /** Human-readable description */
  description: string;
  /** Category for grouping in help overlay */
  category?: string;
  /** Handler function */
  handler: () => void;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * KeyboardShortcutService — Global keyboard shortcut manager.
 *
 * Register shortcuts from any component. Press `?` to show help overlay.
 *
 * @example
 * ```ts
 * const shortcuts = inject(KeyboardShortcutService);
 * shortcuts.register({
 *   id: 'search',
 *   keys: 'ctrl+k',
 *   description: 'Open search',
 *   category: 'Navigation',
 *   handler: () => openSearch(),
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);
  private readonly bindings = signal<ShortcutBinding[]>([]);
  private listener: ((e: KeyboardEvent) => void) | null = null;

  /** Whether the help overlay is visible */
  readonly helpVisible = signal(false);

  /** All registered shortcuts grouped by category */
  readonly shortcutsByCategory = computed(() => {
    const map = new Map<string, ShortcutBinding[]>();
    for (const b of this.bindings()) {
      const cat = b.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(b);
    }
    return map;
  });

  /** All registered shortcuts */
  readonly shortcuts = computed(() => this.bindings());

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      this.listener = (e: KeyboardEvent) => this.handleKeydown(e);
      this.document.addEventListener('keydown', this.listener);
    });
  }

  ngOnDestroy(): void {
    if (this.listener) {
      this.document.removeEventListener('keydown', this.listener);
    }
  }

  /** Register a keyboard shortcut */
  register(binding: ShortcutBinding): void {
    this.bindings.update(list => {
      const filtered = list.filter(b => b.id !== binding.id);
      return [...filtered, binding];
    });
  }

  /** Unregister a shortcut by id */
  unregister(id: string): void {
    this.bindings.update(list => list.filter(b => b.id !== id));
  }

  /** Toggle help overlay */
  toggleHelp(): void {
    this.helpVisible.update(v => !v);
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Ignore when typing in inputs
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if ((event.target as HTMLElement)?.isContentEditable) return;

    const combo = this.buildCombo(event);

    // Built-in: ? toggles help
    if (combo === 'shift+?' || event.key === '?') {
      event.preventDefault();
      this.ngZone.run(() => this.toggleHelp());
      return;
    }

    // Escape closes help
    if (combo === 'escape' && this.helpVisible()) {
      event.preventDefault();
      this.ngZone.run(() => this.helpVisible.set(false));
      return;
    }

    // Match registered shortcuts
    for (const binding of this.bindings()) {
      if (this.matchCombo(combo, binding.keys)) {
        if (binding.preventDefault !== false) {
          event.preventDefault();
        }
        this.ngZone.run(() => binding.handler());
        return;
      }
    }
  }

  private buildCombo(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  private matchCombo(actual: string, expected: string): boolean {
    const normalize = (s: string) =>
      s.toLowerCase().split('+').sort().join('+');
    return normalize(actual) === normalize(expected);
  }
}
