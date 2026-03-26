/**
 * @fileoverview AvailabilityResourceService — Sprint 028 / Sprint 031
 *
 * Real-time property availability fetching using Angular's resource() API
 * with signal-driven refresh. Wraps `createHttpResource()` from Sprint 027
 * and adds auto-polling, optimistic block-out of freshly-booked ranges,
 * and a compact public surface for template consumption.
 *
 * Sprint 031 additions (RESOURCE_SNAPSHOT flag):
 * - Exposes `snapshot` — a `ResourceSnapshot<RawAvailabilityResponse>` signal
 *   that preserves the last known availability data across reloads (no flicker).
 * - Adds `combinedWith()` — compose two AvailabilityResourceService instances
 *   via `resourceFromSnapshots()` for multi-property overlays.
 *
 * Feature flags:
 * - AVAILABILITY_REALTIME — core service
 * - RESOURCE_SNAPSHOT — snapshot() API + combinedWith()
 *
 * @example
 * ```ts
 * // In a component
 * readonly availSvc = inject(AvailabilityResourceService);
 *
 * // Start watching a property
 * ngOnInit() {
 *   this.availSvc.watch('prop-123', 30_000); // poll every 30 s
 * }
 *
 * // Template — snapshot pattern (no flicker on refresh)
 * @if (availSvc.snapshot().isLoading) { <iu-progress /> }
 * <iu-property-availability
 *   [propertyId]="propertyId"
 *   [bookedDates]="availSvc.bookedRanges()"
 * />
 * ```
 */

import {
  Injectable,
  signal,
  computed,
  effect,
  Signal,
  WritableSignal,
} from '@angular/core';
import {
  createHttpResource,
  ResourceState,
  ResourceSnapshot,
  resourceFromSnapshots,
} from './resource.service';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A date range returned by the availability API */
export interface AvailabilityRange {
  start: Date;
  end: Date;
}

/** Raw shape returned by the mock/real API endpoint */
interface RawAvailabilityResponse {
  propertyId: string;
  bookedRanges: Array<{ start: string; end: string }>;
  lastUpdated: string;
}

/** Public state surface for templates */
export interface AvailabilityState {
  /** Booked date ranges, ready for <iu-property-availability> */
  readonly bookedRanges: Signal<AvailabilityRange[]>;
  /** True while a fetch is in progress */
  readonly loading: Signal<boolean>;
  /** ISO timestamp of last successful refresh, or null */
  readonly lastUpdated: Signal<string | null>;
  /** True if last fetch errored */
  readonly hasError: Signal<boolean>;
  /**
   * Snapshot signal — preserves last known data across reloads.
   * Sprint 031 — RESOURCE_SNAPSHOT.
   */
  readonly snapshot: Signal<ResourceSnapshot<AvailabilityRange[]>>;
  /** Manually trigger a refresh */
  refresh(): void;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * AvailabilityResourceService — provides signal-driven real-time availability
 * data for a single property at a time. Designed to be used by parent
 * components that already know which property to watch.
 *
 * Feature flags: AVAILABILITY_REALTIME, RESOURCE_SNAPSHOT
 */
@Injectable({ providedIn: 'root' })
export class AvailabilityResourceService {

  // ── Internal writeable signals ────────────────────────────────────────────

  /** Active property ID — changing this triggers a fresh fetch */
  private readonly _propertyId: WritableSignal<string> = signal('');

  /** API base URL (overridable via watch()) */
  private readonly _apiBase: WritableSignal<string> = signal('/api');

  /** Timestamp of the last successful response */
  private readonly _lastUpdated: WritableSignal<string | null> = signal(null);

  /** Native setInterval handle for polling */
  private _pollHandle: ReturnType<typeof setInterval> | null = null;

  // ── Resource ─────────────────────────────────────────────────────────────

  /**
   * The underlying HTTP resource. Re-fires whenever _propertyId changes.
   * In tests / Storybook, `/api/availability/:id` can be intercepted or mocked.
   */
  private readonly _resource: ResourceState<RawAvailabilityResponse> =
    createHttpResource<RawAvailabilityResponse>(
      () => {
        const id = this._propertyId();
        const base = this._apiBase();
        return id ? `${base}/availability/${id}` : '';
      },
      {
        transform: (raw) => {
          const r = raw as RawAvailabilityResponse;
          return r;
        },
        retries: 1,
      }
    );

  // ── Derived public signals ────────────────────────────────────────────────

  /**
   * Booked date ranges as JS Date objects (transformed from ISO strings).
   * Empty array while loading or on error.
   */
  readonly bookedRanges: Signal<AvailabilityRange[]> = computed(() => {
    const data = this._resource.data();
    if (!data?.bookedRanges) return [];

    return data.bookedRanges.map((r) => ({
      start: new Date(r.start),
      end: new Date(r.end),
    }));
  });

