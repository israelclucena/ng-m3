import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  WidgetContainerComponent,
  WidgetGridComponent,
  type WidgetSize,
  type WidgetResizeEvent,
  type WidgetCloseEvent,
  type WidgetRefreshEvent,
} from './widget-container.component';

describe('WidgetContainerComponent', () => {
  let fixture: ComponentFixture<WidgetContainerComponent>;
  let component: WidgetContainerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── defaults ──────────────────────────────────────────────────────────────────

  it('defaults to the medium size and no collapse', () => {
    expect(component.currentSize()).toBe('medium');
    expect(component.collapsed()).toBe(false);
    expect(component.widgetClasses()).toContain('iu-widget--medium');
  });

  it('renders the title and hides optional controls by default', () => {
    fixture.componentRef.setInput('title', 'Revenue');
    fixture.detectChanges();
    const title: HTMLElement = fixture.nativeElement.querySelector('.iu-widget__title');
    expect(title.textContent).toContain('Revenue');
    // nothing opt-in is shown
    expect(fixture.nativeElement.querySelector('.iu-widget__size-group')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-widget__action-btn--close')).toBeNull();
  });

  // ── size / resize ─────────────────────────────────────────────────────────────

  it('setSize updates currentSize, the host class and emits a resize event', () => {
    fixture.componentRef.setInput('widgetId', 'revenue');
    let emitted: WidgetResizeEvent | undefined;
    component.resize.subscribe((e) => (emitted = e));

    component.setSize('large');
    fixture.detectChanges();

    expect(component.currentSize()).toBe('large');
    expect(component.widgetClasses()).toContain('iu-widget--large');
    expect(emitted).toEqual({ id: 'revenue', size: 'large' });
  });

  it('shows one size button per size when resizable', () => {
    fixture.componentRef.setInput('resizable', true);
    fixture.detectChanges();
    const btns = fixture.nativeElement.querySelectorAll('.iu-widget__size-btn');
    expect(btns.length).toBe(component.sizes.length);
    expect(component.sizes.map((s) => s.value)).toEqual<WidgetSize[]>([
      'small',
      'medium',
      'large',
      'full',
    ]);
  });

  it('marks the active size button via aria-pressed', () => {
    fixture.componentRef.setInput('resizable', true);
    component.setSize('full');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.iu-widget__size-btn--active');
    expect(active).not.toBeNull();
    expect(active.getAttribute('aria-pressed')).toBe('true');
  });

  // ── collapse ────────────────────────────────────────────────────────────────────

  it('toggleCollapse flips the collapsed flag and removes the body', () => {
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-widget__body')).not.toBeNull();

    component.toggleCollapse();
    fixture.detectChanges();
    expect(component.collapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.iu-widget__body')).toBeNull();

    component.toggleCollapse();
    fixture.detectChanges();
    expect(component.collapsed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.iu-widget__body')).not.toBeNull();
  });

  // ── close / refresh outputs ─────────────────────────────────────────────────────

  it('onClose emits a close event carrying the widget id', () => {
    fixture.componentRef.setInput('widgetId', 'users');
    let emitted: WidgetCloseEvent | undefined;
    component.close.subscribe((e) => (emitted = e));
    component.onClose();
    expect(emitted).toEqual({ id: 'users' });
  });

  it('onRefresh emits a refresh event carrying the widget id', () => {
    fixture.componentRef.setInput('widgetId', 'users');
    let emitted: WidgetRefreshEvent | undefined;
    component.refresh.subscribe((e) => (emitted = e));
    component.onRefresh();
    expect(emitted).toEqual({ id: 'users' });
  });

  it('close button click routes through onClose', () => {
    fixture.componentRef.setInput('closable', true);
    fixture.componentRef.setInput('widgetId', 'w1');
    fixture.detectChanges();
    let emitted: WidgetCloseEvent | undefined;
    component.close.subscribe((e) => (emitted = e));
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.iu-widget__action-btn--close',
    );
    btn.click();
    expect(emitted).toEqual({ id: 'w1' });
  });

  // ── loading / refresh visibility ────────────────────────────────────────────────

  it('shows the spinner and hides the refresh button while loading', () => {
    fixture.componentRef.setInput('refreshable', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-widget__spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-widget__loading-overlay')).not.toBeNull();
    // refresh button is suppressed during load
    const actionBtns = fixture.nativeElement.querySelectorAll('.iu-widget__action-btn');
    const hasRefresh = Array.from(actionBtns).some((b) =>
      (b as HTMLElement).getAttribute('aria-label') === 'Refresh widget',
    );
    expect(hasRefresh).toBe(false);
  });

  it('renders the refresh button when refreshable and not loading', () => {
    fixture.componentRef.setInput('refreshable', true);
    fixture.detectChanges();
    const actionBtns = fixture.nativeElement.querySelectorAll('.iu-widget__action-btn');
    const hasRefresh = Array.from(actionBtns).some((b) =>
      (b as HTMLElement).getAttribute('aria-label') === 'Refresh widget',
    );
    expect(hasRefresh).toBe(true);
  });

  // ── variant classes ──────────────────────────────────────────────────────────────

  it('adds elevated and compact modifier classes when requested', () => {
    fixture.componentRef.setInput('elevated', true);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    const classes = component.widgetClasses();
    expect(classes).toContain('iu-widget--elevated');
    expect(classes).toContain('iu-widget--compact');
  });

  it('omits variant classes by default', () => {
    expect(component.widgetClasses()).not.toContain('iu-widget--elevated');
    expect(component.widgetClasses()).not.toContain('iu-widget--compact');
  });
});

describe('WidgetGridComponent', () => {
  let fixture: ComponentFixture<WidgetGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetGridComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(WidgetGridComponent);
    fixture.detectChanges();
  });

  it('applies default min column width and gap CSS variables', () => {
    const grid: HTMLElement = fixture.nativeElement.querySelector('.iu-widget-grid');
    expect(grid.style.getPropertyValue('--iu-widget-min-col')).toBe('280px');
    expect(grid.style.gap).toBe('16px');
  });

  it('reflects custom min column width and gap', () => {
    fixture.componentRef.setInput('minColWidth', 320);
    fixture.componentRef.setInput('gap', 24);
    fixture.detectChanges();
    const grid: HTMLElement = fixture.nativeElement.querySelector('.iu-widget-grid');
    expect(grid.style.getPropertyValue('--iu-widget-min-col')).toBe('320px');
    expect(grid.style.gap).toBe('24px');
  });
});
