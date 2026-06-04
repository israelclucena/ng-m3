import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopAppBarComponent } from './top-app-bar.component';

describe('TopAppBarComponent', () => {
  let fixture: ComponentFixture<TopAppBarComponent>;
  let component: TopAppBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TopAppBarComponent] }).compileComponents();
    fixture = TestBed.createComponent(TopAppBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.variant()).toBe('small');
    expect(component.scrollBehavior()).toBe('fixed');
    expect(component.scrolled()).toBe(false);
    expect(component.headline()).toBe('');
    expect(component.leadingIcon()).toBe('');
    expect(component.trailingIcons()).toEqual([]);
  });

  it('hasLeadingIcon computed reflects leadingIcon truthiness', () => {
    expect(component.hasLeadingIcon()).toBe(false);
    fixture.componentRef.setInput('leadingIcon', 'menu');
    fixture.detectChanges();
    expect(component.hasLeadingIcon()).toBe(true);
  });

  it('hasTrailingIcons computed reflects array length', () => {
    expect(component.hasTrailingIcons()).toBe(false);
    fixture.componentRef.setInput('trailingIcons', ['search']);
    fixture.detectChanges();
    expect(component.hasTrailingIcons()).toBe(true);
  });

  it('hostClass includes base classes and variant modifier by default', () => {
    const cls = component.hostClass();
    expect(cls).toContain('iu-top-app-bar');
    expect(cls).toContain('iu-top-app-bar--small');
    expect(cls).not.toContain('iu-top-app-bar--scrolled');
  });

  it('hostClass does NOT include scrolled modifier when scrolled=true but scrollBehavior!=elevate', () => {
    fixture.componentRef.setInput('scrolled', true);
    fixture.componentRef.setInput('scrollBehavior', 'fixed');
    fixture.detectChanges();
    expect(component.hostClass()).not.toContain('iu-top-app-bar--scrolled');
  });

  it('hostClass includes scrolled modifier only when scrolled=true AND scrollBehavior=elevate', () => {
    fixture.componentRef.setInput('scrolled', true);
    fixture.componentRef.setInput('scrollBehavior', 'elevate');
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-top-app-bar--scrolled');
  });

  it('renders header[role=banner] with hostClass applied', () => {
    const header = fixture.nativeElement.querySelector('header[role=banner]') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.className).toContain('iu-top-app-bar--small');
  });

  it('does not render leading button when leadingIcon is empty', () => {
    const btn = fixture.nativeElement.querySelector('button.iu-top-app-bar__leading');
    expect(btn).toBeNull();
  });

  it('renders leading button with aria-label when leadingIcon is set', () => {
    fixture.componentRef.setInput('leadingIcon', 'menu');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button.iu-top-app-bar__leading') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('menu');
    expect(btn.textContent).toContain('menu');
  });

  it('emits leadingIconClick when leading button is clicked', () => {
    const spy = jest.fn();
    component.leadingIconClick.subscribe(spy);
    fixture.componentRef.setInput('leadingIcon', 'menu');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button.iu-top-app-bar__leading') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders headline h1 in small variant branch with the headline text', () => {
    fixture.componentRef.setInput('variant', 'small');
    fixture.componentRef.setInput('headline', 'My App');
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1.iu-top-app-bar__headline') as HTMLElement;
    expect(h1).toBeTruthy();
    expect(h1.textContent?.trim()).toBe('My App');
    // small branch puts headline inside the row, NOT in a separate headline-row
    const headlineRow = fixture.nativeElement.querySelector('.iu-top-app-bar__headline-row');
    expect(headlineRow).toBeNull();
  });

  it('renders headline h1 in large variant branch inside headline-row', () => {
    fixture.componentRef.setInput('variant', 'large');
    fixture.componentRef.setInput('headline', 'Big Page');
    fixture.detectChanges();
    const headlineRow = fixture.nativeElement.querySelector('.iu-top-app-bar__headline-row') as HTMLElement;
    expect(headlineRow).toBeTruthy();
    const h1 = headlineRow.querySelector('h1.iu-top-app-bar__headline') as HTMLElement;
    expect(h1).toBeTruthy();
    expect(h1.textContent?.trim()).toBe('Big Page');
  });

  it('renders trailing action buttons with aria-labels in small variant', () => {
    fixture.componentRef.setInput('trailingIcons', ['search', 'more_vert']);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.iu-top-app-bar__action',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('aria-label')).toBe('search');
    expect(buttons[1].getAttribute('aria-label')).toBe('more_vert');
  });

  it('emits trailingIconClick with the icon name when a trailing button is clicked (small variant)', () => {
    const spy = jest.fn();
    component.trailingIconClick.subscribe(spy);
    fixture.componentRef.setInput('trailingIcons', ['search', 'more_vert']);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.iu-top-app-bar__action',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    expect(spy).toHaveBeenCalledWith('more_vert');
  });

  it('emits trailingIconClick with the icon name in medium variant branch', () => {
    const spy = jest.fn();
    component.trailingIconClick.subscribe(spy);
    fixture.componentRef.setInput('variant', 'medium');
    fixture.componentRef.setInput('trailingIcons', ['favorite']);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector(
      'button.iu-top-app-bar__action',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(spy).toHaveBeenCalledWith('favorite');
  });
});
