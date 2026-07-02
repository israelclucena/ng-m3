import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TooltipDirective,
  type TooltipPosition,
  type TooltipVariant,
} from './tooltip.directive';

const SHOW_DELAY = 500;
const HIDE_DELAY = 100;

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `
    <button
      type="button"
      [iuTooltip]="text()"
      [tooltipVariant]="variant()"
      [tooltipPosition]="position()"
    >
      Hover me
    </button>
  `,
})
class HostComponent {
  readonly text = signal('Save draft');
  readonly variant = signal<TooltipVariant>('plain');
  readonly position = signal<TooltipPosition>('top');
}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let button: HTMLButtonElement;

  const tip = () => document.querySelector('.iu-tooltip');

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll('.iu-tooltip').forEach((el) => el.remove());
    jest.useRealTimers();
  });

  it('shows the tooltip after the hover delay', () => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(tip()).toBeNull(); // not yet — waiting out the delay
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).not.toBeNull();
    expect(tip()!.textContent).toBe('Save draft');
  });

  it('hides the tooltip after leave delay', () => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).not.toBeNull();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    jest.advanceTimersByTime(HIDE_DELAY);
    expect(tip()).toBeNull();
  });

  it('shows and hides on focus / blur too', () => {
    button.dispatchEvent(new FocusEvent('focus'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).not.toBeNull();

    button.dispatchEvent(new FocusEvent('blur'));
    jest.advanceTimersByTime(HIDE_DELAY);
    expect(tip()).toBeNull();
  });

  it('cancels a pending show when the pointer leaves before the delay elapses', () => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(200); // still within the 500ms window
    button.dispatchEvent(new MouseEvent('mouseleave'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).toBeNull();
  });

  it('applies the variant and position modifier classes', () => {
    host.variant.set('rich');
    host.position.set('bottom');
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(SHOW_DELAY);

    expect(tip()!.classList).toContain('iu-tooltip--rich');
    expect(tip()!.classList).toContain('iu-tooltip--bottom');
  });

  it('injects the shared stylesheet once', () => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(document.getElementById('iu-tooltip-styles')).not.toBeNull();
  });

  it('does not create a tooltip for empty text', () => {
    host.text.set('');
    fixture.detectChanges();
    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).toBeNull();
  });

  it('removes the tooltip and detaches listeners on destroy', () => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).not.toBeNull();

    fixture.destroy();
    expect(tip()).toBeNull();

    // listeners are gone — a further hover must not resurrect the tooltip
    button.dispatchEvent(new MouseEvent('mouseenter'));
    jest.advanceTimersByTime(SHOW_DELAY);
    expect(tip()).toBeNull();
  });
});
