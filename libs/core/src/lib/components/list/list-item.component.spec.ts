import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListItemComponent } from './list-item.component';

describe('ListItemComponent', () => {
  let fixture: ComponentFixture<ListItemComponent>;
  let component: ListItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Inputs ────────────────────────────────────────────────────────────────
  it('defaults to empty headline / supportingText, text type, not disabled', () => {
    expect(component.headline()).toBe('');
    expect(component.supportingText()).toBe('');
    expect(component.type()).toBe('text');
    expect(component.disabled()).toBe(false);
  });

  it('renders the headline text', () => {
    fixture.componentRef.setInput('headline', 'Definições');
    fixture.detectChanges();
    const headline = fixture.nativeElement.querySelector(
      '[slot="headline"]',
    ) as HTMLElement;
    expect(headline.textContent).toContain('Definições');
  });

  it('renders supporting text only when provided', () => {
    expect(
      fixture.nativeElement.querySelector('[slot="supporting-text"]'),
    ).toBeFalsy();
    fixture.componentRef.setInput('supportingText', 'Subtítulo');
    fixture.detectChanges();
    const sub = fixture.nativeElement.querySelector(
      '[slot="supporting-text"]',
    ) as HTMLElement;
    expect(sub).toBeTruthy();
    expect(sub.textContent).toContain('Subtítulo');
  });

  // ── hostClass computed ──────────────────────────────────────────────────────
  it('hostClass reflects the default text type', () => {
    expect(component.hostClass()).toBe('iu-list-item iu-list-item--text');
  });

  it('hostClass reflects the chosen type', () => {
    fixture.componentRef.setInput('type', 'button');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-list-item iu-list-item--button');
  });

  it('hostClass adds the disabled modifier when disabled', () => {
    fixture.componentRef.setInput('type', 'link');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe(
      'iu-list-item iu-list-item--link iu-list-item--disabled',
    );
  });

  it('applies hostClass and type/disabled bindings to the md-list-item element', () => {
    fixture.componentRef.setInput('type', 'button');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector(
      'md-list-item',
    ) as HTMLElement;
    expect(el.getAttribute('class')).toContain('iu-list-item--button');
    expect(el.getAttribute('class')).toContain('iu-list-item--disabled');
  });
});
