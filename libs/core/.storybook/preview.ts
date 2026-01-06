// Storybook preview setup for core
// Ensure Material Web custom elements are defined (side-effect imports)
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
