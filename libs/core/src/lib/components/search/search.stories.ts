import type { Meta, StoryObj } from '@storybook/angular';
import { SearchComponent } from '@israel-ui/core';

const meta: Meta<SearchComponent> = {
  title: 'Components/Search',
  component: SearchComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<SearchComponent>;

export const Default: Story = {
  args: {
    placeholder: 'Search...',
    results: [],
    loading: false,
  },
};

export const WithResults: Story = {
  args: {
    placeholder: 'Search users...',
    results: [
      { id: "1", label: "Alice Johnson", icon: "person" },
      { id: "2", label: "Bob Smith", icon: "person" },
      { id: "3", label: "Project Alpha", icon: "folder" },
    ],
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    placeholder: 'Searching...',
    results: [],
    loading: true,
    minChars: 1,
  },
};
