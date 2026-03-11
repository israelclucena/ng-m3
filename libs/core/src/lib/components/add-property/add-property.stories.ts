import type { Meta, StoryObj } from '@storybook/angular';
import { AddPropertyComponent } from './add-property.component';

const meta: Meta<AddPropertyComponent> = {
  title: 'LisboaRent/AddProperty',
  component: AddPropertyComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<AddPropertyComponent>;

export const Default: Story = {
  args: {},
};

export const StepTwo: Story = {
  render: () => ({
    component: AddPropertyComponent,
    props: {},
    ngOnInit() {
      // Can't set step from outside (internal signal), so just render default
    },
  }),
  args: {},
};

export const StepThree: Story = {
  args: {},
};
