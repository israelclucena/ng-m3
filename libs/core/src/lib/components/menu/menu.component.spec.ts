import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let fixture: ComponentFixture<MenuComponent>;
  let component: MenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('defaults: open=false, anchor empty, positioning=absolute', () => {
    expect(component.open()).toBe(false);
    expect(component.anchor()).toBe('');
    expect(component.positioning()).toBe('absolute');
  });

  it('hostClass computed reflects closed state by default', () => {
    expect(component.hostClass()).toBe('iu-menu');
  });

  it('hostClass computed appends --open modifier when open=true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-menu iu-menu--open');
  });

  it('anchor input is reflected as property onto md-menu element', () => {
    fixture.componentRef.setInput('anchor', 'my-anchor-id');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-menu') as (HTMLElement & { anchor?: string }) | null;
    expect(el?.anchor).toBe('my-anchor-id');
  });

  it('positioning input is reflected as property onto md-menu element', () => {
    fixture.componentRef.setInput('positioning', 'fixed');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-menu') as (HTMLElement & { positioning?: string }) | null;
    expect(el?.positioning).toBe('fixed');
  });

  it('onOpened emits opened output', () => {
    const spy = jest.fn();
    component.opened.subscribe(spy);
    component.onOpened();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onClosed emits closed output', () => {
    const spy = jest.fn();
    component.closed.subscribe(spy);
    component.onClosed();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onItemSelected emits itemSelected with the event payload', () => {
    const spy = jest.fn();
    component.itemSelected.subscribe(spy);
    const event = new Event('close-menu');
    component.onItemSelected(event);
    expect(spy).toHaveBeenCalledWith(event);
  });
});
