// Storybook preview setup for core
// Ensure ALL Material Web custom elements are defined (side-effect imports)
// Note: individual component files only import what they need (tree-shaking).
// Storybook needs all registered for the component catalog.
import '../src/lib/material/material-web';
import '../src/index';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
  backgrounds: {
    default: 'surface',
    values: [
      { name: 'surface', value: '#FEF7FF' },
      { name: 'surface-container', value: '#F3EDF7' },
      { name: 'white', value: '#FFFFFF' },
      { name: 'dark', value: '#1D1B20' },
    ],
  },
  layout: 'padded',
};
