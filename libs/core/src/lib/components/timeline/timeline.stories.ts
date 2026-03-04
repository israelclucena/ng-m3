import type { Meta, StoryObj } from '@storybook/angular';
import { TimelineComponent, TimelineItem } from '@israel-ui/core';

const CAREER_ITEMS: TimelineItem[] = [
  {
    title: 'Frontend Developer',
    description: 'Joined startup as first frontend hire. Built the design system from scratch.',
    date: 'Jan 2024',
    icon: 'code',
    color: 'primary',
    active: true,
  },
  {
    title: 'Angular Migration',
    description: 'Led migration from AngularJS to Angular 17 + Signals.',
    date: 'Jun 2023',
    icon: 'build',
    color: 'success',
  },
  {
    title: 'Open Source Contributor',
    description: 'Merged first PR into Angular CDK repository.',
    date: 'Mar 2023',
    icon: 'star',
    color: 'warning',
  },
  {
    title: 'Bootcamp Graduate',
    description: 'Completed intensive full-stack bootcamp with top marks.',
    date: 'Nov 2022',
    icon: 'school',
  },
];

const RELEASE_ITEMS: TimelineItem[] = [
  { title: 'v3.0.0 Release', description: 'Major redesign with M3 tokens', date: 'Mar 2026', icon: 'rocket_launch', color: 'primary', active: true },
  { title: 'v2.5.0', description: 'Charts + Export system', date: 'Feb 2026', icon: 'bar_chart', color: 'success' },
  { title: 'v2.0.0', description: 'Form Builder + Voice', date: 'Jan 2026', icon: 'dynamic_form' },
  { title: 'v1.0.0', description: 'Initial release', date: 'Dec 2025', icon: 'flag' },
];

const meta: Meta<TimelineComponent> = {
  title: 'Sprint 007/Timeline',
  component: TimelineComponent,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    align: { control: 'select', options: ['start', 'alternate', 'end'] },
  },
  args: {
    items: CAREER_ITEMS,
    orientation: 'vertical',
    align: 'start',
  },
};

export default meta;
type Story = StoryObj<TimelineComponent>;

/**
 * Default — vertical timeline with start alignment.
 */
export const Default: Story = {};

/**
 * Alternate — items alternate left and right.
 */
export const Alternate: Story = {
  args: {
    align: 'alternate',
  },
};

/**
 * Horizontal — horizontal release history timeline.
 */
export const Horizontal: Story = {
  args: {
    items: RELEASE_ITEMS,
    orientation: 'horizontal',
  },
};
