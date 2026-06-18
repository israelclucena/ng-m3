import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryChecklistComponent } from './inventory-checklist.component';
import { PropertyInventoryService } from '../../services/property-inventory.service';

describe('InventoryChecklistComponent', () => {
  let fixture: ComponentFixture<InventoryChecklistComponent>;
  let component: InventoryChecklistComponent;
  let service: PropertyInventoryService;

  const rooms = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.inv-room'));
  const items = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.inv-item'));
  const selects = (): HTMLSelectElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.inv-cond-select select'));
  const deltaItems = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.inv-delta-item'));
  const deductionPill = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.inv-deduction-pill');

  const setup = (moveOutMode = false) => {
    fixture = TestBed.createComponent(InventoryChecklistComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('moveOutMode', moveOutMode);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryChecklistComponent],
    }).compileComponents();
    service = TestBed.inject(PropertyInventoryService);
    service.resetAll();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  // ── Header + seed ──────────────────────────────────────────────────────────

  it('should render the title and seed summary', () => {
    setup();
    const title = fixture.nativeElement.querySelector('.inv-title');
    const subtitle = fixture.nativeElement.querySelector('.inv-subtitle');
    expect(title.textContent).toContain('Inventário do Recheio');
    expect(subtitle.textContent).toContain(`${service.totalItems()} items`);
  });

  it('should render one section per distinct room from the seed', () => {
    setup();
    const distinctRooms = new Set(service.items().map(i => i.room));
    expect(rooms().length).toBe(distinctRooms.size);
  });

  it('should render one row per inventory item', () => {
    setup();
    expect(items().length).toBe(service.totalItems());
  });

  // ── moveOutMode off ────────────────────────────────────────────────────────

  it('should not render move-out selects when moveOutMode is false', () => {
    setup(false);
    expect(selects().length).toBe(0);
    expect(deductionPill()).toBeNull();
  });

  it('should not render the inspection progress bar when moveOutMode is false', () => {
    setup(false);
    expect(fixture.nativeElement.querySelector('.inv-bar')).toBeNull();
  });

  // ── moveOutMode on ─────────────────────────────────────────────────────────

  it('should render one move-out select per item when moveOutMode is true', () => {
    setup(true);
    expect(selects().length).toBe(service.totalItems());
  });

  it('should show the inspection percentage in the subtitle', () => {
    setup(true);
    const subtitle = fixture.nativeElement.querySelector('.inv-subtitle');
    expect(subtitle.textContent).toContain('% inspeccionado');
  });

  it('should record a move-out condition when a select changes', () => {
    setup(true);
    const firstId = service.byRoom()[0].items[0].id;
    const select = selects()[0];
    select.value = 'damaged';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const item = service.items().find(i => i.id === firstId)!;
    expect(item.conditionAtMoveOut).toBe('damaged');
  });

  it('should ignore an empty selection without recording a condition', () => {
    setup(true);
    const spy = jest.spyOn(service, 'setMoveOutCondition');
    component.onConditionChange(service.items()[0], { target: { value: '' } } as unknown as Event);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should render delta lines and a deduction pill after a damaging move-out', () => {
    setup(true);
    // Pick a 'good' item and mark it 'damaged' (2-level drop → damage → 50% retention)
    const goodItem = service.items().find(i => i.conditionAtMoveIn === 'good')!;
    service.setMoveOutCondition(goodItem.id, 'damaged');
    fixture.detectChanges();

    expect(deltaItems().length).toBe(service.deltaLines().length);
    expect(service.totalSuggestedDeduction()).toBeGreaterThan(0);
    expect(deductionPill()).toBeTruthy();
  });

  // ── Label mapping helpers ──────────────────────────────────────────────────

  it('should map condition values to PT labels', () => {
    setup();
    expect(component.conditionLabel('new')).toBe('Novo');
    expect(component.conditionLabel('missing')).toBe('Em falta');
  });

  it('should fall back to the raw value for an unknown condition', () => {
    setup();
    expect(component.conditionLabel('bogus' as never)).toBe('bogus');
  });

  it('should map category values to PT labels', () => {
    setup();
    expect(component.categoryLabel('appliance')).toBe('Electrodomésticos');
    expect(component.categoryLabel('furniture')).toBe('Mobiliário');
  });

  it('should map severity to label and badge class', () => {
    setup();
    expect(component.severityLabel('loss')).toBe('Em falta');
    expect(component.severityClass('damage')).toBe('sev-damage');
    expect(component.severityClass('unchanged')).toBe('sev-unchanged');
  });
});
