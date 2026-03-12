import '@material/web/slider/slider.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * IU Slider — Angular wrapper over @material/web md-slider.
 *
 * Usage:
 *   <iu-slider [value]="50" [min]="0" [max]="100" (change)="onValue($event)"></iu-slider>
 *   <iu-slider [range]="true" [valueStart]="20" [valueEnd]="80"></iu-slider>
 */
@Component({
  selector: 'iu-slider',
  standalone: true,
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SliderComponent implements AfterViewInit {
  /** Current value (single slider) */
  value = input<number>(50);

  /** Minimum value */
  min = input<number>(0);

  /** Maximum value */
  max = input<number>(100);

  /** Step increment (0 = continuous) */
  step = input<number>(0);

  /** Show value label on thumb */
  labeled = input<boolean>(false);

  /** Disabled state */
  disabled = input<boolean>(false);

  /** Range mode: two thumbs */
  range = input<boolean>(false);

  /** Start value for range slider */
  valueStart = input<number>(0);

  /** End value for range slider */
  valueEnd = input<number>(100);

  /** Emits on committed value change */
  change = output<number | { start: number; end: number }>();

  /** Emits on every input movement */
  input = output<number | { start: number; end: number }>();

  sliderRef = viewChild<ElementRef>('sliderEl');

  hostClass = computed(() => {
    const c = ['iu-slider'];
    if (this.disabled()) c.push('iu-slider--disabled');
    if (this.range()) c.push('iu-slider--range');
    return c.join(' ');
  });

  ngAfterViewInit(): void {
    const el = this.sliderRef()?.nativeElement;
    if (!el) return;

    el.addEventListener('change', () => {
      if (this.range()) {
        this.change.emit({ start: el.valueStart, end: el.valueEnd });
      } else {
        this.change.emit(el.value);
      }
    });

    el.addEventListener('input', () => {
      if (this.range()) {
        this.input.emit({ start: el.valueStart, end: el.valueEnd });
      } else {
        this.input.emit(el.value);
      }
    });
  }
}
