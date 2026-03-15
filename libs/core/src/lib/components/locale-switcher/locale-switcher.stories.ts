import type { Meta, StoryObj } from '@storybook/angular';
import { LocaleSwitcherComponent } from '@israel-ui/core';

const meta: Meta<LocaleSwitcherComponent> = {
  title: 'LisboaRent/LocaleSwitcher',
  component: LocaleSwitcherComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**iu-locale-switcher** — Compact PT-PT / EN-GB toggle.

Uses \`I18nService\` (Angular Signals, no RxJS) for live locale switching.
Translation files are loaded from \`/locale/messages.pt.json\` and \`/locale/messages.en.json\`.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<LocaleSwitcherComponent>;

/** Default switcher */
export const Default: Story = {};

/** Embedded in a simulated app bar */
export const InAppBar: Story = {
  name: 'Embedded in AppBar',
  decorators: [
    (story) => ({
      template: `
        <div style="
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 24px;
          background: var(--md-sys-color-surface);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.12);
          min-width: 400px;
        ">
          <span class="material-symbols-outlined" style="color:var(--md-sys-color-primary);font-size:28px">location_city</span>
          <span style="font-weight:700;font-size:1.1rem;flex:1">LisboaRent</span>
          <ng-container *ngComponentOutlet="story" />
        </div>
      `,
    }),
  ],
};

/** Wide — explicit size override */
export const Wide: Story = {
  name: 'Standalone — Wider Layout',
  decorators: [
    (story) => ({
      template: `
        <div style="padding:32px;display:flex;flex-direction:column;gap:16px;align-items:flex-start">
          <p style="font-size:14px;color:#666;margin:0">Current locale toggle:</p>
          <ng-container *ngComponentOutlet="story" />
        </div>
      `,
    }),
  ],
};
