import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveOutChecklistComponent } from './move-out-checklist.component';
import { MoveOutChecklistService } from '../../services/move-out-checklist.service';

describe('MoveOutChecklistComponent', () => {
  let fixture: ComponentFixture<MoveOutChecklistComponent>;
  let component: MoveOutChecklistComponent;
  let service: MoveOutChecklistService;

  const checkboxes = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.mc-checkbox'));
  const sections = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.mc-cat'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveOutChecklistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveOutChecklistComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MoveOutChecklistService);
    service.resetAll();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header with the task counter', () => {
    const title = fixture.nativeElement.querySelector('.mc-title');
    const subtitle = fixture.nativeElement.querySelector('.mc-subtitle');
    expect(title.textContent).toContain('Move-Out Checklist');
    expect(subtitle.textContent).toContain('0/22 tarefas');
  });

  // ── Seed + progress ────────────────────────────────────────────────────────

  it('should seed twenty-two tasks, all unchecked', () => {
    expect(service.total()).toBe(22);
    expect(service.completed()).toBe(0);
    expect(service.progressPct()).toBe(0);
    expect(service.isComplete()).toBe(false);
  });

  it('should render one checkbox per task', () => {
    expect(checkboxes().length).toBe(22);
  });

  it('should render one section per non-empty category', () => {
    expect(sections().length).toBe(5);
  });

  it('should group tasks by category in the documented counts', () => {
    const groups = service.byCategory();
    expect(groups.get('admin')?.length).toBe(6);
    expect(groups.get('utilities')?.length).toBe(4);
    expect(groups.get('logistics')?.length).toBe(5);
    expect(groups.get('inspection')?.length).toBe(4);
    expect(groups.get('financial')?.length).toBe(3);
  });

  // ── Toggle ─────────────────────────────────────────────────────────────────

  it('should toggle a task when its checkbox is clicked', () => {
    checkboxes()[0].click();
    fixture.detectChanges();
    expect(service.completed()).toBe(1);
    expect(checkboxes()[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should untoggle a task on a second click', () => {
    checkboxes()[0].click();
    checkboxes()[0].click();
    fixture.detectChanges();
    expect(service.completed()).toBe(0);
  });

  it('should recompute the progress percentage on toggle', () => {
    service.toggle('denuncia-contrato');
    fixture.detectChanges();
    // 1 of 22 ≈ 5%
    expect(service.progressPct()).toBe(Math.round((1 / 22) * 100));
    const subtitle = fixture.nativeElement.querySelector('.mc-subtitle');
    expect(subtitle.textContent).toContain('1/22 tarefas');
  });

  // ── completeAll / resetAll ───────────────────────────────────────────────────

  it('should mark every task done and flag completion via completeAll()', () => {
    service.completeAll();
    fixture.detectChanges();
    expect(service.completed()).toBe(22);
    expect(service.progressPct()).toBe(100);
    expect(service.isComplete()).toBe(true);
    const subtitle = fixture.nativeElement.querySelector('.mc-subtitle');
    expect(subtitle.textContent).toContain('saída concluída');
  });

  it('should restore the unchecked seed via resetAll()', () => {
    service.completeAll();
    service.resetAll();
    fixture.detectChanges();
    expect(service.completed()).toBe(0);
    expect(service.isComplete()).toBe(false);
  });

  // ── Inputs ───────────────────────────────────────────────────────────────────

  it('should show per-category counters by default', () => {
    const counters = fixture.nativeElement.querySelectorAll('.mc-cat-counter');
    expect(counters.length).toBe(5);
  });

  it('should hide per-category counters when showCategoryProgress is false', () => {
    fixture.componentRef.setInput('showCategoryProgress', false);
    fixture.detectChanges();
    const counters = fixture.nativeElement.querySelectorAll('.mc-cat-counter');
    expect(counters.length).toBe(0);
  });

  // ── Timing labels ────────────────────────────────────────────────────────────

  it('should render D-, D-0 and D+ timing labels', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.mc-task-when'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    // denuncia-contrato is D-60, key-return is D-0, address changes are post (D+)
    expect(labels.some((t) => t === 'D-60')).toBe(true);
    expect(labels.some((t) => t === 'D-0')).toBe(true);
    expect(labels.some((t) => t?.startsWith('D+'))).toBe(true);
  });

  it('should reflect completion on the progress bar width', () => {
    service.completeAll();
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.mc-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });
});
