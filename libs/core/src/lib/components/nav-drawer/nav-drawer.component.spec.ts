import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavDrawerComponent, NavDrawerItem } from './nav-drawer.component';

describe('NavDrawerComponent', () => {
  let fixture: ComponentFixture<NavDrawerComponent>;
  let component: NavDrawerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NavDrawerComponent] }).compileComponents();
    fixture = TestBed.createComponent(NavDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.open()).toBe(false);
    expect(component.variant()).toBe('standard');
    expect(component.items()).toEqual([]);
  });

  it('hostClass defaults to standard variant without open modifier', () => {
    expect(component.hostClass()).toBe('iu-nav-drawer iu-nav-drawer--standard');
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.className).toBe('iu-nav-drawer iu-nav-drawer--standard');
  });

  it('hostClass adds --open modifier when open() is true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-nav-drawer iu-nav-drawer--standard iu-nav-drawer--open');
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.className).toContain('iu-nav-drawer--open');
  });

  it('hostClass reflects modal variant', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-nav-drawer iu-nav-drawer--modal iu-nav-drawer--open');
  });

  it('does not render scrim when variant is standard', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-nav-drawer__scrim');
    expect(scrim).toBeNull();
  });

  it('does not render scrim when modal but closed', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-nav-drawer__scrim');
    expect(scrim).toBeNull();
  });

  it('renders scrim when modal and open, and clicking it emits dismissed', () => {
    fixture.componentRef.setInput('variant', 'modal');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.iu-nav-drawer__scrim') as HTMLElement;
    expect(scrim).toBeTruthy();
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    scrim.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders one button per non-section item', () => {
    const items: NavDrawerItem[] = [
      { label: 'Home', icon: 'home' },
      { label: 'Inbox', icon: 'inbox' },
      { label: 'Settings' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button.iu-nav-drawer__item');
    expect(buttons.length).toBe(3);
  });

  it('renders section divider div (not button) for items with section', () => {
    const items: NavDrawerItem[] = [
      { label: 'Home' },
      { label: '__divider__', section: 'Labels' },
      { label: 'Work' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button.iu-nav-drawer__item');
    expect(buttons.length).toBe(2);
    const sections = fixture.nativeElement.querySelectorAll('.iu-nav-drawer__section');
    expect(sections.length).toBe(1);
    expect((sections[0] as HTMLElement).textContent?.trim()).toBe('Labels');
  });

  it('applies --active class to items marked active', () => {
    const items: NavDrawerItem[] = [
      { label: 'Home', active: true },
      { label: 'Inbox' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button.iu-nav-drawer__item');
    expect((buttons[0] as HTMLElement).className).toContain('iu-nav-drawer__item--active');
    expect((buttons[1] as HTMLElement).className).not.toContain('iu-nav-drawer__item--active');
  });

  it('renders icon span when item.icon is set', () => {
    const items: NavDrawerItem[] = [
      { label: 'Home', icon: 'home' },
      { label: 'NoIcon' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button.iu-nav-drawer__item');
    const firstIcon = (buttons[0] as HTMLElement).querySelector('.iu-nav-drawer__icon') as HTMLElement;
    expect(firstIcon).toBeTruthy();
    expect(firstIcon.textContent?.trim()).toBe('home');
    const secondIcon = (buttons[1] as HTMLElement).querySelector('.iu-nav-drawer__icon');
    expect(secondIcon).toBeNull();
  });

  it('renders badge span when item.badge is set', () => {
    const items: NavDrawerItem[] = [
      { label: 'Inbox', badge: 5 },
      { label: 'Sent' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button.iu-nav-drawer__item');
    const firstBadge = (buttons[0] as HTMLElement).querySelector('.iu-nav-drawer__badge') as HTMLElement;
    expect(firstBadge).toBeTruthy();
    expect(firstBadge.textContent?.trim()).toBe('5');
    const secondBadge = (buttons[1] as HTMLElement).querySelector('.iu-nav-drawer__badge');
    expect(secondBadge).toBeNull();
  });

  it('emits itemClick with index when an item button is clicked', () => {
    const items: NavDrawerItem[] = [
      { label: 'Home' },
      { label: 'Inbox' },
      { label: 'Settings' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const spy = jest.fn();
    component.itemClick.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button.iu-nav-drawer__item');
    (buttons[1] as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('dismiss() method emits dismissed output', () => {
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    component.dismiss();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
