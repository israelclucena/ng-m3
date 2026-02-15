import type { Meta, StoryObj } from '@storybook/angular';
import { ProfileCardComponent } from '@israel-ui/core';

const meta: Meta<ProfileCardComponent> = {
  title: 'Components/Cards/ProfileCard',
  component: ProfileCardComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<ProfileCardComponent>;

export const Default: Story = {
  args: {
    name: 'Israel Lucena',
    role: 'Frontend Developer',
    avatarIcon: 'person',
    stats: [
      { label: 'Projects', value: '12' },
      { label: 'Reviews', value: '48' },
    ],
  },
};

export const WithAvatar: Story = {
  args: {
    name: 'Jane Doe',
    role: 'Product Designer',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    stats: [
      { label: 'Designs', value: '34' },
      { label: 'Likes', value: '520' },
    ],
  },
};

export const Outlined: Story = {
  args: {
    name: 'John Smith',
    role: 'Backend Engineer',
    avatarIcon: 'engineering',
    cardVariant: 'outlined',
    stats: [],
  },
};
