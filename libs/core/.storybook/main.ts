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
 */
import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {
      angularBrowserTarget: 'demo:build',
    },
  },
  features: {
    // 10.4.0-alpha: explicit Angular change detection mode in stories
    // Allows stories to declare `changeDetection: ChangeDetectionStrategy.OnPush`
    // Works with ZONELESS_MODE — validates CD-agnostic rendering
    angularChangeDetection: true,
  },
  staticDirs: ['.', { from: '../../apps/dashboard/public', to: '/' }],
};

export default config;
