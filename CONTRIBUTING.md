# Contributing to @israel-ui/core

Thanks for your interest in contributing! 🎉

## Development Setup

```bash
# Clone
git clone https://github.com/israelui/israel-ui.git
cd israel-ui

# Install dependencies
npm install

# Run Storybook
npx nx storybook core

# Run tests
npx nx test core

# Lint
npx nx lint core
```

## Component Guidelines

- **Standalone components** — no NgModules
- **Signals API** — use `input()`, `output()`, `computed()`, `signal()`
- **M3 spec compliance** — follow [Material Design 3](https://m3.material.io/) guidelines
- **ARIA** — every component must be accessible (keyboard nav, screen readers)
- **Stories** — every component needs a Storybook story with all variants
- **Tests** — unit tests for logic and interaction

## Naming Conventions

- Component selector: `iu-<name>` (e.g., `iu-button`, `iu-card`)
- Component class: `<Name>Component` (e.g., `ButtonComponent`)
- Files: `<name>.component.ts`, `<name>.component.html`, `<name>.component.scss`, `<name>.stories.ts`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(button): add loading state
fix(input): correct aria-invalid binding
docs: update README with new components
chore: update dependencies
```

## Branch Strategy

- `main` — stable, always green
- `feat/<name>` — feature branches
- `fix/<name>` — bug fix branches

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `nx lint core` and `nx test core` pass
4. Open a PR with a clear description
5. Request review

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
