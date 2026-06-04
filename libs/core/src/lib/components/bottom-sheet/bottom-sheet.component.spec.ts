import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottomSheetComponent } from './bottom-sheet.component';

describe('BottomSheetComponent', () => {
  let fixture: ComponentFixture<BottomSheetComponent>;
  let component: BottomSheetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BottomSheetComponent] }).compileComponents();
    fixture = TestBed.createComponent(BottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.open()).toBe(false);
    expect(component.variant()).toBe('standard');
    expect(component.dragHandle()).toBe(true);
  });

  it('hostClass defaults include base and standard variant, no open modifier', () => {
    const cls = component.hostClass();
    expect(cls).toContain('iu-bottom-sheet');
    expect(cls).toContain('iu-bottom-sheet--standard');
    expect(cls).not.toContain('iu-bottom-sheet--open');
    expect(cls).not.toContain('iu-bottom-sheet--modal');
  });

  it('hostClass includes iu-bottom-sheet--modal when variant=modal', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-bottom-sheet--modal');
  });

  it('hostClass includes iu-bottom-sheet--open when open=true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-bottom-sheet--open');
  });

  it('does not render scrim when variant=standard even if open=true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-bottom-sheet__scrim');
    expect(scrim).toBeNull();
  });

  it('does not render scrim when variant=modal but open=false', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-bottom-sheet__scrim');
    expect(scrim).toBeNull();
  });

  it('renders scrim when variant=modal and open=true', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-bottom-sheet__scrim');
    expect(scrim).toBeTruthy();
  });

  it('clicking scrim emits dismissed output', () => {
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-bottom-sheet__scrim') as HTMLElement;
    scrim.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('calling dismiss() directly emits dismissed output', () => {
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    component.dismiss();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders drag handle by default', () => {
    const handleBar = fixture.nativeElement.querySelector('.iu-bottom-sheet__handle-bar');
    const handle = fixture.nativeElement.querySelector('.iu-bottom-sheet__handle');
    expect(handleBar).toBeTruthy();
    expect(handle).toBeTruthy();
  });

  it('does not render drag handle when dragHandle=false', () => {
    fixture.componentRef.setInput('dragHandle', false);
    fixture.detectChanges();
    const handleBar = fixture.nativeElement.querySelector('.iu-bottom-sheet__handle-bar');
    expect(handleBar).toBeNull();
  });

  it('renders content container with ng-content slot', () => {
    const content = fixture.nativeElement.querySelector('.iu-bottom-sheet__content');
    expect(content).toBeTruthy();
  });

  it('host wrapper div has class string from hostClass()', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.iu-bottom-sheet') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.classList.contains('iu-bottom-sheet--modal')).toBe(true);
    expect(wrapper.classList.contains('iu-bottom-sheet--open')).toBe(true);
  });

  it('scrim disappears when open toggles back to false after being open', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-bottom-sheet__scrim')).toBeTruthy();
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-bottom-sheet__scrim')).toBeNull();
  });
});
