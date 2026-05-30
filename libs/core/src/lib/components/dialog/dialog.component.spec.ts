import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  let fixture: ComponentFixture<DialogComponent>;
  let component: DialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('hostClass computed reflects default type simple', () => {
    expect(component.hostClass()).toBe('iu-dialog iu-dialog--simple');
  });

  it('hostClass computed reflects alert type', () => {
    fixture.componentRef.setInput('type', 'alert');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-dialog iu-dialog--alert');
  });

  it('hasIcon true when icon input set, false when empty', () => {
    expect(component.hasIcon()).toBe(false);
    fixture.componentRef.setInput('icon', 'warning');
    fixture.detectChanges();
    expect(component.hasIcon()).toBe(true);
  });

  it('hasHeadline true when headline input set', () => {
    expect(component.hasHeadline()).toBe(false);
    fixture.componentRef.setInput('headline', 'Confirm');
    fixture.detectChanges();
    expect(component.hasHeadline()).toBe(true);
  });

  it('hasSupportingText true when supportingText input set', () => {
    expect(component.hasSupportingText()).toBe(false);
    fixture.componentRef.setInput('supportingText', 'Are you sure?');
    fixture.detectChanges();
    expect(component.hasSupportingText()).toBe(true);
  });

  it('renders headline span when headline set', () => {
    fixture.componentRef.setInput('headline', 'Confirm action');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span[slot="headline"]');
    expect(el?.textContent?.trim()).toBe('Confirm action');
  });

  it('renders md-icon prefix when icon set', () => {
    fixture.componentRef.setInput('icon', 'warning');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-icon[slot="headline-prefix"]');
    expect(el?.textContent?.trim()).toBe('warning');
  });

  it('renders supporting text paragraph when supportingText set', () => {
    fixture.componentRef.setInput('supportingText', 'Are you sure?');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('p.iu-dialog__supporting-text');
    expect(el?.textContent?.trim()).toBe('Are you sure?');
  });

  it('onOpened emits opened output', () => {
    const spy = jest.fn();
    component.opened.subscribe(spy);
    component.onOpened();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onClosed emits closed with returnValue when present', () => {
    const spy = jest.fn();
    component.closed.subscribe(spy);
    const event = { target: { returnValue: 'ok' } } as unknown as Event;
    component.onClosed(event);
    expect(spy).toHaveBeenCalledWith('ok');
  });

  it('onClosed emits closed with empty string when returnValue undefined', () => {
    const spy = jest.fn();
    component.closed.subscribe(spy);
    const event = { target: {} } as unknown as Event;
    component.onClosed(event);
    expect(spy).toHaveBeenCalledWith('');
  });
});
