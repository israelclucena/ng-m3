import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyReviewsComponent } from './property-reviews.component';
import { PropertyReview, StarRating } from './reviews.types';

let nextId = 0;

/** Build a review, overridable per test. */
function review(over: Partial<PropertyReview> = {}): PropertyReview {
  nextId += 1;
  return {
    id: `rev-${nextId}`,
    authorName: 'Tester',
    rating: 5 as StarRating,
    body: 'Great place',
    date: '2026-01-01',
    ...over,
  };
}

describe('PropertyReviewsComponent', () => {
  let fixture: ComponentFixture<PropertyReviewsComponent>;
  let component: PropertyReviewsComponent;

  /** Create the component with a given set of reviews bound to the required input. */
  function setup(reviews: PropertyReview[], pageSize?: number): void {
    fixture = TestBed.createComponent(PropertyReviewsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('reviews', reviews);
    if (pageSize !== undefined) {
      fixture.componentRef.setInput('pageSize', pageSize);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    nextId = 0;
    await TestBed.configureTestingModule({
      imports: [PropertyReviewsComponent],
    }).compileComponents();
  });

  it('should create', () => {
    setup([review()]);
    expect(component).toBeTruthy();
  });

  // ── summary ──────────────────────────────────────────────────────────────────

  it('computes average, total and per-star breakdown', () => {
    setup([
      review({ rating: 5 }),
      review({ rating: 5 }),
      review({ rating: 3 }),
      review({ rating: 2 }),
    ]);
    const s = component.summary();
    expect(s.total).toBe(4);
    expect(s.average).toBeCloseTo((5 + 5 + 3 + 2) / 4, 5);
    expect(s.breakdown[5]).toBe(2);
    expect(s.breakdown[3]).toBe(1);
    expect(s.breakdown[2]).toBe(1);
    expect(s.breakdown[1]).toBe(0);
  });

  it('returns a zeroed summary for an empty review list', () => {
    setup([]);
    const s = component.summary();
    expect(s.average).toBe(0);
    expect(s.total).toBe(0);
    expect(s.breakdown).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  // ── sorting ──────────────────────────────────────────────────────────────────

  it('sorts by highest rating first', () => {
    setup([review({ rating: 2 }), review({ rating: 5 }), review({ rating: 3 })]);
    component.sortBy.set('highest');
    expect(component.sorted().map(r => r.rating)).toEqual([5, 3, 2]);
  });

  it('sorts by lowest rating first', () => {
    setup([review({ rating: 4 }), review({ rating: 1 }), review({ rating: 3 })]);
    component.sortBy.set('lowest');
    expect(component.sorted().map(r => r.rating)).toEqual([1, 3, 4]);
  });

  it('sorts by most recent date by default', () => {
    setup([
      review({ id: 'old', date: '2025-01-01' }),
      review({ id: 'new', date: '2026-06-01' }),
      review({ id: 'mid', date: '2025-09-01' }),
    ]);
    expect(component.sorted().map(r => r.id)).toEqual(['new', 'mid', 'old']);
  });

  // ── pagination ───────────────────────────────────────────────────────────────

  it('shows only one page of reviews initially', () => {
    setup(Array.from({ length: 8 }, () => review()), 5);
    expect(component.visibleReviews().length).toBe(5);
    expect(component.hasMore()).toBe(true);
    expect(component.remaining()).toBe(3);
  });

  it('reveals the next page on loadMore', () => {
    setup(Array.from({ length: 8 }, () => review()), 5);
    component.loadMore();
    expect(component.visibleReviews().length).toBe(8);
    expect(component.hasMore()).toBe(false);
    expect(component.remaining()).toBe(0);
  });

  it('reports no more pages when everything fits on the first page', () => {
    setup([review(), review()], 5);
    expect(component.hasMore()).toBe(false);
    expect(component.remaining()).toBe(0);
  });

  // ── breakdown bars ───────────────────────────────────────────────────────────

  it('counts reviews per star level', () => {
    setup([review({ rating: 5 }), review({ rating: 5 }), review({ rating: 1 })]);
    expect(component.barCount(5)).toBe(2);
    expect(component.barCount(1)).toBe(1);
    expect(component.barCount(4)).toBe(0);
  });

  it('expresses bar width as a percentage of the total', () => {
    setup([review({ rating: 5 }), review({ rating: 5 }), review({ rating: 1 }), review({ rating: 1 })]);
    expect(component.barWidth(5)).toBe(50);
    expect(component.barWidth(1)).toBe(50);
    expect(component.barWidth(3)).toBe(0);
  });

  it('guards bar width against an empty review list', () => {
    setup([]);
    expect(component.barWidth(5)).toBe(0);
  });
});
