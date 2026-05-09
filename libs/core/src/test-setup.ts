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

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
