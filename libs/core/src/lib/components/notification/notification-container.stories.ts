import type { Meta, StoryObj } from '@storybook/angular';
import { NotificationContainerComponent } from '@israel-ui/core';

const meta: Meta<NotificationContainerComponent> = {
  title: 'Components/NotificationContainer',
  component: NotificationContainerComponent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<NotificationContainerComponent>;

export const Default: Story = {};

export const InPage: Story = {
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="height:300px;position:relative;padding:1rem;">
        <p>Notifications appear here when triggered via NotificationService</p>
        <iu-notification-container />
      </div>`,
    }),
  ],
};

export const DarkContainer: Story = {
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="height:300px;position:relative;background:#1c1b1f;color:#fff;padding:1rem;">
        <p>Dark mode container</p>
        <iu-notification-container />
      </div>`,
    }),
  ],
};
