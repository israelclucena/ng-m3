import type { Meta, StoryObj } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { StepperComponent, StepChangeEvent, StepperStep } from '@israel-ui/core';

const CHECKOUT_STEPS: StepperStep[] = [
  { label: 'Cart', icon: 'shopping_cart', description: 'Review your items' },
  { label: 'Shipping', icon: 'local_shipping', description: 'Enter delivery address' },
  { label: 'Payment', icon: 'payment', description: 'Payment details' },
  { label: 'Confirm', icon: 'check_circle', description: 'Review and place order' },
];

const FORM_STEPS: StepperStep[] = [
  { label: 'Personal Info' },
  { label: 'Work History', optional: true },
  { label: 'Skills' },
  { label: 'Review' },
];

// Interactive wrapper
@Component({
  selector: 'story-stepper-interactive',
  standalone: true,
  imports: [StepperComponent],
  template: `
    <div style="padding:24px;">
      <iu-stepper
        [steps]="steps"
        [activeStep]="current()"
        orientation="horizontal"
        mode="linear"
        [showControls]="true"
        (stepChange)="onStep($event)"
        (finished)="onFinish()"
      />
      @if (done()) {
        <div style="margin-top:24px; padding:16px; background:#e8f5e9; border-radius:8px; color:#2e7d32; font-weight:500;">
          ✅ All steps completed!
        </div>
      }
    </div>
  `,
})
class InteractiveStepper {
  steps = CHECKOUT_STEPS;
  current = signal(0);
  done = signal(false);

  onStep(e: StepChangeEvent) {
    this.current.set(e.currentIndex);
    this.done.set(false);
  }
  onFinish() { this.done.set(true); }
}

const meta: Meta<StepperComponent> = {
  title: 'Sprint 007/Stepper',
  component: StepperComponent,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    mode: { control: 'select', options: ['linear', 'free'] },
    activeStep: { control: 'number' },
    showControls: { control: 'boolean' },
  },
  args: {
    steps: CHECKOUT_STEPS,
    activeStep: 1,
    orientation: 'horizontal',
    mode: 'linear',
    showControls: false,
  },
};

export default meta;
type Story = StoryObj<StepperComponent>;

/**
 * Default — horizontal stepper at step 1.
 */
export const Default: Story = {};

/**
 * Interactive — full navigation with next/back controls.
 */
export const Interactive: Story = {
  render: () => ({
    component: InteractiveStepper,
    moduleMetadata: { imports: [InteractiveStepper] },
  }),
};

/**
 * WithOptional — steps with optional labels and descriptions.
 */
export const WithOptional: Story = {
  args: {
    steps: FORM_STEPS,
    activeStep: 0,
    showControls: false,
  },
};
