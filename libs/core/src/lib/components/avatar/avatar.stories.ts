import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent, AvatarGroupComponent, AvatarGroupItem } from '@israel-ui/core';
import { Component, input } from '@angular/core';

// ─── Wrapper for AvatarGroup story ────────────────────────────────
@Component({
  selector: 'story-avatar-group-wrapper',
  standalone: true,
  imports: [AvatarGroupComponent],
  template: `<iu-avatar-group [avatars]="avatars" [max]="max" size="md" />`,
})
class AvatarGroupWrapper {
  avatars: AvatarGroupItem[] = [
    { name: 'Israel Lucena', online: true },
    { name: 'Luana Silva', online: true },
    { name: 'Samuel Lucena', online: false },
    { name: 'Davi Costa' },
    { name: 'Eduardo Lucena' },
    { name: 'Wilma Santos' },
  ];
  max = 4;
}

const meta: Meta<AvatarComponent> = {
  title: 'Sprint 007/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'rounded', 'square'] },
    name: { control: 'text' },
    src: { control: 'text' },
    online: { control: 'boolean' },
  },
  args: {
    name: 'Israel Lucena',
    size: 'md',
    shape: 'circle',
  },
};

export default meta;
type Story = StoryObj<AvatarComponent>;

/**
 * Default — initials fallback when no `src` is provided.
 */
export const Default: Story = {
  args: {
    name: 'Israel Lucena',
    size: 'md',
  },
};

/**
 * AllSizes — all size variants with initials.
 */
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <iu-avatar name="A B" size="xs"></iu-avatar>
        <iu-avatar name="A B" size="sm"></iu-avatar>
        <iu-avatar name="A B" size="md"></iu-avatar>
        <iu-avatar name="A B" size="lg"></iu-avatar>
        <iu-avatar name="A B" size="xl"></iu-avatar>
      </div>`,
    moduleMetadata: { imports: [AvatarComponent] },
  }),
};

/**
 * WithStatus — online/offline status indicators.
 */
export const WithStatus: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:24px; align-items:center;">
        <div style="text-align:center;">
          <iu-avatar name="Israel Lucena" size="lg" [online]="true"></iu-avatar>
          <p style="font-size:12px;margin-top:8px;">Online</p>
        </div>
        <div style="text-align:center;">
          <iu-avatar name="Luana Silva" size="lg" [online]="false"></iu-avatar>
          <p style="font-size:12px;margin-top:8px;">Offline</p>
        </div>
        <div style="text-align:center;">
          <iu-avatar name="Samuel Lucena" size="lg"></iu-avatar>
          <p style="font-size:12px;margin-top:8px;">No status</p>
        </div>
      </div>`,
    moduleMetadata: { imports: [AvatarComponent] },
  }),
};

/**
 * Group — stacked avatar group with overflow badge.
 */
export const Group: Story = {
  render: () => ({
    component: AvatarGroupWrapper,
    moduleMetadata: { imports: [AvatarGroupWrapper] },
  }),
};
