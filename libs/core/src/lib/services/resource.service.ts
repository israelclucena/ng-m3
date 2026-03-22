/**
 * @fileoverview resource() API service utility — Sprint 027
 *
 * Wraps Angular's `resource()` / `httpResource()` APIs with common patterns
 * for error handling, loading states, and retry logic.
 *
 * Uses Angular 21's signal-based resource APIs (no RxJS).
 *
 * Feature flag: RESOURCE_API
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
  InjectionToken,
  type WritableSignal,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Status of a resource fetch lifecycle */
export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

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
 * @returns ResourceState with reactive signals for data, loading, error, status
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

  return {
    data,
    loading: ref.isLoading,
    error,
    status,
    reload: () => retryCounter.update((n) => n + 1),
  };
}
