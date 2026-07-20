import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'lib',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          // Real convention in this lib is `iu-` (israel-ui); `story*`/`sb-`
          // are Storybook-only helper components. The historical `lib` prefix
          // never matched the codebase, so this rule was ~167 false errors.
          prefix: ['iu', 'lib', 'story', 'storybook', 'sb'],
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // `iu-switch`/`iu-radio`/`iu-checkbox` wrap Material Web form-associated
      // custom elements (`md-switch`/`md-radio`/`md-checkbox`) inside a
      // `<label>` — the intended M3 pattern (clicking the text toggles the
      // control). The linter doesn't know these custom elements are controls,
      // so it flags a false positive. Whitelisting them as control components
      // keeps the a11y check meaningful while recognising the real controls.
      '@angular-eslint/template/label-has-associated-control': [
        'error',
        {
          controlComponents: ['md-switch', 'md-radio', 'md-checkbox'],
        },
      ],
    },
  },
];
