[![CI](https://github.com/israelclucena/ng-m3/actions/workflows/ci.yml/badge.svg)](https://github.com/israelclucena/ng-m3/actions/workflows/ci.yml)
[![Storybook](https://github.com/israelclucena/ng-m3/actions/workflows/storybook.yml/badge.svg)](https://github.com/israelclucena/ng-m3/actions/workflows/storybook.yml)

<p align="center">
  <img src="https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/design_services/default/48px.svg" alt="israel-ui logo" width="64" height="64">
</p>

<h1 align="center">@israel-ui/core</h1>

<p align="center">
  <strong>Angular Design System · Material Design 3 · @material/web</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/angular-20-DD0031?logo=angular" alt="Angular 20">
  <img src="https://img.shields.io/badge/material_design-3-6750A4?logo=materialdesign" alt="Material Design 3">
  <img src="https://img.shields.io/badge/nx-monorepo-143055?logo=nx" alt="Nx Monorepo">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
  <img src="https://img.shields.io/badge/components-20+-blue" alt="20+ components">
</p>

---

## ✨ Overview

**@israel-ui/core** is a professional Angular design system built on top of [Material Design 3](https://m3.material.io/) and Google's [`@material/web`](https://github.com/nickmccurdy/material-web) web components. It provides 20+ production-ready components with full Signal-based APIs, Storybook documentation, and M3 token theming.

## 📦 Components

### 🎯 Actions
| Component | Description | Status |
|-----------|-------------|--------|
| `iu-button` | Elevated, filled, tonal, outlined, text | ✅ |
| `iu-icon-button` | Standard, filled, tonal, outlined | ✅ |
| `iu-fab` | FAB & small/large extended variants | ✅ |

### 📝 Inputs & Selection
| Component | Description | Status |
|-----------|-------------|--------|
| `iu-input` | Text, email, password, search | ✅ |
| `iu-checkbox` | Checkbox with indeterminate | ✅ |
| `iu-radio` | Radio button groups | ✅ |
| `iu-switch` | Toggle switch | ✅ |
| `iu-select` | Dropdown select | ✅ |
| `iu-slider` | Continuous & discrete slider | ✅ |
| `iu-chip` | Assist, filter, input, suggestion | ✅ |

### 📐 Layout & Structure
| Component | Description | Status |
|-----------|-------------|--------|
| `iu-card` | Elevated, filled, outlined | ✅ |
| `iu-divider` | Horizontal & vertical | ✅ |
| `iu-dialog` | Basic, full-screen, confirmation | ✅ |
| `iu-list` | Lists & list items | ✅ |
| `iu-menu` | Menu & menu items | ✅ |
| `iu-tabs` | Primary & secondary tabs | ✅ |

### 💫 Feedback
| Component | Description | Status |
|-----------|-------------|--------|
| `iu-progress` | Linear & circular progress | ✅ |

### 🔧 Utilities
| Component | Description | Status |
|-----------|-------------|--------|
| `iu-elevation` | M3 elevation surface tints | ✅ |
| `iu-ripple` | Touch ripple effect | ✅ |
| `iu-focus-ring` | Keyboard focus indicator | ✅ |

## 🚀 Quick Start

```bash
# Install
npm install @israel-ui/core

# Import in your Angular component
import { ButtonComponent, CardComponent } from '@israel-ui/core';

@Component({
  imports: [ButtonComponent, CardComponent],
  template: `
    <iu-card variant="elevated">
      <iu-button variant="filled" label="Click me" />
    </iu-card>
  `,
})
export class MyComponent {}
```

## 📖 Storybook

```bash
# Run Storybook locally
npx nx storybook core

# Build static Storybook
npx nx build-storybook core
```

## 🏗️ Tech Stack

- **Angular 20** — Standalone components, Signals API
- **Nx** — Monorepo tooling, build caching, task orchestration
- **@material/web** — Google's official Material Design 3 web components
- **Storybook 8** — Component documentation & visual testing
- **TypeScript 5.8** — Strict mode, latest features

## 🎨 Theming

All components use M3 design tokens. Customise via CSS custom properties:

```css
:root {
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-surface: #FFFBFE;
  /* ... full M3 token palette */
}
```

## 📁 Project Structure

```
israel-ui/
├── apps/
│   └── demo/              # Demo Angular app
├── libs/
│   └── core/              # @israel-ui/core library
│       └── src/lib/
│           ├── components/ # All UI components
│           ├── core/       # Core module & config
│           ├── material/   # @material/web imports
│           └── tokens/     # M3 theme tokens
├── nx.json
└── package.json
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © Israel Lucena
