import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

// JSDOM ships ElementInternals but lacks form-associated methods
// that @material/web text fields call on construction. Shim them as no-ops
// so md-* custom elements can boot inside Jest specs.
const ei = (globalThis as { ElementInternals?: { prototype: Record<string, unknown> } })
  .ElementInternals?.prototype;
if (ei) {
  for (const fn of [
    'setFormValue',
    'setValidity',
    'checkValidity',
    'reportValidity',
  ]) {
    if (typeof ei[fn] !== 'function') {
      ei[fn] = function () {
        /* no-op shim for JSDOM */
      };
    }
  }
}

// JSDOM lacks IntersectionObserver / ResizeObserver, which @material/web
// dialog/menu/textfield instantiate during construction. Shim them as no-ops.
const g = globalThis as Record<string, unknown>;
if (typeof g['IntersectionObserver'] === 'undefined') {
  g['IntersectionObserver'] = class {
    observe(): void { /* no-op */ }
    unobserve(): void { /* no-op */ }
    disconnect(): void { /* no-op */ }
    takeRecords(): unknown[] { return []; }
    root = null;
    rootMargin = '';
    thresholds: number[] = [];
  };
}
if (typeof g['ResizeObserver'] === 'undefined') {
  g['ResizeObserver'] = class {
    observe(): void { /* no-op */ }
    unobserve(): void { /* no-op */ }
    disconnect(): void { /* no-op */ }
  };
}

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
