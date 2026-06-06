import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingDisplayComponent } from './rating-display.component';

describe('RatingDisplayComponent', () => {
  let fixture: ComponentFixture<RatingDisplayComponent>;
  let component: RatingDisplayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RatingDisplayComponent] }).compileComponents();
    fixture = TestBed.createComponent(RatingDisplayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.rating()).toBe(0);
    expect(component.count()).toBeNull();
    expect(component.size()).toBe('md');
    expect(component.showLabel()).toBe(true);
  });

  it('stars() returns five empty stars when rating is 0', () => {
    expect(component.stars()).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('stars() returns five full stars when rating is 5', () => {
    fixture.componentRef.setInput('rating', 5);
    fixture.detectChanges();
    expect(component.stars()).toEqual(['full', 'full', 'full', 'full', 'full']);
  });

  it('stars() returns mixed full/half/empty for fractional ratings (3.5)', () => {
    fixture.componentRef.setInput('rating', 3.5);
    fixture.detectChanges();
    expect(component.stars()).toEqual(['full', 'full', 'full', 'half', 'empty']);
  });

  it('stars() handles fractional rating 4.2 as 4 full + 1 empty (no half until .5)', () => {
    fixture.componentRef.setInput('rating', 4.2);
    fixture.detectChanges();
    expect(component.stars()).toEqual(['full', 'full', 'full', 'full', 'empty']);
  });

  it('stars() clamps negative ratings to 0 (all empty)', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    expect(component.stars()).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('stars() clamps ratings above 5 to 5 (all full)', () => {
    fixture.componentRef.setInput('rating', 9);
    fixture.detectChanges();
    expect(component.stars()).toEqual(['full', 'full', 'full', 'full', 'full']);
  });

  it('ariaLabel() omits count when count is null', () => {
    fixture.componentRef.setInput('rating', 4.5);
    fixture.detectChanges();
    expect(component.ariaLabel()).toBe('4.5 de 5 estrelas');
  });

  it('ariaLabel() includes count when set', () => {
    fixture.componentRef.setInput('rating', 4.5);
    fixture.componentRef.setInput('count', 28);
    fixture.detectChanges();
    expect(component.ariaLabel()).toBe('4.5 de 5 estrelas, 28 avaliações');
  });

  it('renders five star span elements inside .iu-rating__stars', () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    const stars = fixture.nativeElement.querySelectorAll('.iu-rating__star');
    expect(stars.length).toBe(5);
  });

  it('applies size modifier class to the host rating wrapper', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.iu-rating') as HTMLElement;
    expect(wrapper.classList.contains('iu-rating--lg')).toBe(true);
  });

  it('applies filled/half/empty modifier classes based on rating', () => {
    fixture.componentRef.setInput('rating', 2.5);
    fixture.detectChanges();
    const stars = fixture.nativeElement.querySelectorAll('.iu-rating__star');
    expect(stars[0].classList.contains('iu-rating__star--filled')).toBe(true);
    expect(stars[1].classList.contains('iu-rating__star--filled')).toBe(true);
    expect(stars[2].classList.contains('iu-rating__star--half')).toBe(true);
    expect(stars[3].classList.contains('iu-rating__star--empty')).toBe(true);
    expect(stars[4].classList.contains('iu-rating__star--empty')).toBe(true);
  });

  it('renders the numeric label when showLabel is true (default)', () => {
    fixture.componentRef.setInput('rating', 4.5);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.iu-rating__label') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('4.5');
  });

  it('hides the numeric label when showLabel is false', () => {
    fixture.componentRef.setInput('rating', 4.5);
    fixture.componentRef.setInput('showLabel', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-rating__label')).toBeNull();
  });

  it('renders the count in parentheses when count is set', () => {
    fixture.componentRef.setInput('rating', 4.5);
    fixture.componentRef.setInput('count', 28);
    fixture.detectChanges();
    const count = fixture.nativeElement.querySelector('.iu-rating__count') as HTMLElement;
    expect(count).toBeTruthy();
    expect(count.textContent?.trim()).toBe('(28)');
  });

  it('omits the count span when count is null', () => {
    fixture.componentRef.setInput('rating', 4.5);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-rating__count')).toBeNull();
  });

  it('sets aria-label on the stars container reflecting rating and count', () => {
    fixture.componentRef.setInput('rating', 4);
    fixture.componentRef.setInput('count', 12);
    fixture.detectChanges();
    const stars = fixture.nativeElement.querySelector('.iu-rating__stars') as HTMLElement;
    expect(stars.getAttribute('aria-label')).toBe('4.0 de 5 estrelas, 12 avaliações');
  });
});
