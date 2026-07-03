import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

// The demo App renders the full @material/web (lit) catalog. Those form-associated
// custom elements drive browser APIs jsdom does not implement (ElementInternals
// form/ARIA reflection, Element.scrollTo, <dialog>.showModal, ...), which crash on
// upgrade. The demo unit test only asserts the page renders its own markup; the
// real web-component behaviour is covered by the @israel-ui/core specs and
// Storybook. So neutralise the M3 upgrades here: register each custom element as an
// inert HTMLElement subclass so the surrounding Angular template still renders.
const originalDefine = customElements.define.bind(customElements);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
customElements.define = function define(name: string, _ctor: any, options?: any) {
  if (customElements.get(name)) {
    return;
  }
  originalDefine(name, class extends HTMLElement {}, options);
};

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
