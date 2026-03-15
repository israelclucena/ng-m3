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
  staticDirs: ['.', { from: '../../apps/dashboard/public', to: '/' }],
};

export default config;
