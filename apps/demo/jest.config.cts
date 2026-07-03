module.exports = {
  displayName: 'demo',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/demo',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  // @material/web + lit ship ESM `.js` that jest must transform. With pnpm the
  // same package appears twice in a path (`.pnpm/@material+web@x/node_modules/
  // @material/web/...`), so exempt both the store form and the linked form.
  transformIgnorePatterns: [
    'node_modules/(?!' +
      '\\.pnpm/(?:@material\\+web|@lit\\+|@lit-labs\\+|lit@|lit-html@|lit-element@)' +
      '|@material/web|@lit/|@lit-labs/|lit/|lit-html/|lit-element/' +
      '|.*\\.mjs$' +
      ')',
  ],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
