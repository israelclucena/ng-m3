import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DialogComponent } from './dialog.component';
import { ButtonComponent } from '../button/button.component';
import '../../material/material-web';

const meta: Meta<DialogComponent> = {
  title: 'Core/Dialog',
  component: DialogComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    headline: {
      control: 'text',
      description: 'Dialog headline',
    },
    supportingText: {
      control: 'text',
      description: 'Supporting text under headline',
    },
    type: {
      control: 'select',
      options: ['alert', 'simple'],
      description: 'Dialog type',
    },
    icon: {
      control: 'text',
      description: 'Material icon name for headline',
    },
  },
};

export default meta;
type Story = StoryObj<DialogComponent>;

// --- Basic ---
export const Basic: Story = {
  args: {
    open: true,
    headline: 'Basic Dialog',
    supportingText: 'This is a simple dialog with supporting text.',
    type: 'simple',
  },
};

// --- Alert ---
export const Alert: Story = {
  render: () => ({
    template: `
      <iu-dialog
        [open]="true"
        headline="Discard draft?"
        supportingText="Your changes will not be saved."
        type="alert"
        icon="warning"
      >
        <div slot="actions">
          <iu-button variant="text" label="Cancel"></iu-button>
          <iu-button variant="primary" label="Discard"></iu-button>
        </div>
      </iu-dialog>
    `,
  }),
};

// --- WithActions ---
export const WithActions: Story = {
  render: () => ({
    template: `
      <iu-dialog
        [open]="true"
        headline="Confirm action"
        type="simple"
      >
        <div slot="content">
          <p>Do you want to proceed with this operation?</p>
        </div>
        <div slot="actions">
          <iu-button variant="text" label="Cancel"></iu-button>
          <iu-button variant="primary" label="Confirm"></iu-button>
        </div>
      </iu-dialog>
    `,
  }),
};

// --- Scrollable ---
export const Scrollable: Story = {
  render: () => ({
    template: `
      <iu-dialog
        [open]="true"
        headline="Terms of Service"
        type="simple"
      >
        <div slot="content">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
          <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
          <p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
        </div>
        <div slot="actions">
          <iu-button variant="text" label="Decline"></iu-button>
          <iu-button variant="primary" label="Accept"></iu-button>
        </div>
      </iu-dialog>
    `,
  }),
};
