import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CardComponent, CheckboxComponent } from '@israel-ui/core';

@Component({
  selector: 'app-streak-widget',
  standalone: true,
  imports: [CardComponent, CheckboxComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <iu-card variant="filled" title="Streak Tracker" avatar="local_fire_department">
      <div class="streak-list">
        @for (streak of streaks; track streak.name) {
          <div class="streak-row">
            <iu-checkbox [checked]="streak.todayDone" [label]="streak.name"></iu-checkbox>
            <div class="streak-info">
              <span class="streak-count">🔥 {{ streak.current }}/{{ streak.goal }}</span>
            </div>
          </div>
        }
      </div>
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    .streak-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 4px 0;
    }
    .streak-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .streak-info {
      font-size: 14px;
    }
    .streak-count {
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 500;
    }
  `],
})
export class StreakWidgetComponent {
  streaks = [
    { name: 'Acordar 6h', current: 5, goal: 30, todayDone: true },
    { name: 'Code 1h', current: 8, goal: 30, todayDone: true },
    { name: 'Exercício', current: 3, goal: 30, todayDone: false },
    { name: 'Leitura 30min', current: 12, goal: 30, todayDone: false },
  ];
}
