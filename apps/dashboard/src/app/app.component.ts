import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import {
  TopAppBarComponent,
  NavRailComponent,
  NavMenuItem,
  NavRailConfig,
  NavRailNavigationEvent,
  DividerComponent,
  NotificationContainerComponent,
  NotificationService,
  ThemeService,
} from '@israel-ui/core';
import { FeatureFlags } from './feature-flags';

export interface ComponentCategory {
  name: string;
  icon: string;
  components: ComponentEntry[];
}

export interface ComponentEntry {
  name: string;
  selector: string;
  status: 'ready' | 'wip' | 'missing';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopAppBarComponent,
    NavRailComponent,
    DividerComponent,
    NotificationContainerComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  flags = FeatureFlags;
  themeService = inject(ThemeService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  greeting = (() => {
    const h = new Date().getHours();
    const name = 'Israel';
    if (h < 12) return `Good morning, ${name} ☀️`;
    if (h < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name} 🌙`;
  })();

  /**
   * Current route path — updated on NavigationEnd.
   * Sprint 022: replaces `activeNav` integer with semantic route names.
   */
  currentRoute = signal('dashboard');

  /** Headline text derived from the current route */
  readonly pageHeadline = computed(() => {
    const r = this.currentRoute();
    if (r.startsWith('components')) return 'Component Catalog';
    if (r.startsWith('settings')) return 'Settings';
    if (r.startsWith('features')) return 'Features';
    return this.greeting;
  });

  /** True when the Components page is active (sidebar needed) */
  readonly isComponentsPage = computed(() =>
    this.currentRoute().startsWith('components')
  );

  darkMode = signal(true);
  activeComponent = signal<string | null>(null);
  navExpanded = signal(false);
  activeItemId = signal('dashboard');

  // Legacy compat — kept for template bindings that still reference activeNav
  readonly activeNav = computed(() => {
    const r = this.currentRoute();
    if (r.startsWith('components')) return 1;
    if (r.startsWith('settings')) return 2;
    if (r.startsWith('features')) return 3;
    return 0;
  });

  // ── Nav Rail Config ──
  railConfig: NavRailConfig = {
    title: 'Israel UI',
    showDarkModeToggle: true,
    collapsedWidth: 88,
    expandedWidth: 256,
    flyoutWidth: 224,
  };

  // ── Menu Items (3-level hierarchy) ──
  menuItems: NavMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: 'dashboard',
    },
    {
      id: 'components',
      label: 'Components',
      icon: 'widgets',
      route: 'components',
      children: [
        {
          id: 'comp-actions',
          label: 'Actions',
          children: [
            { id: 'comp-button', label: 'Button', route: 'components/button' },
            { id: 'comp-icon-button', label: 'Icon Button', route: 'components/icon-button' },
            { id: 'comp-fab', label: 'FAB', route: 'components/fab' },
          ],
        },
        {
          id: 'comp-selection',
          label: 'Selection',
          children: [
            { id: 'comp-checkbox', label: 'Checkbox', route: 'components/checkbox' },
            { id: 'comp-radio', label: 'Radio', route: 'components/radio' },
            { id: 'comp-switch', label: 'Switch', route: 'components/switch' },
            { id: 'comp-slider', label: 'Slider', route: 'components/slider' },
          ],
        },
        {
          id: 'comp-text-fields',
          label: 'Text Fields',
          children: [
            { id: 'comp-input-outlined', label: 'Input (Outlined)', route: 'components/input-outlined' },
            { id: 'comp-input-filled', label: 'Input (Filled)', route: 'components/input-filled' },
            { id: 'comp-select', label: 'Select', route: 'components/select' },
          ],
        },
        {
          id: 'comp-containment',
          label: 'Containment',
          children: [
            { id: 'comp-card', label: 'Card', route: 'components/card' },
            { id: 'comp-dialog', label: 'Dialog', route: 'components/dialog' },
            { id: 'comp-divider', label: 'Divider', route: 'components/divider' },
            { id: 'comp-bottom-sheet', label: 'Bottom Sheet', route: 'components/bottom-sheet' },
          ],
        },
        {
          id: 'comp-navigation',
          label: 'Navigation',
          children: [
            { id: 'comp-tabs', label: 'Tabs', route: 'components/tabs' },
            { id: 'comp-top-app-bar', label: 'Top App Bar', route: 'components/top-app-bar' },
            { id: 'comp-nav-rail', label: 'Navigation Rail', route: 'components/nav-rail' },
            { id: 'comp-nav-drawer', label: 'Navigation Drawer', route: 'components/nav-drawer' },
            { id: 'comp-menu', label: 'Menu', route: 'components/menu' },
          ],
        },
        {
          id: 'comp-communication',
          label: 'Communication',
          children: [
            { id: 'comp-badge', label: 'Badge', route: 'components/badge' },
            { id: 'comp-chip', label: 'Chip', route: 'components/chip' },
            { id: 'comp-progress', label: 'Progress', route: 'components/progress' },
            { id: 'comp-snackbar', label: 'Snackbar', route: 'components/snackbar' },
            { id: 'comp-tooltip', label: 'Tooltip', route: 'components/tooltip' },
          ],
        },
        { id: 'comp-list', label: 'List', route: 'components/list' },
        { id: 'comp-data-table', label: 'Data Table', route: 'components/data-table' },
        {
          id: 'comp-utilities',
          label: 'Utilities',
          children: [
            { id: 'comp-elevation', label: 'Elevation', route: 'components/elevation' },
            { id: 'comp-ripple', label: 'Ripple', route: 'components/ripple' },
            { id: 'comp-focus-ring', label: 'Focus Ring', route: 'components/focus-ring' },
          ],
        },
      ],
    },
    {
      id: 'features',
      label: 'Features',
      icon: 'auto_awesome',
      route: 'features',
      children: [
        { id: 'feat-data-table', label: 'Data Table', route: 'features/data-table' },
        { id: 'feat-search', label: 'Search', route: 'features/search' },
        { id: 'feat-charts', label: 'Charts', route: 'features/charts' },
        { id: 'feat-empty-states', label: 'Empty States', route: 'features/empty-states' },
        { id: 'feat-notifications', label: 'Notifications', route: 'features/notifications' },
        { id: 'feat-keyboard', label: 'Keyboard Shortcuts', route: 'features/keyboard' },
        { id: 'feat-theme', label: 'Theme Switcher', route: 'features/theme' },
        { id: 'feat-export', label: 'Export System', route: 'features/export' },
        { id: 'feat-voice', label: 'Voice Commands', route: 'features/voice' },
        { id: 'feat-form-builder', label: 'Form Builder', route: 'features/form-builder' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'settings',
    },
  ];

  // ── Component Categories (for side panel) ──
  componentCategories: ComponentCategory[] = [
    {
      name: 'Actions', icon: 'touch_app',
      components: [
        { name: 'Button', selector: 'buttons', status: 'ready' },
        { name: 'Icon Button', selector: 'icon-buttons', status: 'ready' },
        { name: 'FAB', selector: 'fab', status: 'ready' },
      ],
    },
    {
      name: 'Selection', icon: 'check_box',
      components: [
        { name: 'Checkbox', selector: 'checkbox', status: 'ready' },
        { name: 'Radio', selector: 'radio', status: 'ready' },
        { name: 'Switch', selector: 'switch', status: 'ready' },
        { name: 'Slider', selector: 'slider', status: 'ready' },
      ],
    },
    {
      name: 'Text Fields', icon: 'text_fields',
      components: [
        { name: 'Input (Outlined)', selector: 'input-outlined', status: 'ready' },
        { name: 'Input (Filled)', selector: 'input-filled', status: 'ready' },
        { name: 'Select', selector: 'select', status: 'ready' },
      ],
    },
    {
      name: 'Containment', icon: 'crop_square',
      components: [
        { name: 'Card', selector: 'cards', status: 'ready' },
        { name: 'Dialog', selector: 'dialog', status: 'ready' },
        { name: 'Divider', selector: 'divider', status: 'ready' },
        { name: 'Bottom Sheet', selector: 'bottom-sheet', status: 'wip' },
      ],
    },
    {
      name: 'Navigation', icon: 'menu',
      components: [
        { name: 'Tabs', selector: 'tabs', status: 'ready' },
        { name: 'Top App Bar', selector: 'top-app-bar', status: 'ready' },
        { name: 'Navigation Rail', selector: 'nav-rail', status: 'ready' },
        { name: 'Navigation Drawer', selector: 'nav-drawer', status: 'wip' },
        { name: 'Menu', selector: 'menu', status: 'ready' },
      ],
    },
    {
      name: 'Communication', icon: 'chat',
      components: [
        { name: 'Badge', selector: 'badge', status: 'ready' },
        { name: 'Chip', selector: 'chips', status: 'ready' },
        { name: 'Progress', selector: 'progress', status: 'ready' },
        { name: 'Snackbar', selector: 'snackbar', status: 'wip' },
        { name: 'Tooltip', selector: 'tooltip', status: 'wip' },
      ],
    },
    {
      name: 'Data Display', icon: 'list',
      components: [
        { name: 'List', selector: 'list', status: 'ready' },
        { name: 'Data Table', selector: 'data-table', status: 'missing' },
      ],
    },
    {
      name: 'Utilities', icon: 'build',
      components: [
        { name: 'Elevation', selector: 'elevation', status: 'ready' },
        { name: 'Ripple', selector: 'ripple', status: 'ready' },
        { name: 'Focus Ring', selector: 'focus-ring', status: 'ready' },
      ],
    },
  ];

  ngOnInit(): void {
    document.documentElement.classList.toggle('dark-theme', this.darkMode());
    const saved = localStorage.getItem('m3-theme');
    if (saved) {
      this.darkMode.set(saved === 'dark');
      document.documentElement.classList.toggle('dark-theme', this.darkMode());
    }

    // Sprint 022 — sync currentRoute signal with Angular Router navigation events
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Strip leading slash and use first segment as page key
        const path = event.urlAfterRedirects.replace(/^\//, '');
        this.currentRoute.set(path || 'dashboard');
        // Sync nav rail active item
        const segment = path.split('/')[0] || 'dashboard';
        this.activeItemId.set(segment);
      }
    });

    // Set initial route from current URL
    const initialPath = this.router.url.replace(/^\//, '') || 'dashboard';
    this.currentRoute.set(initialPath);
    this.activeItemId.set(initialPath.split('/')[0] || 'dashboard');
  }

  get today(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  get totalComponents(): number {
    return this.componentCategories.reduce((sum, cat) => sum + cat.components.length, 0);
  }

  get readyComponents(): number {
    return this.componentCategories.reduce(
      (sum, cat) => sum + cat.components.filter((c) => c.status === 'ready').length, 0);
  }

  get wipComponents(): number {
    return this.componentCategories.reduce(
      (sum, cat) => sum + cat.components.filter((c) => c.status === 'wip').length, 0);
  }

  get missingComponents(): number {
    return this.componentCategories.reduce(
      (sum, cat) => sum + cat.components.filter((c) => c.status === 'missing').length, 0);
  }

  // ── Navigation Handlers ──
  onNavigate(event: NavRailNavigationEvent): void {
    this.activeItemId.set(event.item.id);

    // Sprint 022 — use Angular Router for navigation (route-level code splitting)
    const parts = event.route.split('/');
    const page = parts[0] || 'dashboard';

    this.router.navigate([page]).then(() => {
      // Handle deep-link scroll after navigation resolves
      if (parts.length > 1) {
        const subId = parts[1];
        setTimeout(() => {
          const el = document.getElementById(
            page === 'components' ? 'comp-' + subId : 'feat-' + subId
          );
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (page === 'components') this.activeComponent.set(subId);
        }, 150);
      }
    });
  }

  onDarkModeChange(isDark: boolean): void {
    this.darkMode.set(isDark);
    document.documentElement.classList.toggle('dark-theme', isDark);
  }

  onNavExpand(expanded: boolean): void {
    this.navExpanded.set(expanded);
  }

  scrollToComponent(selector: string): void {
    this.activeComponent.set(selector);
    setTimeout(() => {
      const el = document.getElementById('comp-' + selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
