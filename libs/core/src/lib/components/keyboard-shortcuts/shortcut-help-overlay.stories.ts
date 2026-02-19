import type { Meta, StoryObj } from '@storybook/angular';
import { ShortcutHelpOverlayComponent } from '@israel-ui/core';

const meta: Meta<ShortcutHelpOverlayComponent> = {
  title: 'Components/ShortcutHelpOverlay',
  component: ShortcutHelpOverlayComponent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<ShortcutHelpOverlayComponent>;

export const Default: Story = {};

export const InContainer: Story = {
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="height:400px;position:relative;background:#f5f5f5;padding:1rem;">
        <p>Press <kbd>?</kbd> to toggle the overlay</p>
        <iu-shortcut-help-overlay />
      </div>`,
    }),
  ],
};

export const DarkBackground: Story = {
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="height:400px;position:relative;background:#1c1b1f;color:#fff;padding:1rem;">
        <p>Press <kbd>?</kbd> to toggle</p>
        <iu-shortcut-help-overlay />
      </div>`,
    }),
  ],
};
