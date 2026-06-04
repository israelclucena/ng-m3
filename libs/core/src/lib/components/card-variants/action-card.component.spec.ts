import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionCardComponent } from './action-card.component';

describe('ActionCardComponent', () => {
  let fixture: ComponentFixture<ActionCardComponent>;
  let component: ActionCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActionCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ActionCardComponent);
    component = fixture.componentInstance;
    // title is required — set before first detectChanges
    fixture.componentRef.setInput('title', 'Create Project');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.title()).toBe('Create Project');
    expect(component.description()).toBe('');
    expect(component.icon()).toBe('');
    expect(component.actionLabel()).toBe('');
    expect(component.cardVariant()).toBe('outlined');
  });

  it('renders inner iu-card wrapping .iu-action-card content', () => {
    const card = fixture.nativeElement.querySelector('iu-card') as HTMLElement;
    expect(card).toBeTruthy();
    const inner = card.querySelector('.iu-action-card') as HTMLElement;
    expect(inner).toBeTruthy();
  });

  it('renders the title text inside h3.iu-action-card__title', () => {
    const title = fixture.nativeElement.querySelector('h3.iu-action-card__title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent?.trim()).toBe('Create Project');
  });

  it('does not render icon span when icon() is empty', () => {
    const icon = fixture.nativeElement.querySelector('.iu-action-card__icon');
    expect(icon).toBeNull();
  });

  it('renders icon span when icon() is non-empty', () => {
    fixture.componentRef.setInput('icon', 'add_circle');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.iu-action-card__icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.textContent?.trim()).toBe('add_circle');
  });

  it('does not render description paragraph when description() is empty', () => {
    const desc = fixture.nativeElement.querySelector('.iu-action-card__description');
    expect(desc).toBeNull();
  });

  it('renders description paragraph when description() is non-empty', () => {
    fixture.componentRef.setInput('description', 'Start a new project from scratch');
    fixture.detectChanges();
    const desc = fixture.nativeElement.querySelector('.iu-action-card__description') as HTMLElement;
    expect(desc).toBeTruthy();
    expect(desc.textContent?.trim()).toBe('Start a new project from scratch');
  });

  it('does not render actionLabel span when actionLabel() is empty', () => {
    const action = fixture.nativeElement.querySelector('.iu-action-card__action');
    expect(action).toBeNull();
  });

  it('renders actionLabel span when actionLabel() is non-empty', () => {
    fixture.componentRef.setInput('actionLabel', 'Get Started');
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector('.iu-action-card__action') as HTMLElement;
    expect(action).toBeTruthy();
    expect(action.textContent?.trim()).toBe('Get Started');
  });

  it('propagates cardVariant() to inner iu-card variant input', () => {
    fixture.componentRef.setInput('cardVariant', 'elevated');
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('iu-card') as HTMLElement;
    const article = card.querySelector('article') as HTMLElement;
    expect(article.className).toContain('iu-card--elevated');
  });

  it('inner iu-card is rendered as clickable (role=button)', () => {
    const article = fixture.nativeElement.querySelector('iu-card article') as HTMLElement;
    expect(article.getAttribute('role')).toBe('button');
    expect(article.className).toContain('iu-card--clickable');
    expect(article.className).toContain('iu-card--full-width');
  });

  it('emits actionClick when inner iu-card fires cardClick', () => {
    const spy = jest.fn();
    component.actionClick.subscribe(spy);
    const article = fixture.nativeElement.querySelector('iu-card article') as HTMLElement;
    article.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders all three optional sections together when all inputs are provided', () => {
    fixture.componentRef.setInput('icon', 'star');
    fixture.componentRef.setInput('description', 'Some description');
    fixture.componentRef.setInput('actionLabel', 'Go');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-action-card__icon')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iu-action-card__description')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iu-action-card__action')).toBeTruthy();
  });

  it('updates title text reactively when title input changes', () => {
    fixture.componentRef.setInput('title', 'Updated Title');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h3.iu-action-card__title') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Updated Title');
  });
});
