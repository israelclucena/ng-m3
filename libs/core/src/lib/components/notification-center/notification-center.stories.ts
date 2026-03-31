/**
 * @fileoverview Storybook stories for NotificationCenterComponent — Sprint 036
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NotificationCenterComponent } from './notification-center.component';

const meta: Meta<NotificationCenterComponent> = {
  title: 'Notifications/NotificationCenter',
  component: NotificationCenterComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<NotificationCenterComponent>;

/** Embedded (no overlay/trigger) — shows full list */
export const Default: Story = {
  args: { embedded: true },
};

/** Trigger button — click to open the drawer */
export const WithTrigger: Story = {
  args: { embedded: false },
  parameters: {
    docs: {
      description: {
        story: 'Click the bell button to open the notification center drawer.',
      },
    },
  },
};

/** Embedded in a container to simulate sidebar placement */
export const EmbeddedInPanel: Story = {
  args: { embedded: true },
  decorators: [
    (storyFn) => ({
      ...storyFn(),
      template: `
        <div style="max-width: 420px; border-radius: 16px; overflow: hidden;">
          <iu-notification-center [embedded]="true" />
        </div>`,
    }),
  ],
};
