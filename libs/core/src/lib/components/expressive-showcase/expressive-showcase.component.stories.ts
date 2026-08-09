import type { Meta, StoryObj } from '@storybook/angular';
import { ExpressiveShowcaseComponent } from '@israel-ui/core';

const meta: Meta<ExpressiveShowcaseComponent> = {
  title: 'Theme/ExpressiveShowcase',
  component: ExpressiveShowcaseComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    paletteKey: {
      control: 'select',
      options: ['vibrant', 'citrus', 'bloom'],
    },
  },
};
export default meta;
type Story = StoryObj<ExpressiveShowcaseComponent>;

export const Default: Story = {
  args: { paletteKey: 'vibrant' },
};

export const Citrus: Story = {
  args: { paletteKey: 'citrus' },
};

export const Bloom: Story = {
  args: { paletteKey: 'bloom' },
};
