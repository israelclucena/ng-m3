import type { Meta, StoryObj } from '@storybook/angular';
import { AuthRegisterComponent } from '@israel-ui/core';

const meta: Meta<AuthRegisterComponent> = {
  title: 'Auth/AuthRegister',
  component: AuthRegisterComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '**AuthRegister** — Registration form for LisboaRent with role selector (Inquilino / Proprietário). ' +
          'Password strength indicator, confirm-password validation, terms acceptance, success state. ' +
          'Feature flag: `AUTH_MODULE`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<AuthRegisterComponent>;

/** Default — blank registration form, tenant role selected. */
export const Default: Story = {};

/** LandlordRole — with landlord role pre-selected. */
export const LandlordRole: Story = {
  name: 'Landlord Role',
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelectorAll<HTMLButtonElement>('.iu-ar__role-btn')[1];
    btn?.click();
  },
};

/** FilledOut — form with sample data (for visual review). */
export const FilledOut: Story = {
  name: 'Filled Out',
  play: async ({ canvasElement }) => {
    const fill = (id: string, value: string) => {
      const el = canvasElement.querySelector<HTMLInputElement>(id);
      if (el) { el.value = value; el.dispatchEvent(new Event('input')); }
    };
    fill('#ar-name', 'Israel Lucena');
    fill('#ar-email', 'israel@lisboarent.pt');
    fill('#ar-password', 'MinhaPassword123!');
    fill('#ar-confirm', 'MinhaPassword123!');
  },
};
