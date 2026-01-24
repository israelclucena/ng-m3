import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ChipComponent } from './chip.component';
import '../../material/material-web';

const meta: Meta<ChipComponent> = {
  title: 'Core/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['assist', 'filter', 'input', 'suggestion'],
      description: 'Chip variant',
    },
    label: { control: 'text' },
    elevated: { control: 'boolean' },
    disabled: { control: 'boolean' },
    selected: { control: 'boolean' },
    removable: { control: 'boolean' },
    icon: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ChipComponent>;

// --- Assist Chip ---
export const AssistChip: Story = {
  args: {
    variant: 'assist',
    label: 'Add to calendar',
    icon: 'event',
  },
};

// --- Filter Chip ---
export const FilterChip: Story = {
  args: {
    variant: 'filter',
    label: 'Vegetarian',
    selected: true,
    icon: 'check',
  },
};

// --- Input Chip ---
export const InputChip: Story = {
  args: {
    variant: 'input',
    label: 'John Doe',
    removable: true,
    icon: 'person',
  },
};

// --- Suggestion Chip ---
export const SuggestionChip: Story = {
  args: {
    variant: 'suggestion',
    label: 'Try "pasta"',
    icon: 'restaurant',
  },
};

// --- Chip Set (all variants) ---
export const ChipSet: Story = {
  render: () => ({
    template: `
      <md-chip-set style="display: flex; gap: 8px; flex-wrap: wrap;">
        <iu-chip variant="assist" label="Add to calendar" icon="event"></iu-chip>
        <iu-chip variant="filter" label="Vegetarian" [selected]="true"></iu-chip>
        <iu-chip variant="filter" label="Vegan" [selected]="false"></iu-chip>
        <iu-chip variant="input" label="John" icon="person"></iu-chip>
        <iu-chip variant="suggestion" label="Try pasta" icon="restaurant"></iu-chip>
        <iu-chip variant="assist" label="Elevated" [elevated]="true" icon="star"></iu-chip>
        <iu-chip variant="assist" label="Disabled" [disabled]="true" icon="block"></iu-chip>
      </md-chip-set>
    `,
  }),
};
