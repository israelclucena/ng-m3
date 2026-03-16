/**
 * @fileoverview Signal debounce utilities for Angular Signals.
 *
 * Provides `debouncedSignal()` — a composable helper that creates a signal
 * which only updates after a specified delay since the last source change.
 *
 * Compatible with Angular 17+ Signals (no RxJS dependency).
 *
 * @example
 * ```ts
 * const query = signal('');
 * const debouncedQuery = debouncedSignal(query, 300);
 *
 * // debouncedQuery() only updates 300ms after the last change to query
 * const results = computed(() => search(debouncedQuery()));
 * ```
 */

import {
  DestroyRef,
  Signal,
  WritableSignal,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** A debounced read-only signal. Mirrors the source signal's type. */
export type DebouncedSignal<T> = Signal<T>;

// ─── Implementation ────────────────────────────────────────────────────────────

/**
 * Creates a debounced read-only signal that mirrors `source` but only emits
 * after `delayMs` milliseconds of inactivity.
 *
 * Must be called in an injection context (component, service, or `runInInjectionContext`).
 *
 * @param source The signal to debounce
 * @param delayMs Debounce delay in milliseconds (default: 300)
 * @returns A read-only Signal that updates `delayMs` after the last change
 *
 * @example
 * ```ts
 * // In a component or service
 * readonly rawQuery = signal('');
 * readonly query = debouncedSignal(this.rawQuery, 300);
 * readonly results = computed(() => this.search(this.query()));
 * ```
 */
export function debouncedSignal<T>(
  source: Signal<T>,
  delayMs = 300
): DebouncedSignal<T> {
  // Initialise with the current source value (no delay on first read)
  const debounced: WritableSignal<T> = signal(untracked(source));

  let timer: ReturnType<typeof setTimeout> | null = null;

  // Automatically clean up the timer when the owning context is destroyed
  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  });

  // Watch the source signal and schedule a delayed write to `debounced`
  effect(() => {
    // Read the source — this registers the reactive dependency
    const value = source();

    // Clear any pending timer
    if (timer !== null) {
      clearTimeout(timer);
    }

    // Schedule the update
    timer = setTimeout(() => {
      debounced.set(value);
      timer = null;
    }, delayMs);
  });

  return debounced.asReadonly();
}

/**
 * Creates a debounced signal with an immediate (leading-edge) first emission,
 * then debounces subsequent changes.
 *
 * Useful for search inputs: the first character triggers an immediate search,
 * subsequent keystrokes are debounced.
 *
 * @param source The signal to debounce
 * @param delayMs Debounce delay in milliseconds (default: 300)
 * @returns A read-only Signal
 */
export function debouncedSignalWithImmediate<T>(
  source: Signal<T>,
  delayMs = 300
): DebouncedSignal<T> {
  const debounced: WritableSignal<T> = signal(untracked(source));
  let timer: ReturnType<typeof setTimeout> | null = null;
  let isFirst = true;

  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  });

  effect(() => {
    const value = source();

    if (isFirst) {
      // Leading edge: emit immediately
      debounced.set(value);
      isFirst = false;
      return;
    }

    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.set(value);
      timer = null;
    }, delayMs);
  });

  return debounced.asReadonly();
}
