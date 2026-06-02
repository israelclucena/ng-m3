import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';

type MdIconButtonEl = HTMLElement & {
  disabled?: boolean;
  toggle?: boolean;
  selected?: boolean;
};

describe('IconButtonComponent', () => {
  let fixture: ComponentFixture<IconButtonComponent>;
  let component: IconButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [IconButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'settings');
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('defaults to standard variant with no extra flags', () => {
    expect(component.variant()).toBe('standard');
    expect(component.disabled()).toBe(false);
    expect(component.toggle()).toBe(false);
    expect(component.selected()).toBe(false);
    expect(component.ariaLabel()).toBe('');
  });

  it('renders md-icon-button (standard) by default with icon text', () => {
    const el = fixture.nativeElement.querySelector('md-icon-button');
    expect(el).toBeTruthy();
    const iconEl = el?.querySelector('md-icon');
    expect(iconEl?.textContent?.trim()).toBe('settings');
  });

  it('hostClass reflects variant and flags', () => {
    expect(component.hostClass()).toBe('iu-icon-btn iu-icon-btn--standard');

    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('toggle', true);
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    expect(component.hostClass()).toBe(
      'iu-icon-btn iu-icon-btn--standard iu-icon-btn--disabled iu-icon-btn--toggle iu-icon-btn--selected',
    );
  });

  it('renders md-filled-icon-button when variant=filled', () => {
    const f = TestBed.createComponent(IconButtonComponent);
    f.componentRef.setInput('icon', 'edit');
    f.componentRef.setInput('variant', 'filled');
    f.detectChanges();

    const el = f.nativeElement.querySelector('md-filled-icon-button') as MdIconButtonEl;
    expect(el).toBeTruthy();
    expect(f.nativeElement.querySelector('md-icon-button')).toBeNull();
    expect(el.className).toContain('iu-icon-btn--filled');
  });

  it('renders md-filled-tonal-icon-button when variant=tonal', () => {
    const f = TestBed.createComponent(IconButtonComponent);
    f.componentRef.setInput('icon', 'favorite');
    f.componentRef.setInput('variant', 'tonal');
    f.detectChanges();

    const el = f.nativeElement.querySelector('md-filled-tonal-icon-button') as MdIconButtonEl;
    expect(el).toBeTruthy();
    expect(el.className).toContain('iu-icon-btn--tonal');
  });

  it('renders md-outlined-icon-button when variant=outlined', () => {
    const f = TestBed.createComponent(IconButtonComponent);
    f.componentRef.setInput('icon', 'star');
    f.componentRef.setInput('variant', 'outlined');
    f.detectChanges();

    const el = f.nativeElement.querySelector('md-outlined-icon-button') as MdIconButtonEl;
    expect(el).toBeTruthy();
    expect(el.className).toContain('iu-icon-btn--outlined');
  });

  it('flips disabled, toggle and selected as properties on the md element', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('toggle', true);
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('md-icon-button') as MdIconButtonEl;
    expect(el.disabled).toBe(true);
    expect(el.toggle).toBe(true);
    expect(el.selected).toBe(true);
  });

  it('sets aria-label attribute when ariaLabel is provided, omits when empty', () => {
    let el = fixture.nativeElement.querySelector('md-icon-button') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBeNull();

    fixture.componentRef.setInput('ariaLabel', 'Open settings');
    fixture.detectChanges();

    el = fixture.nativeElement.querySelector('md-icon-button') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Open settings');
  });

  it('emits clicked with the MouseEvent when clicked and not disabled', () => {
    const spy = jest.fn();
    component.clicked.subscribe(spy);

    const el = fixture.nativeElement.querySelector('md-icon-button') as HTMLElement;
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.dispatchEvent(evt);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(evt);
  });

  it('does not emit clicked when disabled, and stops propagation', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const spy = jest.fn();
    component.clicked.subscribe(spy);

    const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopSpy = jest.spyOn(evt, 'stopPropagation');
    const preventSpy = jest.spyOn(evt, 'preventDefault');

    const el = fixture.nativeElement.querySelector('md-icon-button') as HTMLElement;
    el.dispatchEvent(evt);

    expect(spy).not.toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
    expect(preventSpy).toHaveBeenCalled();
  });

  it('updates rendered icon when icon input changes', () => {
    fixture.componentRef.setInput('icon', 'delete');
    fixture.detectChanges();

    const iconEl = fixture.nativeElement.querySelector('md-icon-button md-icon');
    expect(iconEl?.textContent?.trim()).toBe('delete');
  });
});
