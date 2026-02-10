import {
  trigger,
  style,
  animate,
  transition,
} from '@angular/animations';

export const flyoutAnimation = trigger('flyoutAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-8px)' }),
    animate(
      '200ms cubic-bezier(0.2, 0, 0, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
  transition(':leave', [
    animate(
      '150ms cubic-bezier(0.4, 0, 1, 1)',
      style({ opacity: 0, transform: 'translateX(-8px)' })
    ),
  ]),
]);

export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({ height: 0, opacity: 0 }),
    animate('200ms ease', style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    animate('200ms ease', style({ height: 0, opacity: 0 })),
  ]),
]);
