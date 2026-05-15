import { TestBed } from '@angular/core/testing';
import { MoveOutChecklistService, type MoveOutCategory } from './move-out-checklist.service';

describe('MoveOutChecklistService', () => {
  let service: MoveOutChecklistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoveOutChecklistService);
  });

  it('seeds with the full default task list, all unchecked', () => {
    const tasks = service.tasks();
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every(t => t.done === false)).toBe(true);
    expect(service.completed()).toBe(0);
  });

  it('seeds tasks across all five categories', () => {
    const cats = new Set(service.tasks().map(t => t.category));
    const expected: MoveOutCategory[] = ['utilities', 'admin', 'financial', 'logistics', 'inspection'];
    for (const c of expected) {
      expect(cats.has(c)).toBe(true);
    }
  });

  it('total reflects the seeded task count', () => {
    expect(service.total()).toBe(service.tasks().length);
  });

  it('progressPct starts at 0 and is 100 when every task is done', () => {
    expect(service.progressPct()).toBe(0);
    service.completeAll();
    expect(service.progressPct()).toBe(100);
    expect(service.isComplete()).toBe(true);
  });

  it('toggle flips done flag on a known id and leaves others untouched', () => {
    const firstId = service.tasks()[0].id;
    service.toggle(firstId);
    const t = service.tasks().find(x => x.id === firstId)!;
    expect(t.done).toBe(true);
    expect(service.completed()).toBe(1);

    // Re-toggle returns to unchecked
    service.toggle(firstId);
    expect(service.tasks().find(x => x.id === firstId)!.done).toBe(false);
    expect(service.completed()).toBe(0);
  });

  it('toggle on an unknown id is a no-op', () => {
    const before = service.tasks();
    service.toggle('does-not-exist');
    expect(service.tasks()).toEqual(before);
    expect(service.completed()).toBe(0);
  });

  it('completeAll marks every task as done', () => {
    service.completeAll();
    expect(service.tasks().every(t => t.done)).toBe(true);
    expect(service.completed()).toBe(service.total());
    expect(service.isComplete()).toBe(true);
  });

  it('resetAll restores the original unchecked seed', () => {
    service.completeAll();
    expect(service.completed()).toBeGreaterThan(0);
    service.resetAll();
    expect(service.completed()).toBe(0);
    expect(service.tasks().every(t => t.done === false)).toBe(true);
  });

  it('byCategory groups tasks under their category key', () => {
    const grouped = service.byCategory();
    let sumGroups = 0;
    for (const items of grouped.values()) {
      sumGroups += items.length;
    }
    expect(sumGroups).toBe(service.total());
    // utilities should hold ≥ 4 cancellation tasks (electricity, water, gas, internet)
    expect((grouped.get('utilities') ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('categoryProgress reports per-bucket completion and stays in sync after toggle', () => {
    const grouped = service.byCategory();
    const beforeUtil = service.categoryProgress().get('utilities')!;
    expect(beforeUtil.done).toBe(0);
    expect(beforeUtil.total).toBe((grouped.get('utilities') ?? []).length);
    expect(beforeUtil.pct).toBe(0);

    const firstUtility = (grouped.get('utilities') ?? [])[0];
    service.toggle(firstUtility.id);

    const afterUtil = service.categoryProgress().get('utilities')!;
    expect(afterUtil.done).toBe(1);
    expect(afterUtil.pct).toBe(Math.round((1 / afterUtil.total) * 100));
  });

  it('isComplete is false until every task is checked', () => {
    expect(service.isComplete()).toBe(false);
    const ids = service.tasks().map(t => t.id);
    for (let i = 0; i < ids.length - 1; i++) {
      service.toggle(ids[i]);
    }
    expect(service.isComplete()).toBe(false);
    service.toggle(ids[ids.length - 1]);
    expect(service.isComplete()).toBe(true);
  });
});
