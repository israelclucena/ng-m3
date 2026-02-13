import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CardComponent, ChipComponent } from '@israel-ui/core';

@Component({
  selector: 'app-quick-links-widget',
  standalone: true,
  imports: [CardComponent, ChipComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <iu-card variant="outlined" title="Quick Links" avatar="link">
      <div class="links-grid">
        @for (link of links; track link.label) {
          <iu-chip variant="assist" [label]="link.label" [icon]="link.icon"></iu-chip>
        }
      </div>
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    .links-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 0;
    }
  `],
})
export class QuickLinksWidgetComponent {
  links = [
    { label: 'GitHub', icon: 'code' },
    { label: 'Storybook', icon: 'menu_book' },
    { label: 'Idealista', icon: 'house' },
    { label: 'Gmail', icon: 'mail' },
    { label: 'Calendar', icon: 'calendar_today' },
    { label: 'B3', icon: 'show_chart' },
    { label: 'ChatGPT', icon: 'smart_toy' },
    { label: 'Figma', icon: 'design_services' },
  ];
}
