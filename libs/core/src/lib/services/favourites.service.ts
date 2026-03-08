import {
  Injectable,
  computed,
  effect,
  signal,
} from '@angular/core';

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'iu_favourites_v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadFromStorage(): Set<string> {
  try {
    const raw = typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set<string>(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveToStorage(ids: Set<string>): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    }
  } catch {
    // localStorage unavailable (SSR, private mode quota exceeded, etc.)
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * FavouritesService — Signal-based favourites with localStorage persistence.
 *
 * Stores a Set of property id strings. Persists automatically via an Angular
 * `effect()`. Listens to `StorageEvent` for cross-tab synchronisation.
 *
 * Feature flag: `FAVOURITES_SERVICE`
 *
 * @example
 * ```typescript
 * export class PropertyCardComponent {
 *   private fav = inject(FavouritesService);
 *
 *   isFavourited = computed(() => this.fav.isFavourited(this.property().id));
 *
 *   onFavToggle() {
 *     this.fav.toggle(this.property().id);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FavouritesService {

  // ─── State ──────────────────────────────────────────────────────────────

  /** Internal signal wrapping the favourites Set (use snapshot for change detection) */
  private readonly _ids = signal<Set<string>>(loadFromStorage());

  /**
   * Snapshot array of favourited property ids.
   * Use this in templates and computed signals — changes trigger re-renders.
   */
  readonly ids = computed(() => [...this._ids()]);

  /** Total number of favourited properties */
  readonly count = computed(() => this._ids().size);

  /** True when there is at least one favourite */
  readonly hasAny = computed(() => this._ids().size > 0);

  // ─── Constructor ────────────────────────────────────────────────────────

  constructor() {
    // Persist to localStorage on every change
    effect(() => {
      saveToStorage(this._ids());
    });

    // Cross-tab sync via StorageEvent
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === STORAGE_KEY && event.newValue !== null) {
          try {
            const parsed = JSON.parse(event.newValue);
            if (Array.isArray(parsed)) {
              this._ids.set(new Set<string>(parsed));
            }
          } catch {
            // ignore malformed data from other tabs
          }
        }
      });
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Returns true if the given property id is favourited.
   * @param id Property id (string or number — coerced to string)
   */
  isFavourited(id: string | number): boolean {
    return this._ids().has(String(id));
  }

  /**
   * Add a property to favourites. No-op if already present.
   * @param id Property id
   */
  add(id: string | number): void {
    const next = new Set(this._ids());
    next.add(String(id));
    this._ids.set(next);
  }

  /**
   * Remove a property from favourites. No-op if not present.
   * @param id Property id
   */
  remove(id: string | number): void {
    const next = new Set(this._ids());
    next.delete(String(id));
    this._ids.set(next);
  }

  /**
   * Toggle a property's favourite state.
   * @param id Property id
   * @returns The new favourited state (true = added, false = removed)
   */
  toggle(id: string | number): boolean {
    if (this.isFavourited(id)) {
      this.remove(id);
      return false;
    } else {
      this.add(id);
      return true;
    }
  }

  /**
   * Clear all favourites.
   */
  clearAll(): void {
    this._ids.set(new Set());
  }

  /**
   * Filter an array of items to only those that are favourited.
   * @param items Array with objects that have an `id` field
   */
  filterFavourited<T extends { id: string | number }>(items: T[]): T[] {
    return items.filter(item => this.isFavourited(item.id));
  }
}
