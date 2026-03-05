import type { Meta, StoryObj } from '@storybook/angular';
import { WidgetContainerComponent } from './widget-container.component';

const meta: Meta<WidgetContainerComponent> = {
  title: 'Components/WidgetContainer',
  component: WidgetContainerComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Configurable card widget with resize handles, collapse, refresh, and close actions. Compose with `iu-widget-grid` for responsive dashboard layouts. Uses M3 design tokens throughout.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<WidgetContainerComponent>;

// ─── Default ──────────────────────────────────────────────────────────────────
/** Default — medium widget with all actions enabled */
export const Default: Story = {
  args: {
    widgetId: 'demo-widget',
    title: 'Revenue Overview',
    subtitle: 'Last 30 days',
    icon: 'payments',
    size: 'medium',
    resizable: true,
    collapsible: true,
    closable: true,
    refreshable: true,
    loading: false,
    elevated: false,
    compact: false,
    showDragHandle: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 380px; height: 300px;">
        <iu-widget-container
          [widgetId]="widgetId"
          [title]="title"
          [subtitle]="subtitle"
          [icon]="icon"
          [size]="size"
          [resizable]="resizable"
          [collapsible]="collapsible"
          [closable]="closable"
          [refreshable]="refreshable"
          [loading]="loading"
          [elevated]="elevated"
          [compact]="compact"
          [showDragHandle]="showDragHandle"
        >
          <div style="display:flex;flex-direction:column;gap:12px;padding:4px 0">
            <div style="font-size:36px;font-weight:700;color:var(--md-sys-color-primary,#6750a4)">€ 24,980</div>
            <div style="font-size:13px;color:var(--md-sys-color-on-surface-variant,#49454f)">↑ 12.4% vs previous period</div>
            <div style="height:4px;border-radius:2px;background:var(--md-sys-color-primary-container,#eaddff)">
              <div style="width:62%;height:100%;border-radius:2px;background:var(--md-sys-color-primary,#6750a4)"></div>
            </div>
            <div style="font-size:12px;color:var(--md-sys-color-on-surface-variant,#49454f)">62% of monthly target</div>
          </div>
        </iu-widget-container>
      </div>
    `,
  }),
};

// ─── Loading ──────────────────────────────────────────────────────────────────
/** Loading — spinner overlay with dimmed content */
export const Loading: Story = {
  args: {
    widgetId: 'loading-widget',
    title: 'Active Users',
    icon: 'people',
    size: 'medium',
    resizable: false,
    collapsible: false,
    closable: false,
    refreshable: true,
    loading: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 340px; height: 240px;">
        <iu-widget-container
          [widgetId]="widgetId"
          [title]="title"
          [icon]="icon"
          [loading]="loading"
          [refreshable]="refreshable"
        >
          <p style="font-size:14px;color:var(--md-sys-color-on-surface-variant)">User data will appear here.</p>
        </iu-widget-container>
      </div>
    `,
  }),
};

// ─── Elevated Grid ────────────────────────────────────────────────────────────
/** ElevatedGrid — multiple widgets composed inside a iu-widget-grid */
export const ElevatedGrid: Story = {
  name: 'Elevated Grid',
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:16px">
        <iu-widget-container widgetId="w1" title="Revenue" icon="payments" [elevated]="true" [refreshable]="true" [collapsible]="true">
          <div style="font-size:28px;font-weight:700;color:var(--md-sys-color-primary,#6750a4);padding:8px 0">€ 24,980</div>
        </iu-widget-container>
        <iu-widget-container widgetId="w2" title="Users" icon="people" [elevated]="true" [refreshable]="true" [collapsible]="true">
          <div style="font-size:28px;font-weight:700;color:var(--md-sys-color-tertiary,#7d5260);padding:8px 0">1,204</div>
        </iu-widget-container>
        <iu-widget-container widgetId="w3" title="Listings" icon="home" [elevated]="true" [refreshable]="true" [closable]="true">
          <div style="font-size:28px;font-weight:700;color:var(--md-sys-color-secondary,#625b71);padding:8px 0">384</div>
        </iu-widget-container>
      </div>
    `,
  }),
};
