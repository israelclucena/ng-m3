import type { Meta, StoryObj } from '@storybook/angular';
import { DataTableV2Component, DataTableV2Column, DataTableV2BulkAction } from './data-table-v2.component';

// ─── Sample data ──────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  role: string;
  status: string;
  joined: string;
  location: string;
}

const USERS: User[] = [
  { id: 1, name: 'Israel Lucena',  role: 'Frontend Dev',    status: 'Active',   joined: '2024-01', location: 'Lisbon' },
  { id: 2, name: 'Luana Silva',    role: 'Designer',        status: 'Active',   joined: '2024-02', location: 'Porto'  },
  { id: 3, name: 'Samuel Lucena',  role: 'Backend Dev',     status: 'Inactive', joined: '2023-11', location: 'Faro'   },
  { id: 4, name: 'Davi Costa',     role: 'Product Manager', status: 'Active',   joined: '2024-03', location: 'Braga'  },
  { id: 5, name: 'Eduardo Lucena', role: 'DevOps',          status: 'Active',   joined: '2023-08', location: 'Lisbon' },
  { id: 6, name: 'Wilma Santos',   role: 'QA Engineer',     status: 'Inactive', joined: '2023-06', location: 'Coimbra'},
  { id: 7, name: 'Ana Pereira',    role: 'Frontend Dev',    status: 'Active',   joined: '2024-01', location: 'Setúbal'},
  { id: 8, name: 'Carlos Mendes',  role: 'Backend Dev',     status: 'Active',   joined: '2023-12', location: 'Lisbon' },
];

const COLUMNS: DataTableV2Column<User>[] = [
  { key: 'id',       label: '#',        width: '60px',  align: 'center' },
  { key: 'name',     label: 'Name',     sortable: true },
  { key: 'role',     label: 'Role',     sortable: true },
  { key: 'status',   label: 'Status',   sortable: true },
  { key: 'joined',   label: 'Joined',   sortable: true },
  { key: 'location', label: 'Location', sortable: true },
];

const BULK_ACTIONS: DataTableV2BulkAction[] = [
  { id: 'export',   label: 'Export',    icon: 'download'  },
  { id: 'archive',  label: 'Archive',   icon: 'archive'   },
  { id: 'delete',   label: 'Delete',    icon: 'delete',   variant: 'danger' },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<DataTableV2Component<User>> = {
  title: 'Components/DataTableV2',
  component: DataTableV2Component,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Enhanced data table with multi-select, bulk actions toolbar, expandable rows, sorting, filtering, and pagination. Built with Angular Signals and M3 design tokens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<DataTableV2Component<User>>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Default — multi-select with bulk actions and expandable rows */
export const Default: Story = {
  args: {
    columns: COLUMNS,
    data: USERS,
    selectionMode: 'multi',
    bulkActions: BULK_ACTIONS,
    expandable: true,
    filterable: true,
    pageSize: 5,
    emptyMessage: 'No users found',
  },
};

/** SingleSelect — row click selects/deselects, no checkboxes */
export const SingleSelect: Story = {
  name: 'Single Select',
  args: {
    columns: COLUMNS,
    data: USERS,
    selectionMode: 'single',
    bulkActions: [],
    expandable: false,
    filterable: true,
    pageSize: 5,
  },
};

/** Compact — tighter row density, no pagination */
export const Compact: Story = {
  args: {
    columns: COLUMNS,
    data: USERS.slice(0, 4),
    selectionMode: 'multi',
    bulkActions: BULK_ACTIONS,
    expandable: false,
    filterable: false,
    pageSize: 0,
    compact: true,
  },
};