  /** True while fetching */
  readonly loading: Signal<boolean> = computed(() => this._resource.loading());

  /** True if last fetch failed */
  readonly hasError: Signal<boolean> = computed(() => this._resource.error() !== null);

  /** ISO timestamp of last successful response */
  readonly lastUpdated: Signal<string | null> = this._lastUpdated;

  // Track successful responses and update _lastUpdated
  private readonly _trackEffect = effect(() => {
    const data = this._resource.data();
    if (data?.lastUpdated) {
      this._lastUpdated.set(data.lastUpdated);
    }
  });

  // ── Snapshot — Sprint 031 (RESOURCE_SNAPSHOT) ────────────────────────────

  /**
   * Snapshot signal — exposes availability state with `data` preserved
   * across reloads (anti-flicker pattern). Use this in templates instead of
   * `loading()` + `bookedRanges()` separately to avoid layout shifts.
   *
   * Sprint 031 — RESOURCE_SNAPSHOT.
   *
   * @example
   * ```ts
   * // template:
   * @if (availSvc.snapshot().isLoading && !availSvc.snapshot().data?.length) {
   *   <iu-skeleton />
   * }
   * // data is still available during a background refresh:
   * <iu-property-availability [bookedDates]="availSvc.snapshot().data ?? []" />
   * ```
   */
  readonly snapshot: Signal<ResourceSnapshot<AvailabilityRange[]>> = computed(() => {
    const rawSnap = this._resource.snapshot();
    // Derive AvailabilityRange[] from the raw snapshot data
    const ranges: AvailabilityRange[] = rawSnap.data?.bookedRanges?.map(r => ({
      start: new Date(r.start),
      end: new Date(r.end),
    })) ?? [];

    return {
      data: ranges.length > 0 ? ranges : rawSnap.data ? [] : undefined,
      status: rawSnap.status,
      error: rawSnap.error,
      isLoading: rawSnap.isLoading,
      timestamp: rawSnap.timestamp,
    };
  });

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start watching a property's availability.
   *
   * @param propertyId - The property ID to watch
   * @param pollIntervalMs - Auto-refresh interval in ms (default: 0 = no polling)
   * @param apiBase - Override the API base URL (default: '/api')
   */
  watch(
    propertyId: string,
    pollIntervalMs = 0,
    apiBase = '/api'
  ): void {
    this._stopPolling();
    this._apiBase.set(apiBase);
    this._propertyId.set(propertyId);

    if (pollIntervalMs > 0) {
      this._pollHandle = setInterval(() => {
        this.refresh();
      }, pollIntervalMs);
    }
  }

  /**
   * Stop watching (clears the poll interval).
   * Call in `ngOnDestroy`.
   */
  stop(): void {
    this._stopPolling();
    this._propertyId.set('');
  }

  /**
   * Manually trigger a reload of availability data.
   */
  refresh(): void {
    this._resource.reload();
  }

  /**
   * Combine this service's snapshot with another AvailabilityResourceService.
   * Uses `resourceFromSnapshots()` to merge two property availability streams.
   * Useful for comparison views or multi-property overlays.
   *
   * Sprint 031 — RESOURCE_SNAPSHOT.
   *
   * @param other - Another AvailabilityResourceService instance to merge with
   * @returns A derived signal combining both snapshots (loading if either is loading)
   *
   * @example
   * ```ts
   * // Compare two properties side by side
   * readonly combinedSnap = this.availA.combinedWith(this.availB);
   * // template:
   * @if (combinedSnap().isLoading) { <iu-progress /> }
   * ```
   */
  combinedWith(
    other: AvailabilityResourceService
  ): Signal<ResourceSnapshot<AvailabilityRange[]>> {
    return resourceFromSnapshots<AvailabilityRange[]>(
      [this.snapshot, other.snapshot],
      (snaps) => {
        // Merge: combine all ranges from all sources
        const all: AvailabilityRange[] = [];
        for (const snap of snaps) {
          if (snap.data) all.push(...snap.data);
        }
        return all.length > 0 ? all : undefined;
      }
    );
  }

  /**
   * Returns a unified AvailabilityState for passing to child components.
   * Now includes the `snapshot` field (Sprint 031).
   */
  asState(): AvailabilityState {
    return {
      bookedRanges: this.bookedRanges,
      loading: this.loading,
      lastUpdated: this.lastUpdated,
      hasError: this.hasError,
      snapshot: this.snapshot,
      refresh: () => this.refresh(),
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _stopPolling(): void {
    if (this._pollHandle !== null) {
      clearInterval(this._pollHandle);
      this._pollHandle = null;
    }
  }
}
