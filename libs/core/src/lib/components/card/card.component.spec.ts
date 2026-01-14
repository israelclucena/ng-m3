import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  let component: CardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render title', () => {
    fixture.componentRef.setInput('title', 'T2 Alfama');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.iu-card__title');
    expect(el?.textContent?.trim()).toBe('T2 Alfama');
  });

  it('should apply elevated variant by default', () => {
    expect(fixture.nativeElement.querySelector('.iu-card--elevated')).toBeTruthy();
  });

  it('should emit cardClick when clickable', () => {
    fixture.componentRef.setInput('clickable', true);
    fixture.detectChanges();
    let clicked = false;
    component.cardClick.subscribe(() => clicked = true);
    fixture.nativeElement.querySelector('.iu-card').click();
    expect(clicked).toBe(true);
  });
});
