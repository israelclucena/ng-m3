import { TestBed } from '@angular/core/testing';
import {
  PropertyInventoryService,
  classifyDelta,
  suggestedDeduction,
  type InventoryItem,
  type InventoryItemCondition,
} from './property-inventory.service';

describe('PropertyInventoryService', () => {
  let service: PropertyInventoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyInventoryService);
  });

  it('seeds with a non-empty default inventory', () => {
    expect(service.items().length).toBeGreaterThan(0);
    expect(service.totalItems()).toBe(service.items().length);
  });

  it('totalUnits sums quantities across all items', () => {
    const expected = service.items().reduce((acc, it) => acc + it.quantity, 0);
    expect(service.totalUnits()).toBe(expected);
  });

  it('totalReplacementCost sums replacementCost × quantity, rounded to 2 dp', () => {
    const expected = round2(
      service.items().reduce((acc, it) => acc + it.replacementCostEur * it.quantity, 0),
    );
    expect(service.totalReplacementCost()).toBe(expected);
  });

  it('byRoom groups items by their room and computes per-group replacement total', () => {
    const groups = service.byRoom();
    let sumGroupItems = 0;
    let sumGroupCost = 0;
    for (const g of groups) {
      sumGroupItems += g.items.length;
      sumGroupCost += g.totalReplacementCost;
      const recomputed = round2(
        g.items.reduce((acc, it) => acc + it.replacementCostEur * it.quantity, 0),
      );
      expect(g.totalReplacementCost).toBe(recomputed);
    }
    expect(sumGroupItems).toBe(service.totalItems());
    expect(round2(sumGroupCost)).toBe(service.totalReplacementCost());
  });

  it('inspectedAtMoveOut starts at 0 and tracks setMoveOutCondition calls', () => {
    expect(service.inspectedAtMoveOut()).toBe(0);
    expect(service.moveOutInspectionPct()).toBe(0);

    const firstId = service.items()[0].id;
    service.setMoveOutCondition(firstId, 'good');
    expect(service.inspectedAtMoveOut()).toBe(1);
    expect(service.moveOutInspectionPct())
      .toBe(Math.round((1 / service.totalItems()) * 100));
  });

  it('setMoveOutCondition is a no-op for unknown ids', () => {
    const before = service.items();
    service.setMoveOutCondition('not-a-real-id', 'good');
    expect(service.items()).toEqual(before);
    expect(service.inspectedAtMoveOut()).toBe(0);
  });

  it('clearMoveOutConditions drops move-out condition but preserves items', () => {
    const totalBefore = service.totalItems();
    for (const it of service.items()) {
      service.setMoveOutCondition(it.id, 'fair');
    }
    expect(service.inspectedAtMoveOut()).toBe(totalBefore);
    service.clearMoveOutConditions();
    expect(service.inspectedAtMoveOut()).toBe(0);
    expect(service.totalItems()).toBe(totalBefore);
  });

  it('addItem appends a new item with sanitised inputs', () => {
    const before = service.totalItems();
    service.addItem({
      label: '  Mesa Centro  ',
      room: '  Sala  ',
      category: 'furniture',
      quantity: 1,
      conditionAtMoveIn: 'new',
      replacementCostEur: 120,
    });
    expect(service.totalItems()).toBe(before + 1);
    const added = service.items()[service.items().length - 1];
    expect(added.label).toBe('Mesa Centro');
    expect(added.room).toBe('Sala');
    expect(added.replacementCostEur).toBe(120);
    expect(added.quantity).toBe(1);
  });

  it('addItem coerces invalid quantity/cost into safe defaults', () => {
    service.addItem({
      label: '',
      room: '',
      category: 'fixture',
      quantity: -3,
      conditionAtMoveIn: 'good',
      replacementCostEur: Number.NaN,
    });
    const added = service.items()[service.items().length - 1];
    expect(added.label).toBe('Sem descrição');
    expect(added.room).toBe('Geral');
    expect(added.quantity).toBe(1);
    expect(added.replacementCostEur).toBe(0);
  });

  it('removeItem removes by id and is a no-op on unknown id', () => {
    const target = service.items()[0].id;
    const before = service.totalItems();
    service.removeItem(target);
    expect(service.totalItems()).toBe(before - 1);
    expect(service.items().find(i => i.id === target)).toBeUndefined();

    // unknown id no-op
    const snapshot = service.items();
    service.removeItem('does-not-exist');
    expect(service.items()).toEqual(snapshot);
  });

  it('resetAll restores the original seed length', () => {
    const seedLen = service.totalItems();
    service.addItem({
      label: 'Extra', room: 'Sala', category: 'furniture',
      quantity: 1, conditionAtMoveIn: 'new', replacementCostEur: 50,
    });
    expect(service.totalItems()).toBe(seedLen + 1);
    service.resetAll();
    expect(service.totalItems()).toBe(seedLen);
    expect(service.items().every(i => i.conditionAtMoveOut === undefined)).toBe(true);
  });

  it('setItems replaces the inventory wholesale', () => {
    const replacement: InventoryItem[] = [
      { id: 'a', label: 'A', room: 'X', category: 'furniture', quantity: 2,
        conditionAtMoveIn: 'good', replacementCostEur: 100 },
      { id: 'b', label: 'B', room: 'Y', category: 'appliance', quantity: 1,
        conditionAtMoveIn: 'new', replacementCostEur: 200 },
    ];
    service.setItems(replacement);
    expect(service.totalItems()).toBe(2);
    expect(service.totalReplacementCost()).toBe(400);
  });

  it('deltaLines is empty until at least one move-out condition is set', () => {
    expect(service.deltaLines().length).toBe(0);
    expect(service.totalSuggestedDeduction()).toBe(0);
  });

  it('classifyDelta handles unchanged, wear, damage and loss', () => {
    expect(classifyDelta('good', 'good')).toBe('unchanged');
    expect(classifyDelta('good', 'new')).toBe('unchanged'); // improvement
    expect(classifyDelta('good', 'fair')).toBe('wear');
    expect(classifyDelta('good', 'damaged')).toBe('damage');
    expect(classifyDelta('new', 'damaged')).toBe('damage');
    expect(classifyDelta('good', 'missing')).toBe('loss');
    expect(classifyDelta('new', 'missing')).toBe('loss');
  });

  it('suggestedDeduction is 0 for unchanged/wear, 50% for damage, full×qty for loss', () => {
    const item: InventoryItem = {
      id: 'x', label: 'Test', room: 'Sala', category: 'furniture',
      quantity: 3, conditionAtMoveIn: 'good', replacementCostEur: 200,
    };
    expect(suggestedDeduction(item, 'unchanged')).toBe(0);
    expect(suggestedDeduction(item, 'wear')).toBe(0);
    expect(suggestedDeduction(item, 'damage')).toBe(100); // 50% of 200
    expect(suggestedDeduction(item, 'loss')).toBe(600);   // 200 × 3
  });

  it('totalSuggestedDeduction aggregates across items with move-out conditions', () => {
    service.setItems([
      { id: 'a', label: 'Sofa', room: 'Sala', category: 'furniture',
        quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 400 },
      { id: 'b', label: 'Router', room: 'Sala', category: 'electronics',
        quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 60 },
      { id: 'c', label: 'Cadeira', room: 'Sala', category: 'furniture',
        quantity: 4, conditionAtMoveIn: 'good', replacementCostEur: 30 },
    ]);

    service.setMoveOutCondition('a', 'damaged'); // damage → 50% × 400 = 200
    service.setMoveOutCondition('b', 'missing'); // loss → 60 × 1 = 60
    service.setMoveOutCondition('c', 'fair');    // wear → 0

    const lines = service.deltaLines();
    expect(lines.length).toBe(3);
    const severities = lines.map(l => l.severity).sort();
    expect(severities).toEqual(['damage', 'loss', 'wear']);
    expect(service.totalSuggestedDeduction()).toBe(260);
  });

  it('moveOutInspectionPct reaches 100 when every item has a move-out condition', () => {
    const ids = service.items().map(i => i.id);
    const cond: InventoryItemCondition = 'good';
    for (const id of ids) service.setMoveOutCondition(id, cond);
    expect(service.moveOutInspectionPct()).toBe(100);
    expect(service.inspectedAtMoveOut()).toBe(service.totalItems());
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
