/**
 * @fileoverview Storybook stories for ApplicationKanbanComponent — Sprint 036
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { ApplicationKanbanComponent } from './application-kanban.component';

const meta: Meta<ApplicationKanbanComponent> = {
  title: 'Application/ApplicationKanban',
  component: ApplicationKanbanComponent,
  tags: ['autodocs'],
  argTypes: {
    landlordId: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ApplicationKanbanComponent>;

/** Default board with landlord-001 seeded data */
export const Default: Story = {
  args: {
    landlordId: 'landlord-001',
  },
};

/** Board with a different landlord — empty state */
export const EmptyBoard: Story = {
  args: {
    landlordId: 'landlord-999',
  },
};

/** Board rendered wide for desktop */
export const DesktopView: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  args: {
    landlordId: 'landlord-001',
  },
};
