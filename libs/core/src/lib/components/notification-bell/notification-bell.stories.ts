import type { Meta, StoryObj } from '@storybook/angular';
import { NotificationBellComponent } from '@israel-ui/core';
import { NotificationBellService } from './notification-bell.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { applicationConfig } from '@storybook/angular';

const meta: Meta<NotificationBellComponent> = {
  title: 'Sprint 018/NotificationBell',
  component: NotificationBellComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [NotificationBellService],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Header bell icon with animated badge and dropdown notification panel. ' +
          'Signals-based, integrates with NotificationBellService.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<NotificationBellComponent>;

/** Default bell with unread notifications (seeded). */
export const Default: Story = {};

/** Bell with all notifications already read (manually set unreadCount to 0). */
export const AllRead: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationBellService,
          useFactory: () => {
            const svc = new NotificationBellService();
            svc.markAllRead();
            return svc;
          },
        },
      ],
    }),
  ],
};

/** Bell with no notifications at all (empty panel). */
export const Empty: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: NotificationBellService,
          useFactory: () => {
            const svc = new NotificationBellService();
            // Dismiss all seeded notifications
            ['n1', 'n2', 'n3', 'n4'].forEach(id => svc.dismiss(id));
            return svc;
          },
        },
      ],
    }),
  ],
};
