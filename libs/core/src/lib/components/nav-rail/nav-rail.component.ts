import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  HostListener,
  input,
  output,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavMenuItem, NavRailConfig, NavRailNavigationEvent, NavRailFabEvent } from './m3-nav-rail.types';

// Re-export types for barrel export
export { NavMenuItem, NavBadge, NavRailConfig, NavRailNavigationEvent, NavRailFabEvent } from './m3-nav-rail.types';

// Legacy compat — kept for existing consumers
export interface NavRailItem {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number | string | boolean;
}

export interface NavRailSecondaryItem {
  icon: string;
  label: string;
  section?: string;
}

/**
 * IU Navigation Rail — M3 with flyout submenus, accordion & dark mode.
 *
 * Collapsed (88px): icon + label, hover flyout for items with children
 * Expanded (256px): side panel with inline accordion
 * Up to 3 levels of depth
 */
@Component({
  selector: 'iu-nav-rail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-rail.component.html',
  styleUrl: './nav-rail.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailComponent implements OnInit {
  // ══════════════════════════════════════
  // INPUTS
  // ══════════════════════════════════════

  /** Navigation menu items (up to 3 levels) */
  menuItems = input<NavMenuItem[]>([]);

  /** ID of the currently active item */
  activeItemId = input<string>('');

  /** Rail configuration */
  config = input<NavRailConfig>({});

  /** Dark mode state */
  darkMode = input<boolean>(false);

  // Legacy inputs (backward compat)
  items = input<NavRailItem[]>([]);
  secondaryItems = input<NavRailSecondaryItem[]>([]);
  drawerTitle = input<string>('');
  fabIcon = input<string>('');
  fabLabel = input<string>('');

  // ══════════════════════════════════════
  // OUTPUTS
  // ══════════════════════════════════════

  /** Emitted on navigation item click */
  navigate = output<NavRailNavigationEvent>();

  /** Emitted when dark mode toggles */
  darkModeChange = output<boolean>();

  /** Emitted when FAB is clicked */
  fabClick = output<void>();

  /** Emitted when expanded state changes */
  expandedChange = output<boolean>();

  // Legacy outputs (backward compat)
  itemClick = output<number>();
  secondaryItemClick = output<NavRailSecondaryItem>();
  darkModeToggle = output<void>();

  // ══════════════════════════════════════
  // INTERNAL STATE
  // ══════════════════════════════════════

  expanded = signal(false);
  activeFlyout = signal<string | null>(null);
  expandedGroups = signal<Set<string>>(new Set());
  isDarkMode = signal(false);
  windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);

  isModalMode = computed(() => this.windowWidth() < (this.resolvedConfig().modalBreakpoint));

  /** Use new API if menuItems provided, else fall back to legacy items */
  useNewApi = computed(() => this.menuItems().length > 0);

  resolvedConfig = computed<Required<NavRailConfig>>(() => ({
    title: this.config().title ?? this.drawerTitle() ?? '',
    showFab: this.config().showFab ?? !!this.fabIcon(),
    fabIcon: this.config().fabIcon ?? this.fabIcon() ?? 'edit',
    fabLabel: this.config().fabLabel ?? this.fabLabel() ?? '',
    showDarkModeToggle: this.config().showDarkModeToggle ?? true,
    showSearch: this.config().showSearch ?? false,
    collapsedWidth: this.config().collapsedWidth ?? 88,
    expandedWidth: this.config().expandedWidth ?? 256,
    flyoutWidth: this.config().flyoutWidth ?? 224,
    modalBreakpoint: this.config().modalBreakpoint ?? 840,
  }));

  // Hover bridge timers
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly HOVER_DELAY_OPEN = 100;
  private readonly HOVER_DELAY_CLOSE = 300;

  // ══════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════

  ngOnInit(): void {
    this.isDarkMode.set(this.darkMode());
    const saved = localStorage.getItem('m3-theme');
    if (saved) {
      this.isDarkMode.set(saved === 'dark');
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.windowWidth.set(window.innerWidth);
      });
    }
  }

  // ══════════════════════════════════════
  // EXPAND / COLLAPSE
  // ══════════════════════════════════════

  toggleExpand(): void {
    this.expanded.update((v) => !v);
    this.expandedChange.emit(this.expanded());
    this.activeFlyout.set(null);
  }

  closePanel(): void {
    this.expanded.set(false);
    this.expandedChange.emit(false);
  }

  // ══════════════════════════════════════
  // FLYOUT HOVER BRIDGE
  // ══════════════════════════════════════

  onRailItemHover(menuId: string): void {
    if (this.expanded()) return;
    this.clearHoverTimer();

    const item = this.findMenuItem(menuId);
    if (!item?.children?.length) {
      this.activeFlyout.set(null);
      return;
    }

    this.hoverTimer = setTimeout(() => {
      this.activeFlyout.set(menuId);
    }, this.HOVER_DELAY_OPEN);
  }

  onRailItemLeave(): void {
    if (this.expanded()) return;
    this.startCloseTimer();
  }

  onFlyoutEnter(): void {
    this.clearHoverTimer();
  }

  onFlyoutLeave(): void {
    this.startCloseTimer();
  }

  // ══════════════════════════════════════
  // ACCORDION
  // ══════════════════════════════════════

  toggleGroup(groupId: string): void {
    this.expandedGroups.update((groups) => {
      const next = new Set(groups);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  }

  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  // ══════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════

  onMenuItemClick(item: NavMenuItem, level: 1 | 2 | 3): void {
    if (item.children?.length && !item.route) {
      // Has children without route → toggle accordion (in expanded mode)
      if (this.expanded()) {
        this.toggleGroup(item.id);
      }
      return;
    }

    if (item.route) {
      this.navigate.emit({ item, route: item.route, level });
      this.activeFlyout.set(null);
      if (this.isModalMode() && this.expanded()) {
        this.expanded.set(false);
        this.expandedChange.emit(false);
      }
    }
  }

  onFlyoutItemClick(item: NavMenuItem, level: 2 | 3): void {
    if (item.children?.length) {
      this.toggleGroup(item.id);
      return;
    }
    if (item.route) {
      this.navigate.emit({ item, route: item.route, level });
      this.activeFlyout.set(null);
    }
  }

  // Legacy handler
  onLegacyItemClick(index: number): void {
    this.itemClick.emit(index);
    if (this.isModalMode() && this.expanded()) {
      this.expanded.set(false);
      this.expandedChange.emit(false);
    }
  }

  // ══════════════════════════════════════
  // DARK MODE
  // ══════════════════════════════════════

  onToggleDarkMode(): void {
    this.isDarkMode.update((v) => !v);
    localStorage.setItem('m3-theme', this.isDarkMode() ? 'dark' : 'light');
    this.darkModeChange.emit(this.isDarkMode());
    this.darkModeToggle.emit(); // legacy compat
  }

  // ══════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════

  hasChildren(item: NavMenuItem): boolean {
    return !!item.children?.length;
  }

  getOverviewLabel(item: NavMenuItem): string {
    return `${item.label} overview`;
  }

  isItemActive(itemId: string): boolean {
    return this.activeItemId() === itemId;
  }

  findMenuItem(id: string): NavMenuItem | undefined {
    return this.menuItems().find((i) => i.id === id);
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  private startCloseTimer(): void {
    this.clearHoverTimer();
    this.hoverTimer = setTimeout(() => {
      this.activeFlyout.set(null);
    }, this.HOVER_DELAY_CLOSE);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeFlyout()) this.activeFlyout.set(null);
    if (this.expanded()) {
      this.expanded.set(false);
      this.expandedChange.emit(false);
    }
  }
}
