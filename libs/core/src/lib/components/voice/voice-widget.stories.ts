import type { Meta, StoryObj } from '@storybook/angular';
import { VoiceWidgetComponent } from '@israel-ui/core';

const meta: Meta<VoiceWidgetComponent> = {
  title: 'Components/VoiceWidget',
  component: VoiceWidgetComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<VoiceWidgetComponent>;

export const Default: Story = {};

export const InContainer: Story = {
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="padding:2rem;background:#f5f5f5;border-radius:12px;">
        <iu-voice-widget />
      </div>`,
    }),
  ],
};

export const DarkBackground: Story = {
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="padding:2rem;background:#1c1b1f;border-radius:12px;">
        <iu-voice-widget />
      </div>`,
    }),
  ],
};
