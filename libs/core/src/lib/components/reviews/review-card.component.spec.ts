import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewCardComponent } from './review-card.component';
import type { PropertyReview } from './reviews.types';

describe('ReviewCardComponent', () => {
  let fixture: ComponentFixture<ReviewCardComponent>;
  let component: ReviewCardComponent;

  const makeReview = (
    overrides: Partial<PropertyReview> = {},
  ): PropertyReview => ({
    id: 'r1',
    authorName: 'Maria João Silva',
    rating: 4,
    body: 'Apartamento muito acolhedor e bem localizado.',
    date: '2026-05-20',
    verified: true,
    ...overrides,
  });

  async function setup(review: PropertyReview = makeReview()): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReviewCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('review', review);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Header ──────────────────────────────────────────────────────────────────
  it('renders the author name', () => {
    const name = fixture.nativeElement.querySelector(
      '.iu-review-card__name',
    ) as HTMLElement;
    expect(name.textContent).toContain('Maria João Silva');
  });

  it('shows the verified badge when verified is true', () => {
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__verified'),
    ).toBeTruthy();
  });

  it('hides the verified badge when verified is false', async () => {
    await setup(makeReview({ verified: false }));
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__verified'),
    ).toBeFalsy();
  });

  // ── Avatar / initials ───────────────────────────────────────────────────────
  it('shows initials when no avatar URL is set', () => {
    const span = fixture.nativeElement.querySelector(
      '.iu-review-card__avatar span',
    ) as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.textContent).toContain('MJ');
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__avatar img'),
    ).toBeFalsy();
  });

  it('shows the avatar image when authorAvatarUrl is set', async () => {
    await setup(makeReview({ authorAvatarUrl: 'https://example.com/a.jpg' }));
    const img = fixture.nativeElement.querySelector(
      '.iu-review-card__avatar img',
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/a.jpg');
  });

  it('initials() computes the first two uppercased initials', () => {
    expect(component.initials()).toBe('MJ');
  });

  it('initials() handles single-word names', async () => {
    await setup(makeReview({ authorName: 'Rui' }));
    expect(component.initials()).toBe('R');
  });

  // ── Body / expand ───────────────────────────────────────────────────────────
  it('renders the review body', () => {
    const body = fixture.nativeElement.querySelector(
      '.iu-review-card__body',
    ) as HTMLElement;
    expect(body.textContent).toContain('acolhedor');
  });

  it('isLong() is false for short bodies and hides the toggle', () => {
    expect(component.isLong()).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__toggle'),
    ).toBeFalsy();
  });

  it('isLong() is true for bodies over 200 chars and shows the toggle', async () => {
    await setup(makeReview({ body: 'a'.repeat(201) }));
    expect(component.isLong()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__toggle'),
    ).toBeTruthy();
  });

  it('toggle expands and collapses the body', async () => {
    await setup(makeReview({ body: 'a'.repeat(201) }));
    expect(component.isExpanded()).toBe(false);
    const toggle = fixture.nativeElement.querySelector(
      '.iu-review-card__toggle',
    ) as HTMLButtonElement;
    expect(toggle.textContent).toContain('Ler mais');

    toggle.click();
    fixture.detectChanges();
    expect(component.isExpanded()).toBe(true);
    expect(toggle.textContent).toContain('Mostrar menos');
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__body--clamped'),
    ).toBeFalsy();
  });

  it('applies the clamped class only when long and collapsed', async () => {
    await setup(makeReview({ body: 'a'.repeat(201) }));
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__body--clamped'),
    ).toBeTruthy();
  });

  // ── Landlord reply ──────────────────────────────────────────────────────────
  it('hides the landlord reply when none is provided', () => {
    expect(
      fixture.nativeElement.querySelector('.iu-review-card__reply'),
    ).toBeFalsy();
  });

  it('renders the landlord reply when provided', async () => {
    await setup(makeReview({ landlordReply: 'Obrigado pela sua estadia!' }));
    const reply = fixture.nativeElement.querySelector(
      '.iu-review-card__reply-body',
    ) as HTMLElement;
    expect(reply).toBeTruthy();
    expect(reply.textContent).toContain('Obrigado pela sua estadia!');
  });

  // ── Date ────────────────────────────────────────────────────────────────────
  it('formattedDate() formats a valid ISO date', () => {
    expect(component.formattedDate()).toContain('2026');
  });

  it('renders the formatted date next to the rating', () => {
    const date = fixture.nativeElement.querySelector(
      '.iu-review-card__date',
    ) as HTMLElement;
    expect(date.textContent).toContain('2026');
  });
});
