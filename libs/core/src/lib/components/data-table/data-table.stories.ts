import type { Meta, StoryObj } from '@storybook/angular';
import { DataTableComponent } from '@israel-ui/core';

interface User {
  name: string;
  email: string;
  role: string;
  status: string;
}

const sampleData: User[] = [
  { name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { name: 'Bob', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { name: 'Charlie', email: 'charlie@example.com', role: 'Viewer', status: 'Inactive' },
  { name: 'Diana', email: 'diana@example.com', role: 'Editor', status: 'Active' },
  { name: 'Eve', email: 'eve@example.com', role: 'Admin', status: 'Active' },
];

const meta: Meta<DataTableComponent<User>> = {
  title: 'Components/DataTable',
  component: DataTableComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<DataTableComponent<User>>;

export const Default: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', sortable: true },
      { key: 'status', label: 'Status' },
    ],
    data: sampleData,
  },
};

export const Filterable: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ],
    data: sampleData,
    filterable: true,
    filterPlaceholder: 'Filter users...',
  },
};

export const SmallPage: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
    ],
    data: sampleData,
    paginated: true,
    pageSize: 2,
    emptyMessage: 'No users found',
  },
};
