import type { Meta, StoryObj } from '@storybook/angular';
import { TagInputComponent } from '@israel-ui/core';

const TECH_SUGGESTIONS = [
  'Angular', 'TypeScript', 'JavaScript', 'RxJS', 'Node.js',
  'React', 'Vue', 'Svelte', 'CSS', 'SCSS', 'HTML',
  'NestJS', 'GraphQL', 'REST API', 'PostgreSQL', 'Firebase',
];

const meta: Meta<TagInputComponent> = {
  title: 'Sprint 007/TagInput',
  component: TagInputComponent,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
    maxTags: { control: 'number' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Add a skill...',
    suggestions: TECH_SUGGESTIONS,
    maxTags: 0,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<TagInputComponent>;

/**
 * Default — free-text tag creation, no suggestions.
 */
export const Default: Story = {
  args: {
    placeholder: 'Type and press Enter...',
    suggestions: [],
  },
};

/**
 * WithSuggestions — type to filter suggestions, click or press Enter to add.
 */
export const WithSuggestions: Story = {
  args: {
    placeholder: 'Add a skill...',
    suggestions: TECH_SUGGESTIONS,
    helperText: 'Type to filter. Press Enter or comma to add.',
  },
};

/**
 * WithMaxTags — limited to 3 tags.
 */
export const WithMaxTags: Story = {
  args: {
    placeholder: 'Add up to 3 tags...',
    suggestions: TECH_SUGGESTIONS,
    maxTags: 3,
    helperText: 'Maximum 3 tags allowed.',
  },
};
