import { Injectable, signal, computed } from '@angular/core';

/** Type of property insurance — common PT product categories. */
export type InsuranceType =
  | 'multirriscos'  // building + contents combined (most common for habitação)
  | 'rc'            // standalone responsabilidade civil
  | 'conteudo';     // contents-only (when building is owner-side)

/** A single insurance policy attached to a property. */
export interface InsurancePolicy {
  readonly id: string;
  readonly propertyId: string;
  readonly insurer: string;
  readonly policyNumber: string;
  readonly type: InsuranceType;
  /** ISO date the policy started (`YYYY-MM-DD`). */
  readonly startDate: string;
  /** ISO date the policy ends — used to compute expiry warnings. */
  readonly endDate: string;
  /** Annual premium (EUR). */
  readonly premium: number;
}

let __polSeq = 0;
const nextPolicyId = () => `pol-${++__polSeq}-${Date.now().toString(36)}`;

const DAY_MS = 86_400_000;

/** Days between two ISO date strings (`YYYY-MM-DD`); positive when `b` > `a`. */
const daysBetween = (a: string, b: string): number => {
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / DAY_MS);
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/**
 * State + computeds for landlord property-insurance tracking.
 *
 * Tracks active policies, flags those expiring within 30 days, and groups
 * by property so the landlord can see at-a-glance coverage gaps. Service-only
 * for now — UI surface (`InsuranceTrackerComponent`) lands in a future sprint.
 *
 * Pure signals — no RxJS.
 */
@Injectable({ providedIn: 'root' })
export class InsuranceTrackerService {
  private readonly _policies = signal<InsurancePolicy[]>([]);

  /** Read-only list of all policies. */
  readonly policies = this._policies.asReadonly();

  /** Today as ISO `YYYY-MM-DD` — exposed as a signal for testability hooks. */
  readonly today = signal<string>(todayIso());

  /** Policies whose `endDate` is today or later. */
  readonly activePolicies = computed(() => {
    const t = this.today();
    return this._policies().filter(p => daysBetween(t, p.endDate) >= 0);
  });

  /** Active policies expiring within the next 30 days. */
  readonly expiringSoon = computed(() => {
    const t = this.today();
    return this._policies().filter(p => {
      const remaining = daysBetween(t, p.endDate);
      return remaining >= 0 && remaining <= 30;
    });
  });

  /** Policies that have already lapsed. */
  readonly expired = computed(() => {
    const t = this.today();
    return this._policies().filter(p => daysBetween(t, p.endDate) < 0);
  });

  /** Policies grouped by `propertyId`. */
  readonly byProperty = computed(() => {
    const map = new Map<string, InsurancePolicy[]>();
    for (const p of this._policies()) {
      const arr = map.get(p.propertyId) ?? [];
      arr.push(p);
      map.set(p.propertyId, arr);
    }
    return map;
  });

  /** Add a policy. */
  addPolicy(input: Omit<InsurancePolicy, 'id'>): InsurancePolicy {
    const policy: InsurancePolicy = { id: nextPolicyId(), ...input };
    this._policies.update(list => [...list, policy]);
    return policy;
  }

  /** Remove a policy by id. */
  removePolicy(id: string): void {
    this._policies.update(list => list.filter(p => p.id !== id));
  }

  /** Update the `endDate` of an existing policy (e.g. annual renewal). */
  renewPolicy(id: string, newEndDate: string): void {
    this._policies.update(list =>
      list.map(p => p.id === id ? { ...p, endDate: newEndDate } : p),
    );
  }

  /** Clear all policies (useful for tests / Storybook resets). */
  reset(): void {
    this._policies.set([]);
  }
}
