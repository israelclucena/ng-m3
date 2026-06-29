import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaintenanceRequestListComponent } from './maintenance-request-list.component';
import { MaintenanceRequestService } from '../../services/maintenance-request.service';

describe('MaintenanceRequestListComponent', () => {
  let fixture: ComponentFixture<MaintenanceRequestListComponent>;
  let component: MaintenanceRequestListComponent;
  let service: MaintenanceRequestService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceRequestListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceRequestListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MaintenanceRequestService);
    // No tenant/landlord id → ngOnInit is a no-op, so the service keeps its
    // default mock dataset (mr-001 in-progress, mr-002 pending, mr-003 resolved).
    fixture.detectChanges();
  });

  // ── default dataset ─────────────────────────────────────────────────────────

  it('renders the default mock requests', () => {
    expect(component.requests().length).toBe(3);
    expect(component.pendingCount()).toBe(1);
  });

  // ── status filtering ────────────────────────────────────────────────────────

  it('"all" filter returns every request', () => {
    component.activeFilter.set('all');
    expect(component.filtered().length).toBe(3);
  });

  it('filters by each concrete status', () => {
    component.activeFilter.set('pending');
    expect(component.filtered().map((r) => r.id)).toEqual(['mr-002']);

    component.activeFilter.set('in-progress');
    expect(component.filtered().map((r) => r.id)).toEqual(['mr-001']);

    component.activeFilter.set('resolved');
    expect(component.filtered().map((r) => r.id)).toEqual(['mr-003']);
  });

  // ── label / icon / colour maps ──────────────────────────────────────────────

  it('statusLabel maps status codes to display labels', () => {
    expect(component.statusLabel('pending')).toBe('Pending');
    expect(component.statusLabel('in-progress')).toBe('In Progress');
    expect(component.statusLabel('resolved')).toBe('Resolved');
    expect(component.statusLabel('rejected')).toBe('Rejected');
  });

  it('statusIcon maps status codes to material icons', () => {
    expect(component.statusIcon('pending')).toBe('schedule');
    expect(component.statusIcon('in-progress')).toBe('handyman');
    expect(component.statusIcon('resolved')).toBe('check_circle');
    expect(component.statusIcon('rejected')).toBe('cancel');
  });

  it('priorityColor maps priority codes to dot colours', () => {
    expect(component.priorityColor('low')).toBe('#4caf50');
    expect(component.priorityColor('medium')).toBe('#ff9800');
    expect(component.priorityColor('high')).toBe('#ff5722');
    expect(component.priorityColor('urgent')).toBe('#d32f2f');
  });

  // ── expand toggle ───────────────────────────────────────────────────────────

  it('toggleExpand opens then closes the same request', () => {
    expect(component.expandedId()).toBeNull();
    component.toggleExpand('mr-001');
    expect(component.expandedId()).toBe('mr-001');
    component.toggleExpand('mr-001');
    expect(component.expandedId()).toBeNull();
  });

  it('toggleExpand switches between requests', () => {
    component.toggleExpand('mr-001');
    component.toggleExpand('mr-002');
    expect(component.expandedId()).toBe('mr-002');
  });

  // ── landlord status mutations ───────────────────────────────────────────────

  it('markInProgress moves a pending request to in-progress', () => {
    component.markInProgress('mr-002');
    expect(service.requests().find((r) => r.id === 'mr-002')!.status).toBe(
      'in-progress',
    );
  });

  it('markResolved sets a resolution note and collapses the row', () => {
    component.toggleExpand('mr-002');
    component.markResolved('mr-002');

    const req = service.requests().find((r) => r.id === 'mr-002')!;
    expect(req.status).toBe('resolved');
    expect(req.resolution).toContain('addressed');
    expect(component.expandedId()).toBeNull();
  });

  it('markRejected rejects the request and collapses the row', () => {
    component.toggleExpand('mr-002');
    component.markRejected('mr-002');

    expect(service.requests().find((r) => r.id === 'mr-002')!.status).toBe(
      'rejected',
    );
    expect(component.expandedId()).toBeNull();
  });

  // ── empty state ─────────────────────────────────────────────────────────────

  it('shows the empty state and a reset action when a filter excludes all', () => {
    component.activeFilter.set('rejected'); // no rejected requests in the mock
    fixture.detectChanges();

    expect(component.filtered().length).toBe(0);
    const empty: HTMLElement = fixture.nativeElement.querySelector('.mrl-empty');
    expect(empty).not.toBeNull();
    const reset: HTMLButtonElement =
      fixture.nativeElement.querySelector('.mrl-btn-text');
    expect(reset).not.toBeNull();

    reset.click();
    fixture.detectChanges();
    expect(component.activeFilter()).toBe('all');
  });
});
