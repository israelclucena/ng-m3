import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListComponent } from './list.component';
import { ListItemComponent } from './list-item.component';

describe('ListComponent', () => {
  let fixture: ComponentFixture<ListComponent>;
  let component: ListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListComponent] }).compileComponents();
    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render an md-list element', () => {
    const el = fixture.nativeElement.querySelector('md-list');
    expect(el).toBeTruthy();
  });

  it('should apply iu-list class to md-list', () => {
    const el = fixture.nativeElement.querySelector('md-list');
    expect(el.classList.contains('iu-list')).toBe(true);
  });
});

describe('ListItemComponent', () => {
  let fixture: ComponentFixture<ListItemComponent>;
  let component: ListItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListItemComponent] }).compileComponents();
    fixture = TestBed.createComponent(ListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have default input values', () => {
    expect(component.headline()).toBe('');
    expect(component.supportingText()).toBe('');
    expect(component.type()).toBe('text');
    expect(component.disabled()).toBe(false);
  });

  it('should compute hostClass with default text type', () => {
    expect(component.hostClass()).toBe('iu-list-item iu-list-item--text');
  });

  it('should compute hostClass for button type', () => {
    fixture.componentRef.setInput('type', 'button');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-list-item iu-list-item--button');
  });

  it('should compute hostClass for link type', () => {
    fixture.componentRef.setInput('type', 'link');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-list-item iu-list-item--link');
  });

  it('should include disabled modifier in hostClass when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-list-item iu-list-item--text iu-list-item--disabled');
  });

  it('should render headline text in slot', () => {
    fixture.componentRef.setInput('headline', 'My Title');
    fixture.detectChanges();
    const headline = fixture.nativeElement.querySelector('[slot="headline"]');
    expect(headline?.textContent.trim()).toBe('My Title');
  });

  it('should not render supporting-text slot when empty', () => {
    const supporting = fixture.nativeElement.querySelector('[slot="supporting-text"]');
    expect(supporting).toBeNull();
  });

  it('should render supporting-text slot when provided', () => {
    fixture.componentRef.setInput('supportingText', 'Subtitle here');
    fixture.detectChanges();
    const supporting = fixture.nativeElement.querySelector('[slot="supporting-text"]');
    expect(supporting?.textContent.trim()).toBe('Subtitle here');
  });

  it('should bind type as property on md-list-item', () => {
    const f = TestBed.createComponent(ListItemComponent);
    f.componentRef.setInput('type', 'button');
    f.detectChanges();
    const el = f.nativeElement.querySelector('md-list-item') as HTMLElement & {
      type?: string;
    };
    expect(el?.type).toBe('button');
  });

  it('should bind disabled as property on md-list-item', () => {
    const f = TestBed.createComponent(ListItemComponent);
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    const el = f.nativeElement.querySelector('md-list-item') as HTMLElement & {
      disabled?: boolean;
    };
    expect(el?.disabled).toBe(true);
  });

  it('should apply hostClass to md-list-item class attribute', () => {
    fixture.componentRef.setInput('type', 'button');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-list-item');
    expect(el.classList.contains('iu-list-item')).toBe(true);
    expect(el.classList.contains('iu-list-item--button')).toBe(true);
    expect(el.classList.contains('iu-list-item--disabled')).toBe(true);
  });
});
