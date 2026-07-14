/**
 * Storybook main configuration — @israelclucena/core
 *
 * Upgraded to 10.4.0-alpha.5 in Sprint 033 (Night Shift 2026-03-28).
 * Enables the `changeDetection` feature flag introduced in 10.4.0-alpha:
 * - Stories can explicitly declare OnPush vs Default change detection
 * - Aligns with ZONELESS_MODE (provideExperimentalZonelessChangeDetection)
 * - Relevant for validating that all components work correctly without Zone.js
 *
 * Feature flag: STORYBOOK_PATCH_1040
 *
 * Builder: migrated webpack -> Vite via `@storybook/angular-vite` (Night Shift
 * 2026-07-14). The legacy `@storybook/angular` webpack builder crashed on
 * `build-storybook` (BABEL "Requires ^7.0.0-0, loaded with 8.0.1" — @babel/core
 * hoisted to 8.x by jest/ts-jest conflicting with the devkit webpack babel
 * loader). The Vite builder uses `@analogjs/vite-plugin-angular` instead of the
 * webpack babel chain, sidestepping the conflict. Targets `storybook`/
 * `build-storybook` now run the generic Storybook CLI via nx:run-commands
 * (browserTarget/compodoc are webpack-only concepts, dropped).
 */
import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular-vite',
    options: {},
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: {
    // 10.4.0-alpha: explicit Angular change detection mode in stories
    // Allows stories to declare `changeDetection: ChangeDetectionStrategy.OnPush`
    // Works with ZONELESS_MODE — validates CD-agnostic rendering
    angularChangeDetection: true,
  } as any,
  staticDirs: ['.', { from: '../../../apps/dashboard/public', to: '/' }],
};

export default config;
