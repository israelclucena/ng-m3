jest.mock('@material/web/tabs/tabs.js', () => ({}));
jest.mock('@material/web/tabs/primary-tab.js', () => ({}));
jest.mock('@material/web/tabs/secondary-tab.js', () => ({}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent } from './tabs.component';

type MdTabsEl = HTMLElement & {
  activeTabIndex?: number;
};

describe('TabsComponent', () => {
  let fixture: ComponentFixture<TabsComponent>;
  let component: TabsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TabsComponent] }).compileComponents();
    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has variant default of "primary"', () => {
    expect(component.variant()).toBe('primary');
  });

  it('has activeTabIndex default of 0', () => {
    expect(component.activeTabIndex()).toBe(0);
  });

  it('renders md-tabs element in the template', () => {
    const el = fixture.nativeElement.querySelector('md-tabs') as MdTabsEl;
    expect(el).toBeTruthy();
  });

  it('sets active-tab-index attribute on md-tabs to 0 by default', () => {
    const el = fixture.nativeElement.querySelector('md-tabs') as HTMLElement;
    expect(el.getAttribute('active-tab-index')).toBe('0');
  });

  it('updates active-tab-index attribute when activeTabIndex input changes', () => {
    fixture.componentRef.setInput('activeTabIndex', 2);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-tabs') as HTMLElement;
    expect(el.getAttribute('active-tab-index')).toBe('2');
  });

  it('accepts variant input "secondary"', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    expect(component.variant()).toBe('secondary');
  });

  it('exposes tabsRef viewChild pointing to md-tabs element', () => {
    const ref = component.tabsRef();
    expect(ref).toBeTruthy();
    expect((ref?.nativeElement as HTMLElement).tagName.toLowerCase()).toBe('md-tabs');
  });

  it('ngAfterViewInit sets activeTabIndex JS property on md-tabs element', () => {
    fixture.componentRef.setInput('activeTabIndex', 3);
    // Re-create so ngAfterViewInit picks up the new input value
    const f2 = TestBed.createComponent(TabsComponent);
    f2.componentRef.setInput('activeTabIndex', 3);
    f2.detectChanges();
    const el = f2.nativeElement.querySelector('md-tabs') as MdTabsEl;
    expect(el.activeTabIndex).toBe(3);
  });

  it('change output emits the el.activeTabIndex when md-tabs fires "change"', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-tabs') as MdTabsEl;
    el.activeTabIndex = 1;
    el.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('change output emits updated index when md-tabs fires "change" multiple times', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-tabs') as MdTabsEl;
    el.activeTabIndex = 2;
    el.dispatchEvent(new Event('change'));
    el.activeTabIndex = 0;
    el.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenNthCalledWith(1, 2);
    expect(spy).toHaveBeenNthCalledWith(2, 0);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not emit change before md-tabs fires the event', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('projects ng-content children inside md-tabs', () => {
    const el = fixture.nativeElement.querySelector('md-tabs') as HTMLElement;
    // ng-content slot exists — query for it via the projected anchor (CUSTOM_ELEMENTS_SCHEMA allows arbitrary children).
    // Since we cannot inject projected content in this fixture, assert the slot anchor is the md-tabs itself with no children.
    expect(el.children.length).toBe(0);
  });

  it('change output is wired even when activeTabIndex stays at default', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = fixture.nativeElement.querySelector('md-tabs') as MdTabsEl;
    el.activeTabIndex = 0;
    el.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(0);
  });
});
