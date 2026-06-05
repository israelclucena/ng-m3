import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;
  let component: StatCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    // label and value are required — set before first detectChanges
    fixture.componentRef.setInput('label', 'Monthly Revenue');
    fixture.componentRef.setInput('value', '€12,450');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.label()).toBe('Monthly Revenue');
    expect(component.value()).toBe('€12,450');
    expect(component.change()).toBe('');
    expect(component.trend()).toBe('neutral');
    expect(component.icon()).toBe('');
    expect(component.iconColor()).toBe('');
    expect(component.cardVariant()).toBe('elevated');
  });

  it('renders inner iu-card wrapping .iu-stat-card content', () => {
    const card = fixture.nativeElement.querySelector('iu-card') as HTMLElement;
    expect(card).toBeTruthy();
    const inner = card.querySelector('.iu-stat-card') as HTMLElement;
    expect(inner).toBeTruthy();
  });

  it('renders label and value text', () => {
    const label = fixture.nativeElement.querySelector('.iu-stat-card__label') as HTMLElement;
    const value = fixture.nativeElement.querySelector('.iu-stat-card__value') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Monthly Revenue');
    expect(value.textContent?.trim()).toBe('€12,450');
  });

  it('does not render icon span when icon() is empty', () => {
    const icon = fixture.nativeElement.querySelector('.iu-stat-card__icon');
    expect(icon).toBeNull();
  });

  it('renders icon span when icon() is non-empty', () => {
    fixture.componentRef.setInput('icon', 'trending_up');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.iu-stat-card__icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.textContent?.trim()).toBe('trending_up');
  });

  it('applies iconColor() as inline style when icon is rendered', () => {
    fixture.componentRef.setInput('icon', 'trending_up');
    fixture.componentRef.setInput('iconColor', 'rgb(255, 0, 0)');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.iu-stat-card__icon') as HTMLElement;
    expect(icon.style.color).toBe('rgb(255, 0, 0)');
  });

  it('does not render change span when change() is empty', () => {
    const change = fixture.nativeElement.querySelector('.iu-stat-card__change');
    expect(change).toBeNull();
  });

  it('renders change span when change() is non-empty', () => {
    fixture.componentRef.setInput('change', '+8.3%');
    fixture.detectChanges();
    const change = fixture.nativeElement.querySelector('.iu-stat-card__change') as HTMLElement;
    expect(change).toBeTruthy();
    expect(change.textContent).toContain('+8.3%');
  });

  it('computes trendClass() based on trend() input', () => {
    expect(component.trendClass()).toBe('iu-stat-card__change--neutral');
    fixture.componentRef.setInput('trend', 'up');
    fixture.detectChanges();
    expect(component.trendClass()).toBe('iu-stat-card__change--up');
    fixture.componentRef.setInput('trend', 'down');
    fixture.detectChanges();
    expect(component.trendClass()).toBe('iu-stat-card__change--down');
  });

  it('computes trendIcon() based on trend() input', () => {
    expect(component.trendIcon()).toBe('trending_flat');
    fixture.componentRef.setInput('trend', 'up');
    fixture.detectChanges();
    expect(component.trendIcon()).toBe('trending_up');
    fixture.componentRef.setInput('trend', 'down');
    fixture.detectChanges();
    expect(component.trendIcon()).toBe('trending_down');
  });

  it('applies trendClass() to change span and renders trendIcon()', () => {
    fixture.componentRef.setInput('change', '-2.1%');
    fixture.componentRef.setInput('trend', 'down');
    fixture.detectChanges();
    const change = fixture.nativeElement.querySelector('.iu-stat-card__change') as HTMLElement;
    expect(change.className).toContain('iu-stat-card__change--down');
    const trendIcon = change.querySelector('.iu-stat-card__trend-icon') as HTMLElement;
    expect(trendIcon.textContent?.trim()).toBe('trending_down');
  });

  it('propagates cardVariant() to inner iu-card variant input', () => {
    fixture.componentRef.setInput('cardVariant', 'filled');
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('iu-card') as HTMLElement;
    const article = card.querySelector('article') as HTMLElement;
    expect(article.className).toContain('iu-card--filled');
  });

  it('inner iu-card renders as full-width', () => {
    const article = fixture.nativeElement.querySelector('iu-card article') as HTMLElement;
    expect(article.className).toContain('iu-card--full-width');
  });

  it('updates label and value reactively when inputs change', () => {
    fixture.componentRef.setInput('label', 'Active Users');
    fixture.componentRef.setInput('value', '1,204');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.iu-stat-card__label') as HTMLElement;
    const value = fixture.nativeElement.querySelector('.iu-stat-card__value') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Active Users');
    expect(value.textContent?.trim()).toBe('1,204');
  });
});
