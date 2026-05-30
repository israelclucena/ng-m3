import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render title when set', () => {
    fixture.componentRef.setInput('title', 'No messages yet');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.iu-empty-state__title');
    expect(el?.textContent?.trim()).toBe('No messages yet');
  });

  it('should render description when set', () => {
    fixture.componentRef.setInput('description', 'Your inbox is empty.');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.iu-empty-state__description');
    expect(el?.textContent?.trim()).toBe('Your inbox is empty.');
  });

  it('should render icon span when icon input set', () => {
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.iu-empty-state__icon');
    expect(el).toBeTruthy();
    expect(el?.textContent?.trim()).toBe('inbox');
  });

  it('should render action button only when actionLabel is set', () => {
    let btn = fixture.nativeElement.querySelector('.iu-empty-state__action');
    expect(btn).toBeNull();

    fixture.componentRef.setInput('actionLabel', 'Compose');
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('.iu-empty-state__action');
    expect(btn).toBeTruthy();
    expect(btn?.textContent?.trim()).toBe('Compose');
  });

  it('should emit actionClick when action button is clicked', () => {
    fixture.componentRef.setInput('actionLabel', 'Compose');
    fixture.detectChanges();

    const spy = jest.fn();
    component.actionClick.subscribe(() => spy());

    const btn = fixture.nativeElement.querySelector('.iu-empty-state__action') as HTMLButtonElement;
    btn.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should apply size class', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.iu-empty-state');
    expect(root?.classList.contains('iu-empty-state--lg')).toBe(true);
  });

  it('should not render title, description or action when inputs are empty defaults', () => {
    expect(fixture.nativeElement.querySelector('.iu-empty-state__title')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-empty-state__description')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-empty-state__action')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-empty-state__icon')).toBeNull();
  });
});
