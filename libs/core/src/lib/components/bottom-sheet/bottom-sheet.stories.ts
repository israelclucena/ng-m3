import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { BottomSheetComponent } from './bottom-sheet.component';

const meta: Meta<BottomSheetComponent> = {
  title: 'Components/Bottom Sheet',
  component: BottomSheetComponent,
  decorators: [
    moduleMetadata({
      imports: [BottomSheetComponent],
    }),
  ],
  argTypes: {
    variant: { control: 'select', options: ['standard', 'modal'] },
    open: { control: 'boolean' },
    dragHandle: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<BottomSheetComponent>;

export const Standard: Story = {
  render: (args) => ({
    props: { ...args, open: true },
    template: `
      <div style="height: 400px; background: var(--md-sys-color-surface-container); padding: 24px;">
        <p>Page content behind the sheet</p>
      </div>
      <iu-bottom-sheet [open]="open" variant="standard" [dragHandle]="true">
        <h3 style="margin: 8px 0 16px; font-size: 18px;">Standard Sheet</h3>
        <p>This is a standard bottom sheet. It coexists with the page content.</p>
      </iu-bottom-sheet>
    `,
  }),
  args: { open: true, variant: 'standard', dragHandle: true },
};

export const Modal: Story = {
  render: (args) => ({
    props: { ...args, open: true },
    template: `
      <div style="height: 400px; background: var(--md-sys-color-surface-container); padding: 24px;">
        <p>Page content behind the sheet</p>
      </div>
      <iu-bottom-sheet [open]="open" variant="modal" [dragHandle]="true">
        <h3 style="margin: 8px 0 16px; font-size: 18px;">Modal Sheet</h3>
        <p>This modal sheet dims the background and can be dismissed by tapping the scrim.</p>
      </iu-bottom-sheet>
    `,
  }),
  args: { open: true, variant: 'modal', dragHandle: true },
};

export const WithDragHandle: Story = {
  render: () => ({
    props: { open: true },
    template: `
      <iu-bottom-sheet [open]="open" variant="standard" [dragHandle]="true">
        <h3 style="margin: 8px 0 16px; font-size: 18px;">Drag Handle Visible</h3>
        <p>The drag handle is the small bar at the top.</p>
      </iu-bottom-sheet>
    `,
  }),
};

export const WithContent: Story = {
  render: () => ({
    props: { open: true },
    template: `
      <iu-bottom-sheet [open]="open" variant="modal" [dragHandle]="true">
        <h3 style="margin: 8px 0 16px; font-size: 18px;">Actions</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button style="padding: 12px; text-align: left; border: none; background: none; font-size: 16px; cursor: pointer;">
            📷 Take a photo
          </button>
          <button style="padding: 12px; text-align: left; border: none; background: none; font-size: 16px; cursor: pointer;">
            🖼️ Choose from gallery
          </button>
          <button style="padding: 12px; text-align: left; border: none; background: none; font-size: 16px; cursor: pointer;">
            📁 Browse files
          </button>
        </div>
      </iu-bottom-sheet>
    `,
  }),
};
