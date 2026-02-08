import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { NavDrawerComponent, NavDrawerItem } from './nav-drawer.component';

const sampleItems: NavDrawerItem[] = [
  { icon: 'inbox', label: 'Inbox', badge: '24', active: true },
  { icon: 'send', label: 'Outbox' },
  { icon: 'favorite', label: 'Favorites' },
  { icon: 'delete', label: 'Trash' },
];

const sectionItems: NavDrawerItem[] = [
  { section: 'Mail', label: '' },
  { icon: 'inbox', label: 'Inbox', badge: '24', active: true },
  { icon: 'send', label: 'Sent' },
  { icon: 'drafts', label: 'Drafts', badge: '3' },
  { section: 'Labels', label: '' },
  { icon: 'label', label: 'Work' },
  { icon: 'label', label: 'Personal' },
  { icon: 'label', label: 'Travel' },
];

const meta: Meta<NavDrawerComponent> = {
  title: 'Components/Navigation Drawer',
  component: NavDrawerComponent,
  decorators: [
    moduleMetadata({
      imports: [NavDrawerComponent],
    }),
  ],
  argTypes: {
    variant: { control: 'select', options: ['standard', 'modal'] },
    open: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<NavDrawerComponent>;

export const Standard: Story = {
  render: () => ({
    props: { items: sampleItems, open: true },
    template: `
      <iu-nav-drawer [open]="open" variant="standard" [items]="items" />
    `,
  }),
};

export const Modal: Story = {
  render: () => ({
    props: { items: sampleItems, open: true },
    template: `
      <iu-nav-drawer [open]="open" variant="modal" [items]="items" />
    `,
  }),
};

export const WithSections: Story = {
  render: () => ({
    props: { items: sectionItems, open: true },
    template: `
      <iu-nav-drawer [open]="open" variant="modal" [items]="items" />
    `,
  }),
};
