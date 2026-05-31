import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineComponent, type TimelineItem } from './timeline.component';

describe('TimelineComponent', () => {
  let fixture: ComponentFixture<TimelineComponent>;
  let component: TimelineComponent;

  const sampleItems: TimelineItem[] = [
    { title: 'Created', description: 'Order placed', date: '2026-01-01', icon: 'check', color: 'primary' },
    { title: 'Shipped', description: 'In transit', date: '2026-01-02', color: 'success', active: true },
    { title: 'Delivered', date: '2026-01-03', color: '#ff00ff' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimelineComponent] }).compileComponents();
    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render no items by default', () => {
    const items = fixture.nativeElement.querySelectorAll('.iu-timeline__item');
    expect(items.length).toBe(0);
  });

  it('should render one item per entry with title and description', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.iu-timeline__item');
    expect(items.length).toBe(3);
    const titles = fixture.nativeElement.querySelectorAll('.iu-timeline__title');
    expect(titles[0].textContent.trim()).toBe('Created');
    expect(titles[1].textContent.trim()).toBe('Shipped');
    const descs = fixture.nativeElement.querySelectorAll('.iu-timeline__desc');
    expect(descs[0].textContent.trim()).toBe('Order placed');
  });

  it('should render date and icon when provided', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
    const dates = fixture.nativeElement.querySelectorAll('.iu-timeline__date');
    expect(dates[0].textContent.trim()).toBe('2026-01-01');
    const icon = fixture.nativeElement.querySelector('.material-symbols-outlined');
    expect(icon?.textContent?.trim()).toBe('check');
  });

  it('should mark the active item with active classes', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
    const activeItems = fixture.nativeElement.querySelectorAll('.iu-timeline__item--active');
    expect(activeItems.length).toBe(1);
    const activeDot = fixture.nativeElement.querySelector('.iu-timeline__dot--active');
    expect(activeDot).toBeTruthy();
    const activeCard = fixture.nativeElement.querySelector('.iu-timeline__card--active');
    expect(activeCard).toBeTruthy();
  });

  it('should default to vertical orientation with start alignment', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.iu-timeline');
    expect(root.classList.contains('iu-timeline--vertical')).toBe(true);
    expect(root.classList.contains('iu-timeline--align-start')).toBe(true);
  });

  it('should apply horizontal orientation class when set', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.iu-timeline');
    expect(root.classList.contains('iu-timeline--horizontal')).toBe(true);
    expect(root.classList.contains('iu-timeline--vertical')).toBe(false);
  });

  it('should render opposite content for alternate alignment on odd vertical items', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.componentRef.setInput('align', 'alternate');
    fixture.detectChanges();
    const opposite = fixture.nativeElement.querySelectorAll('.iu-timeline__content--opposite');
    expect(opposite.length).toBe(1);
    const root = fixture.nativeElement.querySelector('.iu-timeline');
    expect(root.classList.contains('iu-timeline--align-alternate')).toBe(true);
  });

  it('should skip the leading connector on the first item and trailing connector on the last', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.iu-timeline__item');
    const firstBefore = items[0].querySelector('.iu-timeline__connector--before');
    expect(firstBefore).toBeNull();
    const lastAfter = items[items.length - 1].querySelector('.iu-timeline__connector--after');
    expect(lastAfter).toBeNull();
    expect(items[items.length - 1].classList.contains('iu-timeline__item--last')).toBe(true);
  });

  it('should report isFirst correctly', () => {
    expect(component.isFirst(0)).toBe(true);
    expect(component.isFirst(1)).toBe(false);
    expect(component.isFirst(42)).toBe(false);
  });

  it('should resolve named color tokens and pass through raw values', () => {
    expect(component.resolveColor({ title: 't' })).toBeNull();
    expect(component.resolveColor({ title: 't', color: 'primary' })).toContain('--md-sys-color-primary');
    expect(component.resolveColor({ title: 't', color: 'success' })).toBe('#4caf50');
    expect(component.resolveColor({ title: 't', color: 'warning' })).toBe('#ff9800');
    expect(component.resolveColor({ title: 't', color: 'error' })).toContain('--md-sys-color-error');
    expect(component.resolveColor({ title: 't', color: '#abcdef' })).toBe('#abcdef');
  });
});
