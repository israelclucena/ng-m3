import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveInChecklistComponent } from './move-in-checklist.component';
import { MoveInChecklistService } from '../../services/move-in-checklist.service';

describe('MoveInChecklistComponent', () => {
  let fixture: ComponentFixture<MoveInChecklistComponent>;
  let component: MoveInChecklistComponent;
  let service: MoveInChecklistService;

  const checkboxes = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.mc-checkbox'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveInChecklistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveInChecklistComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MoveInChecklistService);
    service.resetAll();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header with the task counter', () => {
    const title = fixture.nativeElement.querySelector('.mc-title');
    const subtitle = fixture.nativeElement.querySelector('.mc-subtitle');
    expect(title.textContent).toContain('Move-In Checklist');
    expect(subtitle.textContent).toContain('0/16 tarefas');
  });

  // ── Seed + progress ────────────────────────────────────────────────────────

  it('should seed sixteen tasks, all unchecked', () => {
    expect(service.total()).toBe(16);
    expect(service.completed()).toBe(0);
    expect(service.progressPct()).toBe(0);
    expect(service.isComplete()).toBe(false);
  });

  it('should render one checkbox per task', () => {
    expect(checkboxes().length).toBe(16);
  });

  it('should render one section per non-empty category', () => {
    const sections = fixture.nativeElement.querySelectorAll('.mc-cat');
    expect(sections.length).toBe(5);
  });

  it('should group tasks by category', () => {
    const groups = service.byCategory();
    expect(groups.get('utilities')?.length).toBe(4);
    expect(groups.get('admin')?.length).toBe(3);
    expect(groups.get('financial')?.length).toBe(3);
    expect(groups.get('logistics')?.length).toBe(3);
    expect(groups.get('inspection')?.length).toBe(3);
  });

  // ── Toggling ───────────────────────────────────────────────────────────────

  it('should mark a task done and recompute progress', () => {
    service.toggle('deposit');
    expect(service.completed()).toBe(1);
    // round(1/16*100) = 6
    expect(service.progressPct()).toBe(6);
    expect(service.categoryProgress().get('financial')?.done).toBe(1);
  });

  it('should toggle a task back to undone', () => {
    service.toggle('deposit');
    service.toggle('deposit');
    expect(service.completed()).toBe(0);
  });

  it('should toggle via the rendered checkbox button', () => {
    checkboxes()[0].click();
    fixture.detectChanges();
    expect(service.completed()).toBe(1);
  });

  // ── Completion ─────────────────────────────────────────────────────────────

  it('should report completion once every task is checked', () => {
    service.completeAll();
    fixture.detectChanges();
    expect(service.isComplete()).toBe(true);
    expect(service.progressPct()).toBe(100);
    const subtitle = fixture.nativeElement.querySelector('.mc-subtitle');
    expect(subtitle.textContent).toContain('pronto para mudar');
  });

  it('should clear all done flags on resetAll', () => {
    service.completeAll();
    service.resetAll();
    expect(service.completed()).toBe(0);
    expect(service.isComplete()).toBe(false);
  });

  // ── Category progress toggle input ─────────────────────────────────────────

  it('should show per-category counters by default', () => {
    expect(component.showCategoryProgress()).toBe(true);
    expect(fixture.nativeElement.querySelector('.mc-cat-counter')).toBeTruthy();
  });

  it('should hide per-category counters when disabled', () => {
    fixture.componentRef.setInput('showCategoryProgress', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mc-cat-counter')).toBeNull();
  });
});
