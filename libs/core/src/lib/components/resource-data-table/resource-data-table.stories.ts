import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { ResourceDataTableComponent, ResourceRef } from './resource-data-table.component';
import { DataTableV2Column } from '../data-table-v2/data-table-v2.component';

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  address: string;
  type: string;
  rent: number;
  status: string;
}

const mockProperties: Property[] = [
  { id: '1', address: 'Rua Augusta 123', type: 'Apartment', rent: 1200, status: 'Available' },
  { id: '2', address: 'Av. da Liberdade 45', type: 'Studio',    rent: 850,  status: 'Rented' },
  { id: '3', address: 'Rua do Carmo 78',    type: 'Duplex',     rent: 2100, status: 'Available' },
  { id: '4', address: 'Praça do Comércio 3', type: 'Office',    rent: 3500, status: 'Maintenance' },
  { id: '5', address: 'Bairro Alto 99',     type: 'Apartment',  rent: 1050, status: 'Available' },
];

const columns: DataTableV2Column<Property>[] = [
  { key: 'address', label: 'Address',  sortable: true },
  { key: 'type',    label: 'Type',     sortable: true },
  { key: 'rent',    label: 'Rent (€)', sortable: true, align: 'right' },
  { key: 'status',  label: 'Status',   sortable: true },
];

// ─── Resource factories ───────────────────────────────────────────────────────

function makeStaticResource<T>(data: T): ResourceRef<T> {
  return {
    isLoading: () => false,
    error:     () => undefined,
    value:     () => data,
  };
}

function makeLoadingResource<T>(): ResourceRef<T> {
  return {
    isLoading: () => true,
    error:     () => undefined,
    value:     () => undefined,
  };
}

function makeErrorResource<T>(message: string): ResourceRef<T> {
  return {
    isLoading: () => false,
    error:     () => new Error(message),
    value:     () => undefined,
  };
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<ResourceDataTableComponent<Property>> = {
  title: 'Sprint 009/ResourceDataTable',
  component: ResourceDataTableComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Wrapper for DataTableV2 that accepts Angular `httpResource<T[]>` directly and manages loading/error/data states.',
      },
    },
  },
  argTypes: {
    pageSize: { control: { type: 'number', min: 5, max: 50 } },
  },
};

export default meta;
type Story = StoryObj<ResourceDataTableComponent<Property>>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Default: resource resolved with static data */
export const Default: Story = {
  args: {
    dataResource: makeStaticResource(mockProperties),
    columns,
    pageSize: 10,
  },
  parameters: {
    docs: { description: { story: 'Resource resolved — shows full DataTableV2 with property data.' } },
  },
};

/** Loading: resource is in loading state */
export const Loading: Story = {
  args: {
    dataResource: makeLoadingResource<Property[]>(),
    columns,
    pageSize: 5,
  },
  parameters: {
    docs: { description: { story: 'Resource is fetching — shows M3 LinearProgressIndicator and skeleton rows.' } },
  },
};

/** Error: resource failed to fetch */
export const Error: Story = {
  args: {
    dataResource: makeErrorResource<Property[]>('Network error: Failed to fetch /api/properties. Please check your connection.'),
    columns,
    pageSize: 10,
  },
  parameters: {
    docs: { description: { story: 'Resource threw an error — shows empty state with error message.' } },
  },
};
