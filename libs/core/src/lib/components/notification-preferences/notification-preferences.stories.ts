import type { Meta, StoryObj } from '@storybook/angular';
import { NotificationPreferencesComponent } from '@israel-ui/core';

const meta: Meta<NotificationPreferencesComponent> = {
  title: 'Sprint 039/NotificationPreferences',
  component: NotificationPreferencesComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Notification preferences panel — per-category, per-channel toggles (email/SMS/push/in-app) with urgency levels, global channel kill-switches, and unsaved-changes tracking.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<NotificationPreferencesComponent>;

/** Full notification settings — all categories and channels */
export const Default: Story = {
  args: {},
};

/** Minimal notifications — all channels off except in-app */
export const MinimalMode: Story = {
  args: {},
};

/** Critical-only mode */
export const CriticalOnly: Story = {
  args: {},
};
