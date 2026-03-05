# @israelclucena/core

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/israelclucena/ng-m3/packages)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21%2B-red.svg)](https://angular.dev)
[![Material 3](https://img.shields.io/badge/Material%203-Design%20Tokens-purple.svg)](https://m3.material.io)

**Israel UI** — A comprehensive Angular component library built on Material Design 3 (M3) tokens. Standalone components, Angular Signals only, zero NgModule.

---

## 📦 Installation

```bash
npm install @israelclucena/core
```

> Requires Angular 17+ and a project configured with M3 CSS design tokens (`--md-sys-*` variables).

---

## 🧩 Components

### Sprint 001 — Foundation
| Component | Description |
|-----------|-------------|
| 🔘 `ButtonComponent` | M3-compliant button with filled, outlined, text, elevated, and tonal variants |
| 📝 `InputComponent` | Text input with M3 styling and validation states |
| 🃏 `CardComponent` | Surface card with elevation support |
| 💬 `DialogComponent` | Modal dialog with M3 motion |
| 🏷️ `ChipComponent` | Assist, filter, input, and suggestion chips |
| ➖ `DividerComponent` | Horizontal/vertical divider with optional inset |

### Sprint 002 — Selection & Actions
| Component | Description |
|-----------|-------------|
| ☑️ `CheckboxComponent` | M3 checkbox with indeterminate state |
| 🔵 `RadioComponent` | Radio button group |
| 🔄 `SwitchComponent` | Toggle switch |
| 🔲 `IconButtonComponent` | Icon-only button (standard, filled, outlined, tonal) |
| ⭕ `FabComponent` | Floating action button (small, regular, large, extended) |
| ⏳ `ProgressComponent` | Linear and circular progress indicators |
| 📋 `SelectComponent` | Dropdown select with M3 styling |
| 📜 `MenuComponent` | Context menu and dropdown menu |
| 📄 `ListComponent` + `ListItemComponent` | List with leading/trailing content |
| 📑 `TabsComponent` | Primary and secondary tabs |
| 🎚️ `SliderComponent` | Continuous and discrete sliders |
| 🔝 `TopAppBarComponent` | Small, medium, large, and center-aligned top app bars |
| 🚂 `NavRailComponent` | Navigation rail for medium/large screens |
| 🔴 `BadgeComponent` | Notification badge (dot, small, large) |
| 🍞 `SnackbarComponent` + `SnackbarService` | Toast notifications |
| 💡 `TooltipDirective` | Rich and plain tooltips |
| 📋 `BottomSheetComponent` | Modal bottom sheet |
| 🗂️ `NavDrawerComponent` | Navigation drawer (modal and standard) |

### Sprint 002 — Utilities
| Component | Description |
|-----------|-------------|
| 🌊 `ElevationComponent` | M3 elevation surface |
| 💧 `RippleComponent` | Material ripple effect |
| 🎯 `FocusRingComponent` | Accessibility focus ring |

### Sprint 003 — Cards & Notifications
| Component | Description |
|-----------|-------------|
| 📊 `StatCardComponent` | KPI/metric card with trend indicator |
| 👤 `ProfileCardComponent` | User profile card with avatar and actions |
| ⚡ `ActionCardComponent` | Card with primary action button |
| 🔔 `NotificationService` + `NotificationContainerComponent` | In-app notification system |
| 🎨 `ThemeService` | Dynamic M3 theme switching (light/dark/custom) |

### Sprint 004 — Data & Search
| Component | Description |
|-----------|-------------|
| 📊 `DataTableComponent` | Sortable, paginated data table with M3 styling |
| 🔍 `SearchComponent` | Search with autocomplete suggestions |
| 🗳️ `EmptyStateComponent` | Empty state illustration with CTA |
| ⌨️ `KeyboardShortcutService` + `ShortcutHelpOverlayComponent` | Global keyboard shortcut manager |

### Sprint 005 — Charts & Export
| Component | Description |
|-----------|-------------|
| 📈 `BarChartComponent` | Pure SVG bar chart, no external deps |
| 📉 `LineChartComponent` | Pure SVG line/area chart |
| 🥧 `DonutChartComponent` | Pure SVG donut chart |
| 📤 `ExportService` + `ExportToolbarComponent` | CSV/PDF export utilities |
| 🎙️ `VoiceCommandService` + `VoiceWidgetComponent` | Web Speech API integration |

### Sprint 006 — Forms
| Component | Description |
|-----------|-------------|
| 🏗️ `FormBuilderComponent` | Dynamic form from JSON schema |

### Sprint 007 — Advanced Inputs
| Component | Description |
|-----------|-------------|
| 🧑 `AvatarComponent` | User avatar (image, initials, icon) |
| 🏷️ `TagInputComponent` | Multi-value tag/chip input |
| 🪜 `StepperComponent` | Horizontal/vertical stepper |
| 🕐 `TimelineComponent` | Vertical timeline with events |
| 📅 `DatePickerComponent` | M3 date picker with calendar |
| 🎨 `ColorPickerComponent` | Color selection with M3 palette |

### Sprint 008 — Data Management
| Component | Description |
|-----------|-------------|
| 📊 `DataTableV2Component` | Enhanced data table with virtual scroll and inline edit |
| 📦 `WidgetContainerComponent` | Resizable/draggable dashboard widget |

### Sprint 009 — Resources
| Component | Description |
|-----------|-------------|
| 📋 `ResourceDataTableComponent` | CRUD data table with API integration |
| 🔽 `FilterBarComponent` | Multi-filter bar for data tables |

---

## 🚀 Quick Start

### 1. Import a component

```typescript
import { Component } from '@angular/core';
import { ButtonComponent, CardComponent, DataTableComponent } from '@israelclucena/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ButtonComponent, CardComponent, DataTableComponent],
  template: `
    <lib-card>
      <h2>Welcome to Israel UI</h2>

      <lib-button variant="filled" (click)="onAction()">
        Get Started
      </lib-button>

      <lib-button variant="outlined">
        Learn More
      </lib-button>
    </lib-card>
  `
})
export class ExampleComponent {
  onAction() {
    console.log('Action!');
  }
}
```

### 2. DataTable example

```typescript
import { DataTableComponent } from '@israelclucena/core';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <lib-data-table
      [data]="users"
      [columns]="columns"
      [pageSizeOptions]="[10, 25, 50]"
    />
  `
})
export class UsersComponent {
  users: User[] = [
    { id: 1, name: 'Israel Lucena', email: 'israel@example.com' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
  ];

  columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
  ];
}
```

### 3. Named imports

```typescript
import {
  ButtonComponent,
  CardComponent,
  DataTableComponent,
  SearchComponent,
  ThemeService,
  SnackbarService,
} from '@israelclucena/core';
```

---

## 🎨 M3 Design Tokens

This library uses CSS custom properties from Material Design 3. Add the token stylesheet to your `angular.json` or `styles.scss`:

```scss
// styles.scss
@import '@material/material-color-utilities';

// Or use pre-built M3 tokens:
:root {
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-surface: #FFFBFE;
  /* ... full M3 token set */
}
```

---

## 📋 Requirements

- **Angular 17+** (tested on Angular 21)
- **Angular Signals** (used internally — no RxJS)
- **Standalone components** (no NgModules)
- **M3 CSS tokens** (`--md-sys-*` variables configured in your project)

---

## 📖 Storybook

Explore all components with live examples:

👉 [Open Storybook](/storybook)

---

## 📄 License

MIT © [Israel Lucena](https://github.com/israelclucena)
