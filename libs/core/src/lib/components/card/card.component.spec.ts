import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

/** Host for the cases that need real projected content / two-way binding. */
@Component({
  standalone: true,
  imports: [CardComponent],
  template: `
    <iu-card
      [loading]="loading()"
      [empty]="empty()"
      [selectable]="selectable()"
      [(selected)]="selected"
      [kind]="kind()"
    >
      <p class="body-content">Rendimento bruto 6,4%</p>
      <div slot="empty"><span class="empty-copy">Sem imóveis ainda</span></div>
    </iu-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CardHostComponent {
  loading = signal(false);
  empty = signal(false);
  selectable = signal(false);
  selected = signal(false);
  kind = signal<'plain' | 'action' | 'profile' | 'stat'>('plain');
}

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  let component: CardComponent;

  const card = () => fixture.nativeElement.querySelector('.iu-card') as HTMLElement;
  const press = (el: HTMLElement, key: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render title', () => {
    fixture.componentRef.setInput('title', 'T2 Alfama');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.iu-card__title');
    expect(el?.textContent?.trim()).toBe('T2 Alfama');
  });

  it('should apply elevated variant by default', () => {
    expect(fixture.nativeElement.querySelector('.iu-card--elevated')).toBeTruthy();
  });

  it('should emit cardClick when clickable', () => {
    fixture.componentRef.setInput('clickable', true);
    fixture.detectChanges();
    let clicked = false;
    component.cardClick.subscribe(() => (clicked = true));
    card().click();
    expect(clicked).toBe(true);
  });

  // ------------------------------------------------------------------
  // kind
  // ------------------------------------------------------------------
  describe('kind', () => {
    it('should default to the plain kind', () => {
      expect(card().classList).toContain('iu-card--kind-plain');
    });

    it('should apply the host class for each kind', () => {
      for (const kind of ['action', 'profile', 'stat'] as const) {
        fixture.componentRef.setInput('kind', kind);
        fixture.detectChanges();
        expect(card().classList).toContain(`iu-card--kind-${kind}`);
        expect(card().classList).not.toContain('iu-card--kind-plain');
      }
    });
  });

  // ------------------------------------------------------------------
  // loading
  // ------------------------------------------------------------------
  describe('loading', () => {
    it('should render a skeleton and mark the host aria-busy', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="card-skeleton"]')).toBeTruthy();
      expect(card().getAttribute('aria-busy')).toBe('true');
      expect(card().classList).toContain('iu-card--loading');
    });

    it('should not be aria-busy nor render a skeleton when idle', () => {
      expect(card().getAttribute('aria-busy')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="card-skeleton"]')).toBeNull();
    });

    it('should hide title and body content while loading', () => {
      fixture.componentRef.setInput('title', 'T2 Alfama');
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.iu-card__title')).toBeNull();
      expect(fixture.nativeElement.querySelector('.iu-card__body')).toBeNull();
    });

    it('should not emit cardClick while loading', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      let clicked = false;
      component.cardClick.subscribe(() => (clicked = true));
      card().click();
      expect(clicked).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // empty
  // ------------------------------------------------------------------
  describe('empty', () => {
    it('should swap the body for the empty state', () => {
      fixture.componentRef.setInput('empty', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="card-empty"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.iu-card__body')).toBeNull();
      expect(card().classList).toContain('iu-card--empty');
    });

    it('should let loading win over empty', () => {
      fixture.componentRef.setInput('empty', true);
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="card-skeleton"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="card-empty"]')).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // error
  // ------------------------------------------------------------------
  describe('error', () => {
    it('should render the error state with a retry button and role=alert', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector('[data-testid="card-error"]');
      expect(region).toBeTruthy();
      expect(region.getAttribute('role')).toBe('alert');
      expect(fixture.nativeElement.querySelector('[data-testid="card-retry"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.iu-card__body')).toBeNull();
      expect(card().classList).toContain('iu-card--error');
    });

    it('should emit retry when the retry button is clicked', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      let retried = 0;
      component.retry.subscribe(() => retried++);
      fixture.nativeElement.querySelector('[data-testid="card-retry"]').click();
      expect(retried).toBe(1);
    });

    it('should let loading win over error', () => {
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="card-skeleton"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="card-error"]')).toBeNull();
    });

    it('should let error win over empty', () => {
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('empty', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="card-error"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="card-empty"]')).toBeNull();
    });

    it('should not toggle selection nor emit cardClick while in error', () => {
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('selectable', true);
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();
      let clicked = false;
      component.cardClick.subscribe(() => (clicked = true));
      card().click();
      expect(clicked).toBe(false);
      expect(component.selected()).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // density
  // ------------------------------------------------------------------
  describe('density', () => {
    it('should default to the default density class', () => {
      expect(card().classList).toContain('iu-card--density-default');
    });

    it('should apply the host class for comfortable and compact', () => {
      for (const density of ['comfortable', 'compact'] as const) {
        fixture.componentRef.setInput('density', density);
        fixture.detectChanges();
        expect(card().classList).toContain(`iu-card--density-${density}`);
        expect(card().classList).not.toContain('iu-card--density-default');
      }
    });
  });

  // ------------------------------------------------------------------
  // media (first-class <img> + broken-image fallback)
  // ------------------------------------------------------------------
  describe('media', () => {
    const img = () =>
      fixture.nativeElement.querySelector('.iu-card__media-img') as HTMLImageElement | null;

    it('should render an <img> with the aspect-ratio box when mediaSrc is set', () => {
      fixture.componentRef.setInput('mediaSrc', '/x.jpg');
      fixture.componentRef.setInput('mediaAlt', 'Fachada do T2');
      fixture.componentRef.setInput('mediaAspectRatio', '4 / 3');
      fixture.detectChanges();
      expect(img()).toBeTruthy();
      expect(img()!.getAttribute('alt')).toBe('Fachada do T2');
      const box = fixture.nativeElement.querySelector('.iu-card__media') as HTMLElement;
      expect(box.style.aspectRatio.replace(/\s/g, '')).toBe('4/3');
    });

    it('should mark a media image with empty alt as decorative', () => {
      fixture.componentRef.setInput('mediaSrc', '/x.jpg');
      fixture.detectChanges();
      expect(img()!.getAttribute('aria-hidden')).toBe('true');
    });

    it('should swap in the broken-image fallback when the source fails', () => {
      fixture.componentRef.setInput('mediaSrc', '/broken.jpg');
      fixture.detectChanges();
      img()!.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(img()).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="card-media-fallback"]')).toBeTruthy();
    });

    it('should reset the broken state when mediaSrc changes', () => {
      fixture.componentRef.setInput('mediaSrc', '/broken.jpg');
      fixture.detectChanges();
      img()!.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="card-media-fallback"]')).toBeTruthy();
      fixture.componentRef.setInput('mediaSrc', '/other.jpg');
      fixture.detectChanges();
      expect(img()).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="card-media-fallback"]')).toBeNull();
    });

    it('should not render any media box without a mediaSrc', () => {
      expect(fixture.nativeElement.querySelector('.iu-card__media')).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // selectable / selected
  // ------------------------------------------------------------------
  describe('selectable', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
    });

    it('should expose a toggle-button role with aria-pressed=false', () => {
      expect(card().getAttribute('role')).toBe('button');
      expect(card().getAttribute('aria-pressed')).toBe('false');
      expect(card().getAttribute('tabindex')).toBe('0');
    });

    it('should toggle selected and emit selectedChange on Enter', () => {
      const emitted: boolean[] = [];
      component.selected.subscribe((v) => emitted.push(v));
      press(card(), 'Enter');
      fixture.detectChanges();
      expect(component.selected()).toBe(true);
      expect(card().getAttribute('aria-pressed')).toBe('true');
      expect(emitted).toEqual([true]);
    });

    it('should toggle selected back off on Space', () => {
      const emitted: boolean[] = [];
      component.selected.subscribe((v) => emitted.push(v));
      press(card(), ' ');
      fixture.detectChanges();
      press(card(), ' ');
      fixture.detectChanges();
      expect(component.selected()).toBe(false);
      expect(card().getAttribute('aria-pressed')).toBe('false');
      expect(emitted).toEqual([true, false]);
    });

    it('should toggle on click and flag the selected host class', () => {
      card().click();
      fixture.detectChanges();
      expect(component.selected()).toBe(true);
      expect(card().classList).toContain('iu-card--selected');
    });

    it('should not toggle when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const emitted: boolean[] = [];
      component.selected.subscribe((v) => emitted.push(v));
      card().click();
      press(card(), 'Enter');
      fixture.detectChanges();
      expect(component.selected()).toBe(false);
      expect(emitted).toEqual([]);
      expect(card().getAttribute('tabindex')).toBeNull();
    });

    it('should stay out of the a11y toggle contract when not selectable', () => {
      fixture.componentRef.setInput('selectable', false);
      fixture.detectChanges();
      expect(card().getAttribute('aria-pressed')).toBeNull();
      expect(card().getAttribute('role')).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // disabled (no regression)
  // ------------------------------------------------------------------
  describe('disabled', () => {
    it('should block cardClick and drop the tabindex', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      let clicked = false;
      component.cardClick.subscribe(() => (clicked = true));
      card().click();
      press(card(), 'Enter');
      expect(clicked).toBe(false);
      expect(card().getAttribute('tabindex')).toBeNull();
      expect(card().getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ------------------------------------------------------------------
  // ARIA invariants — the manual stand-in for an axe run.
  // `@axe-core/playwright` is Playwright-only and `axe-core` is not a direct
  // dependency, so no new package is installed for this (see NG-02 report).
  // ------------------------------------------------------------------
  describe('a11y invariants', () => {
    const assertInvariants = (el: HTMLElement) => {
      const role = el.getAttribute('role');
      const tabindex = el.getAttribute('tabindex');
      const pressed = el.getAttribute('aria-pressed');
      const busy = el.getAttribute('aria-busy');

      // aria-pressed is only valid on a widget role (here: button).
      if (pressed !== null) {
        expect(role).toBe('button');
        expect(['true', 'false']).toContain(pressed);
      }
      // An interactive role must be reachable by keyboard unless disabled.
      if (role === 'button' && el.getAttribute('aria-disabled') !== 'true') {
        expect(tabindex).toBe('0');
      }
      // A non-widget card must never advertise a widget-only state.
      if (role === null) {
        expect(pressed).toBeNull();
      }
      // aria-busy is boolean-valued when present.
      if (busy !== null) expect(['true', 'false']).toContain(busy);
      // Decorative skeleton must be hidden from the a11y tree.
      const skeleton = el.querySelector('.iu-card__skeleton');
      if (skeleton) expect(skeleton.getAttribute('aria-hidden')).toBe('true');
      // The error region announces itself (role=alert) and offers a retry.
      const errorRegion = el.querySelector('[data-testid="card-error"]');
      if (errorRegion) {
        expect(errorRegion.getAttribute('role')).toBe('alert');
        expect(errorRegion.querySelector('[data-testid="card-retry"]')).toBeTruthy();
      }
      // Broken-media fallback is decorative — never in the a11y tree.
      const brokenMedia = el.querySelector('[data-testid="card-media-fallback"]');
      if (brokenMedia) expect(brokenMedia.getAttribute('aria-hidden')).toBe('true');
    };

    const states: Array<Record<string, unknown>> = [
      {},
      { loading: true },
      { error: true },
      { error: true, kind: 'action' },
      { empty: true },
      { clickable: true },
      { clickable: true, disabled: true },
      { selectable: true },
      { selectable: true, selected: true },
      { selectable: true, disabled: true },
      { kind: 'stat', loading: true },
      { density: 'compact', selectable: true },
    ];

    it.each(states)('should hold the ARIA contract for %j', (state) => {
      for (const [k, v] of Object.entries(state)) fixture.componentRef.setInput(k, v);
      fixture.detectChanges();
      assertInvariants(card());
    });
  });

  // ------------------------------------------------------------------
  // Projection + two-way binding through a real host.
  // ------------------------------------------------------------------
  describe('host integration', () => {
    let host: ComponentFixture<CardHostComponent>;
    const hostCard = () => host.nativeElement.querySelector('.iu-card') as HTMLElement;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({ imports: [CardHostComponent] }).compileComponents();
      host = TestBed.createComponent(CardHostComponent);
      host.detectChanges();
    });

    it('should project the default content when neither loading nor empty', () => {
      expect(host.nativeElement.querySelector('.body-content')).toBeTruthy();
      expect(host.nativeElement.querySelector('.empty-copy')).toBeNull();
    });

    it('should project [slot=empty] and drop the body content when empty', () => {
      host.componentInstance.empty.set(true);
      host.detectChanges();
      expect(host.nativeElement.querySelector('.empty-copy')?.textContent).toBe('Sem imóveis ainda');
      expect(host.nativeElement.querySelector('.body-content')).toBeNull();
    });

    it('should drop every projected slot while loading', () => {
      host.componentInstance.loading.set(true);
      host.detectChanges();
      expect(host.nativeElement.querySelector('.body-content')).toBeNull();
      expect(host.nativeElement.querySelector('.empty-copy')).toBeNull();
      expect(hostCard().getAttribute('aria-busy')).toBe('true');
    });

    it('should write selection back to the host through two-way binding', () => {
      host.componentInstance.selectable.set(true);
      host.detectChanges();
      hostCard().click();
      host.detectChanges();
      expect(host.componentInstance.selected()).toBe(true);
      expect(hostCard().getAttribute('aria-pressed')).toBe('true');
    });
  });
});
