import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { GlobalSearchComponent } from '@israel-ui/core';

const meta: Meta<GlobalSearchComponent> = {
  title: 'LisboaRent/GlobalSearch',
  component: GlobalSearchComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**GlobalSearch** — AppBar-integrated property search for LisboaRent.

Backed by \`PropertySearchService\` (Angular Signals, no RxJS). Features:
- Expandable: compact → full width on focus
- Live suggestions dropdown (top 5 results)
- Keyboard navigation: ↑↓ to navigate, Enter to select, Escape to close
- Property type icons, price, location in each suggestion
- "View all N results" footer when more than 5 match

Feature flag: \`GLOBAL_SEARCH\`
        `.trim(),
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input field',
    },
  },
};

export default meta;
type Story = StoryObj<GlobalSearchComponent>;

/**
 * Default — compact AppBar search bar.
 * Click or focus to expand and start typing.
 */
export const Default: Story = {
  args: {
    placeholder: 'Pesquisar propriedades…',
  },
  render: args => ({
    props: {
      ...args,
      onSelect: (event: unknown) => console.log('Selected:', event),
      onSearch: (event: unknown) => console.log('Search:', event),
    },
    template: `
      <div style="padding: 16px; background: var(--md-sys-color-surface-container, #f3edf7); border-radius: 12px;">
        <p style="margin: 0 0 16px; font-size: 13px; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Click/focus the search bar and type "lisboa", "príncipe", "t2" etc.
        </p>
        <iu-global-search
          [placeholder]="placeholder"
          (select)="onSelect($event)"
          (search)="onSearch($event)"
        />
      </div>
    `,
  }),
};

/**
 * InAppBar — simulates the component inside a top app bar context.
 */
export const InAppBar: Story = {
  args: {
    placeholder: 'Pesquisar em Lisboa…',
  },
  render: args => ({
    props: {
      ...args,
      onSelect: (event: unknown) => console.log('Selected:', event),
      onSearch: (event: unknown) => console.log('Search:', event),
    },
    template: `
      <div style="
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        background: var(--md-sys-color-surface, #fef7ff);
        box-shadow: 0 1px 3px rgba(0,0,0,.12);
        border-radius: 8px;
      ">
        <span class="material-symbols-outlined" style="font-size: 28px; color: var(--md-sys-color-primary, #6750a4);">
          location_city
        </span>
        <span style="font-weight: 600; font-size: 18px; color: var(--md-sys-color-on-surface, #1c1b1f); flex: 1;">
          LisboaRent
        </span>
        <iu-global-search
          [placeholder]="placeholder"
          (select)="onSelect($event)"
          (search)="onSearch($event)"
        />
        <span class="material-symbols-outlined" style="font-size: 24px; color: var(--md-sys-color-on-surface-variant, #49454f);">
          account_circle
        </span>
      </div>
    `,
  }),
};

/**
 * WithCustomPlaceholder — search bar with a more specific prompt.
 */
export const WithCustomPlaceholder: Story = {
  args: {
    placeholder: 'Bairro, cidade, código postal…',
  },
  render: args => ({
    props: {
      ...args,
      onSelect: (event: unknown) => console.log('Selected:', event),
      onSearch: (event: unknown) => console.log('Search:', event),
    },
    template: `
      <div style="padding: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <iu-global-search
          [placeholder]="placeholder"
          (select)="onSelect($event)"
          (search)="onSearch($event)"
        />
        <div style="
          padding: 12px 16px;
          background: var(--md-sys-color-surface-container, #f3edf7);
          border-radius: 12px;
          font-size: 13px;
          color: var(--md-sys-color-on-surface-variant, #49454f);
          max-width: 280px;
        ">
          <strong>Try typing:</strong><br>
          "chiado" → Chiado listings<br>
          "t3" → 3-bedroom properties<br>
          "sintra" → Sintra area<br>
          "studio" → studios<br>
          Just Enter → view all 10
        </div>
      </div>
    `,
  }),
};
