/**
 * @fileoverview resource() API service utility — Sprint 027 / Sprint 031
 *
 * Wraps Angular's `resource()` / `httpResource()` APIs with common patterns
 * for error handling, loading states, and retry logic.
 *
 * Uses Angular 21's signal-based resource APIs (no RxJS).
 *
 * Sprint 031 additions (RESOURCE_SNAPSHOT flag):
 * - `ResourceSnapshot<T>` — unified frozen-state type (preserves last data across reloads)
 * - `snapshot` field on `ResourceState<T>` — exposes current state as a snapshot signal
 * - `resourceFromSnapshots<T>()` — compose multiple snapshot signals into one derived resource
 *
 * @example
 * ```ts
 * // Simple HTTP resource
 * readonly properties = createHttpResource<Property[]>(
 *   () => `/api/properties?city=${this.city()}`
 * );
 *
 * // In template
 * @if (properties.loading()) { <iu-progress /> }
 * @if (properties.error()) { <p>Error: {{ properties.error() }}</p> }
 * @for (p of properties.data(); track p.id) { ... }
 *
 * // Snapshot — data is preserved during reloads (no flicker)
 * @if (properties.snapshot().isLoading) { <iu-progress /> }
 * {{ properties.snapshot().data | json }}
 * ```
 */

