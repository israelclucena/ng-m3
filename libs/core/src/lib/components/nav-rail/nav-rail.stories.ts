import type { Meta, StoryObj } from '@storybook/angular';
import { NavRailComponent, NavRailItem } from './nav-rail.component';

const defaultItems: NavRailItem[] = [
  { icon: 'home', label: 'Home', active: true },
  { icon: 'search', label: 'Search' },
  { icon: 'favorite', label: 'Favorites' },
  { icon: 'person', label: 'Profile' },
];

const meta: Meta<NavRailComponent> = {
  title: 'Core/NavRail',
  component: NavRailComponent,
  tags: ['autodocs'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  argTypes: {
    menuIcon: { control: 'text' },
    fabIcon: { control: 'text' },
    fabLabel: { control: 'text' },
    alignment: {
      control: 'select',
      options: ['top', 'center', 'bottom'],
    },
  } as any,
  decorators: [
    (story) => ({
      ...story,
      template: `<div style="height: 600px; display: flex;">${(story as any).template || ''}</div>`,
    }),
  ],
};

export default meta;
type Story = StoryObj<NavRailComponent>;

export const Default: Story = {
  args: {
    items: defaultItems,
  },
};

export const WithFAB: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    items: defaultItems,
    fabIcon: 'edit',
  } as any,
};

export const WithMenu: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    items: defaultItems,
    menuIcon: 'menu',
    fabIcon: 'add',
  } as any,
};

export const WithBadges: Story = {
  args: {
    items: [
      { icon: 'home', label: 'Home', active: true },
      { icon: 'mail', label: 'Mail', badge: 3 },
      { icon: 'chat', label: 'Chat', badge: true },
      { icon: 'person', label: 'Profile', badge: '99+' },
    ],
    fabIcon: 'edit',
  },
};
