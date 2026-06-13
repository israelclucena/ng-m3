import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavRailComponent } from './nav-rail.component';
import type {
  NavMenuItem,
  NavRailNavigationEvent,
} from './m3-nav-rail.types';

describe('NavRailComponent', () => {
  let fixture: ComponentFixture<NavRailComponent>;
  let component: NavRailComponent;

  const makeMenuItems = (): NavMenuItem[] => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      children: [
        {
          id: 'profile',
          label: 'Profile',
          route: '/settings/profile',
        },
        {
          id: 'security',
          label: 'Security',
          children: [
            {
              id: 'password',
              label: 'Password',
              route: '/settings/security/password',
            },
          ],
        },
      ],
    },
  ];

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NavRailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavRailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Create ────────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── useNewApi computed ────────────────────────────────────────────────────
  it('useNewApi is false when no menuItems are provided', () => {
    expect(component.useNewApi()).toBe(false);
  });

  it('useNewApi is true when menuItems are set', () => {
    fixture.componentRef.setInput('menuItems', makeMenuItems());
    fixture.detectChanges();
    expect(component.useNewApi()).toBe(true);
  });

  // ── resolvedConfig computed ───────────────────────────────────────────────
  it('resolvedConfig returns defaults when no config is provided', () => {
    const cfg = component.resolvedConfig();
    expect(cfg.collapsedWidth).toBe(88);
    expect(cfg.expandedWidth).toBe(256);
    expect(cfg.flyoutWidth).toBe(224);
    expect(cfg.modalBreakpoint).toBe(840);
    expect(cfg.showDarkModeToggle).toBe(true);
    expect(cfg.showSearch).toBe(false);
    // legacy fabIcon input defaults to '' which is non-nullish, so the
    // ?? 'edit' fallback never fires — the resolved value is the empty string.
    expect(cfg.fabIcon).toBe('');
  });

  it('resolvedConfig merges provided config over the defaults', () => {
    fixture.componentRef.setInput('config', {
      title: 'My App',
      expandedWidth: 300,
      showSearch: true,
    });
    fixture.detectChanges();
    const cfg = component.resolvedConfig();
    expect(cfg.title).toBe('My App');
    expect(cfg.expandedWidth).toBe(300);
    expect(cfg.showSearch).toBe(true);
    // untouched defaults remain
    expect(cfg.collapsedWidth).toBe(88);
    expect(cfg.modalBreakpoint).toBe(840);
  });

  it('resolvedConfig falls back to legacy fab/title inputs', () => {
    fixture.componentRef.setInput('drawerTitle', 'Legacy Title');
    fixture.componentRef.setInput('fabIcon', 'add');
    fixture.componentRef.setInput('fabLabel', 'Compose');
    fixture.detectChanges();
    const cfg = component.resolvedConfig();
    expect(cfg.title).toBe('Legacy Title');
    expect(cfg.fabIcon).toBe('add');
    expect(cfg.fabLabel).toBe('Compose');
    // fabIcon present => showFab defaults to true
    expect(cfg.showFab).toBe(true);
  });

  // ── isItemActive ──────────────────────────────────────────────────────────
  it('isItemActive matches the activeItemId input', () => {
    fixture.componentRef.setInput('activeItemId', 'dashboard');
    fixture.detectChanges();
    expect(component.isItemActive('dashboard')).toBe(true);
    expect(component.isItemActive('settings')).toBe(false);
  });

  // ── hasChildren ───────────────────────────────────────────────────────────
  it('hasChildren is true for items with children, false otherwise', () => {
    const items = makeMenuItems();
    expect(component.hasChildren(items[0])).toBe(false);
    expect(component.hasChildren(items[1])).toBe(true);
  });

  // ── findMenuItem ──────────────────────────────────────────────────────────
  it('findMenuItem returns the top-level item by id', () => {
    fixture.componentRef.setInput('menuItems', makeMenuItems());
    fixture.detectChanges();
    expect(component.findMenuItem('settings')?.label).toBe('Settings');
  });

  it('findMenuItem returns undefined for an unknown id', () => {
    fixture.componentRef.setInput('menuItems', makeMenuItems());
    fixture.detectChanges();
    expect(component.findMenuItem('nope')).toBeUndefined();
  });

  // ── getOverviewLabel ──────────────────────────────────────────────────────
  it('getOverviewLabel appends " overview" to the label', () => {
    expect(component.getOverviewLabel(makeMenuItems()[1])).toBe(
      'Settings overview',
    );
  });

  // ── toggleExpand / closePanel ─────────────────────────────────────────────
  it('toggleExpand flips expanded state and emits expandedChange', () => {
    const spy = jest.fn();
    component.expandedChange.subscribe(spy);
    expect(component.expanded()).toBe(false);

    component.toggleExpand();
    expect(component.expanded()).toBe(true);
    expect(spy).toHaveBeenLastCalledWith(true);

    component.toggleExpand();
    expect(component.expanded()).toBe(false);
    expect(spy).toHaveBeenLastCalledWith(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('toggleExpand clears the active flyout', () => {
    component.activeFlyout.set('settings');
    component.toggleExpand();
    expect(component.activeFlyout()).toBeNull();
  });

  it('closePanel sets expanded to false and emits expandedChange(false)', () => {
    component.expanded.set(true);
    const spy = jest.fn();
    component.expandedChange.subscribe(spy);
    component.closePanel();
    expect(component.expanded()).toBe(false);
    expect(spy).toHaveBeenCalledWith(false);
  });

  // ── Accordion: toggleGroup / isGroupExpanded ──────────────────────────────
  it('isGroupExpanded is false until a group is toggled open', () => {
    expect(component.isGroupExpanded('settings')).toBe(false);
  });

  it('toggleGroup opens and then closes a group', () => {
    component.toggleGroup('settings');
    expect(component.isGroupExpanded('settings')).toBe(true);

    component.toggleGroup('settings');
    expect(component.isGroupExpanded('settings')).toBe(false);
  });

  it('toggleGroup tracks groups independently', () => {
    component.toggleGroup('settings');
    component.toggleGroup('security');
    expect(component.isGroupExpanded('settings')).toBe(true);
    expect(component.isGroupExpanded('security')).toBe(true);
    expect(component.isGroupExpanded('profile')).toBe(false);
  });

  // ── onMenuItemClick (new API navigation) ──────────────────────────────────
  it('onMenuItemClick emits navigate for an item with a route', () => {
    const items = makeMenuItems();
    fixture.componentRef.setInput('menuItems', items);
    fixture.detectChanges();

    const spy = jest.fn();
    component.navigate.subscribe(spy);
    component.onMenuItemClick(items[0], 1);

    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as NavRailNavigationEvent;
    expect(event.route).toBe('/dashboard');
    expect(event.level).toBe(1);
    expect(event.item.id).toBe('dashboard');
  });

  it('onMenuItemClick clears the active flyout when navigating', () => {
    const items = makeMenuItems();
    component.activeFlyout.set('dashboard');
    component.onMenuItemClick(items[0], 1);
    expect(component.activeFlyout()).toBeNull();
  });

  it('onMenuItemClick on a parent without route does not emit navigate', () => {
    const items = makeMenuItems();
    const spy = jest.fn();
    component.navigate.subscribe(spy);
    component.onMenuItemClick(items[1], 1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('onMenuItemClick on a parent without route toggles the group when expanded', () => {
    const items = makeMenuItems();
    component.expanded.set(true);
    component.onMenuItemClick(items[1], 1);
    expect(component.isGroupExpanded('settings')).toBe(true);
  });

  it('onMenuItemClick on a parent without route does not toggle when collapsed', () => {
    const items = makeMenuItems();
    component.expanded.set(false);
    component.onMenuItemClick(items[1], 1);
    expect(component.isGroupExpanded('settings')).toBe(false);
  });

  // ── onFlyoutItemClick ─────────────────────────────────────────────────────
  it('onFlyoutItemClick emits navigate for a leaf child', () => {
    const items = makeMenuItems();
    const child = items[1].children![0]; // profile (leaf with route)
    const spy = jest.fn();
    component.navigate.subscribe(spy);
    component.onFlyoutItemClick(child, 2);

    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as NavRailNavigationEvent;
    expect(event.route).toBe('/settings/profile');
    expect(event.level).toBe(2);
  });

  it('onFlyoutItemClick toggles the group for a child with its own children', () => {
    const items = makeMenuItems();
    const child = items[1].children![1]; // security (has children)
    const spy = jest.fn();
    component.navigate.subscribe(spy);
    component.onFlyoutItemClick(child, 2);

    expect(spy).not.toHaveBeenCalled();
    expect(component.isGroupExpanded('security')).toBe(true);
  });

  // ── onLegacyItemClick ─────────────────────────────────────────────────────
  it('onLegacyItemClick emits itemClick with the index', () => {
    const spy = jest.fn();
    component.itemClick.subscribe(spy);
    component.onLegacyItemClick(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  // ── onToggleDarkMode ──────────────────────────────────────────────────────
  it('onToggleDarkMode flips isDarkMode and emits both darkModeChange and darkModeToggle', () => {
    const changeSpy = jest.fn();
    const toggleSpy = jest.fn();
    component.darkModeChange.subscribe(changeSpy);
    component.darkModeToggle.subscribe(toggleSpy);

    expect(component.isDarkMode()).toBe(false);
    component.onToggleDarkMode();

    expect(component.isDarkMode()).toBe(true);
    expect(changeSpy).toHaveBeenCalledWith(true);
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  it('onToggleDarkMode persists the theme to localStorage', () => {
    component.onToggleDarkMode();
    expect(localStorage.getItem('m3-theme')).toBe('dark');
    component.onToggleDarkMode();
    expect(localStorage.getItem('m3-theme')).toBe('light');
  });

  // ── FAB ───────────────────────────────────────────────────────────────────
  it('renders the FAB and emits fabClick when clicked', () => {
    fixture.componentRef.setInput('menuItems', makeMenuItems());
    fixture.componentRef.setInput('config', { showFab: true, fabIcon: 'add' });
    fixture.detectChanges();

    const spy = jest.fn();
    component.fabClick.subscribe(spy);
    const fab = fixture.nativeElement.querySelector(
      '.m3-rail__fab',
    ) as HTMLElement;
    expect(fab).toBeTruthy();
    fab.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ── DOM smoke: new vs legacy API ──────────────────────────────────────────
  it('renders one rail item per menuItem in the collapsed new API', () => {
    fixture.componentRef.setInput('menuItems', makeMenuItems());
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.m3-rail__item');
    expect(buttons.length).toBe(2);
  });

  it('renders the legacy items list when no menuItems are provided', () => {
    fixture.componentRef.setInput('items', [
      { icon: 'home', label: 'Home', active: true },
      { icon: 'search', label: 'Search' },
    ]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.m3-rail__item');
    expect(buttons.length).toBe(2);
  });

  it('clicking a legacy item button emits itemClick with its index', () => {
    fixture.componentRef.setInput('items', [
      { icon: 'home', label: 'Home' },
      { icon: 'search', label: 'Search' },
    ]);
    fixture.detectChanges();
    const spy = jest.fn();
    component.itemClick.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('.m3-rail__item');
    (buttons[1] as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(1);
  });
});
