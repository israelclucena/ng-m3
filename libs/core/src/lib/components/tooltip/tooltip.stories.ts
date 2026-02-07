import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { TooltipDirective } from './tooltip.directive';

const meta: Meta = {
  title: 'Components/Tooltip',
  decorators: [
    moduleMetadata({
      imports: [TooltipDirective],
    }),
  ],
  argTypes: {
    text: { control: 'text' },
    variant: { control: 'select', options: ['plain', 'rich'] },
    position: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
  },
};
export default meta;

export const Plain: StoryObj = {
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 100px; display: flex; justify-content: center;">
        <button
          [iuTooltip]="'${args['text'] || 'Save your changes'}'"
          tooltipVariant="plain"
          tooltipPosition="${args['position'] || 'top'}"
          style="padding: 8px 24px; cursor: pointer;">
          Hover me
        </button>
      </div>
    `,
  }),
  args: { text: 'Save your changes', position: 'top' },
};

export const Rich: StoryObj = {
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 100px; display: flex; justify-content: center;">
        <button
          [iuTooltip]="'This is a rich tooltip with more detailed information about this feature.'"
          tooltipVariant="rich"
          tooltipPosition="bottom"
          style="padding: 8px 24px; cursor: pointer;">
          Hover for details
        </button>
      </div>
    `,
  }),
};

export const Positions: StoryObj = {
  render: () => ({
    template: `
      <div style="padding: 120px; display: flex; gap: 40px; justify-content: center; flex-wrap: wrap;">
        <button [iuTooltip]="'Top tooltip'" tooltipPosition="top"
          style="padding: 8px 24px; cursor: pointer;">Top</button>
        <button [iuTooltip]="'Bottom tooltip'" tooltipPosition="bottom"
          style="padding: 8px 24px; cursor: pointer;">Bottom</button>
        <button [iuTooltip]="'Left tooltip'" tooltipPosition="left"
          style="padding: 8px 24px; cursor: pointer;">Left</button>
        <button [iuTooltip]="'Right tooltip'" tooltipPosition="right"
          style="padding: 8px 24px; cursor: pointer;">Right</button>
      </div>
    `,
  }),
};
