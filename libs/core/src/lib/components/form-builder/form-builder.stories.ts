import type { Meta, StoryObj } from '@storybook/angular';
import { FormBuilderComponent } from '@israel-ui/core';

const meta: Meta<FormBuilderComponent> = {
  title: 'Components/FormBuilder',
  component: FormBuilderComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<FormBuilderComponent>;

export const Default: Story = {
  args: {
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', validation: { required: true } },
      { key: 'email', label: 'Email', type: 'email', validation: { required: true } },
    ],
  },
};

export const WithSelect: Story = {
  args: {
    fields: [
      { key: 'name', label: 'Name', type: 'text', validation: { required: true } },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Editor', value: 'editor' },
          { label: 'Viewer', value: 'viewer' },
        ],
      },
      { key: 'bio', label: 'Biography', type: 'textarea' },
    ],
  },
};

export const WithToggle: Story = {
  args: {
    fields: [
      { key: 'notifications', label: 'Enable Notifications', type: 'toggle' },
      { key: 'darkMode', label: 'Dark Mode', type: 'toggle' },
    ],
  },
};
