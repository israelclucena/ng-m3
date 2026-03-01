import type { Meta, StoryObj } from '@storybook/angular';
import { ExportToolbarComponent } from '@israel-ui/core';

const meta: Meta<ExportToolbarComponent> = {
  title: 'Components/ExportToolbar',
  component: ExportToolbarComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<ExportToolbarComponent>;

export const Default: Story = {
  args: {
    filename: 'israel-ui-dashboard',
  },
};

export const CustomFilename: Story = {
  args: {
    filename: 'monthly-report-2026',
  },
};

export const ShortName: Story = {
  args: {
    filename: 'data',
  },
};