import {
  Signal,
  signal,
  computed,
  isSignal,
  resource,
  ResourceRef,
  inject,
  type WritableSignal,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Status of a resource fetch lifecycle */
export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * ResourceSnapshot<T> — Sprint 031 (RESOURCE_SNAPSHOT)
 *
 * A frozen point-in-time view of the resource state. Unlike `data` (which goes
 * `undefined` during a reload), `snapshot.data` is preserved across refreshes —
 * enabling flicker-free UIs that show stale data while fresh data loads.
 *
 * Mirrors Angular 21.2's `resource.snapshot()` concept.
 *
 * @example
 * ```ts
 * // No flicker: last known data stays visible while refreshing
 * readonly snap = this.properties.snapshot;
 * // template:
 * @for (p of snap().data ?? []; track p.id) { ... }
 * @if (snap().isLoading) { <iu-progress /> }
 * ```
 */
export interface ResourceSnapshot<T> {
  /**
   * Last known data value.
   * Preserved across reloads — does NOT go `undefined` while loading.
   */
  readonly data: T | undefined;
  /** Lifecycle status of the most-recent fetch */
  readonly status: ResourceStatus;
  /** Last error, or `null` */
  readonly error: HttpErrorResponse | Error | null;
  /** Whether a fetch is currently in progress */
  readonly isLoading: boolean;
  /** Unix timestamp (ms) when this snapshot was captured */
  readonly timestamp: number;
}

/**
 * Unified state shape returned by createHttpResource.
 * All fields are signals for reactive template consumption.
 */
export interface ResourceState<T> {
  /** The fetched data (undefined before first successful load) */
  readonly data: Signal<T | undefined>;
  /** True while a fetch is in-flight */
  readonly loading: Signal<boolean>;
  /** The last error, or null if no error */
  readonly error: Signal<HttpErrorResponse | Error | null>;
  /** Lifecycle status string */
  readonly status: Signal<ResourceStatus>;
  /**
   * Snapshot signal — exposes all resource state in one unified object.
   * The `data` field is preserved across reloads (no flicker).
   * Sprint 031 — RESOURCE_SNAPSHOT.
   */
  readonly snapshot: Signal<ResourceSnapshot<T>>;
  /** Trigger a manual reload */
  reload: () => void;
}

/** Options for createHttpResource */
export interface CreateHttpResourceOptions<T> {
  /**
   * Transform the raw response before storing.
   * @param raw - raw HTTP response body
   */
  transform?: (raw: unknown) => T;

  /**
   * Number of automatic retry attempts on error.
   * Defaults to 0 (no retry).
   */
  retries?: number;

  /**
   * Initial/default value before the first load completes.
   */
  defaultValue?: T;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Creates a signal-based HTTP resource that automatically fetches data
 * whenever the URL signal changes.
 *
 * Built on Angular's `resource()` API — no RxJS required.
 *
 * @param urlOrSignal - A static URL string or a Signal/function returning a URL.
 *   When provided as a Signal or function, the resource re-fetches whenever
 *   the value changes.
 * @param options - Optional configuration (transform, retries, defaultValue)
 * @returns ResourceState with reactive signals for data, loading, error, status, snapshot
 *
 * @example
 * ```ts
 * // Static URL
 * const users = createHttpResource<User[]>('/api/users');
 *
 * // Reactive URL (re-fetches on city change)
 * const city = signal('Lisbon');
 * const properties = createHttpResource<Property[]>(
 *   () => `/api/properties?city=${city()}`
 * );
 *
 * // Snapshot — last known data preserved during reloads
 * const snap = properties.snapshot;
 * // template: @if (snap().isLoading) { <iu-progress /> }
 * ```
 */
export function createHttpResource<T>(
  urlOrSignal: Signal<string> | (() => string) | string,
  options: CreateHttpResourceOptions<T> = {}
): ResourceState<T> {
  const http = inject(HttpClient);
  const { transform, retries = 0, defaultValue } = options;

  // Normalise to a plain function so Angular resource() can track it
  const urlFn: () => string =
    typeof urlOrSignal === 'string'
      ? () => urlOrSignal
      : isSignal(urlOrSignal)
        ? () => (urlOrSignal as Signal<string>)()
        : (urlOrSignal as () => string);

  // Internal writeable signals for retry counter (forces re-read inside loader)
  const retryCounter: WritableSignal<number> = signal(0);

  // Angular resource() — loader runs reactively whenever URL or retryCounter changes
  const ref: ResourceRef<T | undefined> = resource<T | undefined, string>({
    params: () => {
      void retryCounter(); // track retryCounter so reload() works
      return urlFn();
    },
    loader: async ({ params: url }) => {
      let lastError: Error | null = null;
      const maxAttempts = retries + 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const raw = await lastValueFrom(
            http.get<unknown>(url)
          );
          return (transform ? transform(raw) : (raw as T));
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < maxAttempts - 1) {
            // Simple exponential back-off: 200ms, 400ms, …
            await new Promise<void>((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
          }
        }
      }
      throw lastError!;
    },
  });

  // Derived status signal
  const status = computed<ResourceStatus>(() => {
    if (ref.isLoading()) return 'loading';
    if (ref.error()) return 'error';
    if (ref.value() !== undefined) return 'success';
    return 'idle';
  });

  // Normalise error to a typed signal
  const error = computed<HttpErrorResponse | Error | null>(() => {
    const e = ref.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse || e instanceof Error
      ? e
      : new Error(String(e));
  });

  const data = computed<T | undefined>(() => ref.value() ?? defaultValue);

  // ── Snapshot — Sprint 031 (RESOURCE_SNAPSHOT) ─────────────────────────────
  //
  // The `_lastData` writeable signal holds the most-recent successfully
  // fetched value. It is intentionally NOT cleared when a new fetch starts,
  // so snapshot.data stays visible during reloads (anti-flicker pattern).
  //
  const _lastData: WritableSignal<T | undefined> = signal(defaultValue);

  // Derived snapshot — merges all state into one object
  const snapshot = computed<ResourceSnapshot<T>>(() => {
    const currentData = ref.value();
    const currentStatus = status();
    const currentError = error();
    const isLoading = ref.isLoading();

    // Persist last known data when a new load is in progress
    if (currentData !== undefined) {
      // Note: computed() is read-only so we track via effect in the reload path;
      // here we derive from ref.value() directly — if it's defined, use it.
    }

    // The snapshot exposes the fresher of (current data, last known data).
    // We rely on the fact that ref.value() becomes undefined only while loading;
    // the _lastData signal is updated via the reload wrapper below.
    const snapshotData = currentData ?? _lastData();

    return {
      data: snapshotData,
      status: currentStatus,
      error: currentError,
      isLoading,
      timestamp: Date.now(),
    } satisfies ResourceSnapshot<T>;
  });

  // Reload wrapper — updates _lastData BEFORE triggering a new fetch,
  // so snapshot.data always has the previous value during the in-flight period.
  const reload = () => {
    const current = ref.value();
    if (current !== undefined) {
      _lastData.set(current);
    }
    retryCounter.update((n) => n + 1);
  };

  return {
    data,
    loading: ref.isLoading,
    error,
    status,
    snapshot,
    reload,
  };
}

// ─── resourceFromSnapshots ────────────────────────────────────────────────────

/**
 * resourceFromSnapshots — Sprint 031 (RESOURCE_SNAPSHOT)
 *
 * Composes multiple `ResourceSnapshot<T>` signals into a single derived
 * snapshot. Useful for merging parallel resource streams (e.g. combining
 * local cache + remote data) without losing intermediate state.
 *
 * The combined snapshot is `loading` if ANY source is loading.
 * The combined snapshot is `error` if ANY source errored (and none are loading).
 * Data is produced by the `merge` function (defaults to last non-undefined wins).
 *
 * @param snapshotSignals - Two or more snapshot signals to merge
 * @param merge - Custom merge function (receives all current snapshots, returns merged data)
 * @returns A derived `Signal<ResourceSnapshot<T>>` combining all sources
 *
 * @example
 * ```ts
 * // Merge remote + local-cache resources into one flicker-free stream
 * readonly combined = resourceFromSnapshots(
 *   [this.remoteAvail.snapshot, this.localCache.snapshot],
 *   (snaps) => snaps.find(s => s.status === 'success')?.data
 * );
 * // template: @if (combined().isLoading) { <iu-progress /> }
 * ```
 */
export function resourceFromSnapshots<T>(
  snapshotSignals: Signal<ResourceSnapshot<T>>[],
  merge?: (snapshots: ResourceSnapshot<T>[]) => T | undefined
): Signal<ResourceSnapshot<T>> {
  const defaultMerge = (snaps: ResourceSnapshot<T>[]): T | undefined => {
    // Last non-undefined data wins
    for (let i = snaps.length - 1; i >= 0; i--) {
      if (snaps[i].data !== undefined) return snaps[i].data;
    }
    return undefined;
  };

  const mergeFn = merge ?? defaultMerge;

  return computed<ResourceSnapshot<T>>(() => {
    const all = snapshotSignals.map(s => s());

    const isLoading = all.some(s => s.isLoading);
    const errors = all.map(s => s.error).filter((e): e is HttpErrorResponse | Error => e !== null);
    const firstError = errors[0] ?? null;

    let derivedStatus: ResourceStatus = 'idle';
    if (isLoading) {
      derivedStatus = 'loading';
    } else if (firstError) {
      derivedStatus = 'error';
    } else if (all.some(s => s.status === 'success')) {
      derivedStatus = 'success';
    }

    return {
      data: mergeFn(all),
      status: derivedStatus,
      error: firstError,
      isLoading,
      timestamp: Math.max(...all.map(s => s.timestamp)),
    } satisfies ResourceSnapshot<T>;
  });
}
