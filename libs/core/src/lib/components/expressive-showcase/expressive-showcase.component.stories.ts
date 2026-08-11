import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ExpressiveShowcaseComponent } from '@israel-ui/core';

const meta: Meta<ExpressiveShowcaseComponent> = {
  title: 'Theme/ExpressiveShowcase',
  component: ExpressiveShowcaseComponent,
  decorators: [moduleMetadata({ imports: [ExpressiveShowcaseComponent] })],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    paletteKey: {
      control: 'select',
      options: ['vibrant', 'citrus', 'bloom'],
    },
    mode: {
      control: 'inline-radio',
      options: ['expressive', 'baseline'],
    },
  },
};
export default meta;
type Story = StoryObj<ExpressiveShowcaseComponent>;

export const Default: Story = {
  args: { paletteKey: 'vibrant', mode: 'expressive' },
};

export const Citrus: Story = {
  args: { paletteKey: 'citrus', mode: 'expressive' },
};

export const Bloom: Story = {
  args: { paletteKey: 'bloom', mode: 'expressive' },
};

/** The tame baseline M3 treatment — same surfaces, no Expressive shape/motion. */
export const Baseline: Story = {
  args: { paletteKey: 'vibrant', mode: 'baseline' },
};

/**
 * A/B side-by-side — the same surface rendered baseline (left) and Expressive
 * (right) so the difference can be judged at a glance before ratifying the
 * `M3_EXPRESSIVE_THEME` flag.
 */
export const SideBySide: Story = {
  parameters: { layout: 'padded' },
  args: { paletteKey: 'vibrant' },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex; gap:32px; flex-wrap:wrap; align-items:flex-start;">
        <iu-expressive-showcase mode="baseline" [paletteKey]="paletteKey" />
        <iu-expressive-showcase mode="expressive" [paletteKey]="paletteKey" />
      </div>
    `,
  }),
};
