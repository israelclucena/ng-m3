import type { Meta, StoryObj } from '@storybook/angular';
import { PropertyInspectionComponent } from '@israel-ui/core';

const meta: Meta<PropertyInspectionComponent> = {
  title: 'LisboaRent/PropertyInspection',
  component: PropertyInspectionComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    role: { control: 'radio', options: ['tenant', 'landlord', 'inspector'] },
  },
};

export default meta;
type Story = StoryObj<PropertyInspectionComponent>;

/** Landlord view — shows signed move-in + in-progress routine inspection with room editing */
export const Default: Story = {
  args: { role: 'landlord' },
};

/** Tenant perspective of the same inspections */
export const TenantView: Story = {
  args: { role: 'tenant', propertyId: 'prop-001' },
};

/** Inspector role — same UI, can edit conditions and complete inspections */
export const InspectorView: Story = {
  args: { role: 'inspector', propertyId: 'prop-001' },
};
