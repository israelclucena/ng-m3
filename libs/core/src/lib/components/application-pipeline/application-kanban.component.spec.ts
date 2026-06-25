import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationKanbanComponent } from './application-kanban.component';
import { ApplicationPipelineService } from '../../services/application-pipeline.service';

/** A stop-propagation-able fake event. */
function ev(): Event {
  return { stopPropagation: jest.fn() } as unknown as Event;
}

describe('ApplicationKanbanComponent', () => {
  let fixture: ComponentFixture<ApplicationKanbanComponent>;
  let component: ApplicationKanbanComponent;
  let mockSvc: {
    load: jest.Mock;
    moveToReview: jest.Mock;
    approve: jest.Mock;
    reject: jest.Mock;
    totalCount: () => number;
    loading: () => boolean;
    columnCounts: () => Record<string, number>;
    columnDefs: () => unknown[];
  };

  beforeEach(async () => {
    mockSvc = {
      load: jest.fn(),
      moveToReview: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      totalCount: () => 0,
      loading: () => false,
      columnCounts: () => ({ applied: 0, underReview: 0, approved: 0, rejected: 0 }),
      columnDefs: () => [],
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationKanbanComponent],
      providers: [{ provide: ApplicationPipelineService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationKanbanComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('landlordId', 'landlord-1');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the pipeline for its landlord on init', () => {
    fixture.detectChanges();
    expect(mockSvc.load).toHaveBeenCalledWith('landlord-1');
  });

  // ── selection ─────────────────────────────────────────────────────────────────

  it('toggles a card selection on and off', () => {
    component.toggleSelect('app-1');
    expect(component.selectedId()).toBe('app-1');
    component.toggleSelect('app-1');
    expect(component.selectedId()).toBeNull();
  });

  it('clears a stale rejection form when selecting a different card', () => {
    component.rejectingId.set('app-1');
    component.toggleSelect('app-2');
    expect(component.rejectingId()).toBeNull();
  });

  // ── column actions delegate + emit ──────────────────────────────────────────────

  it('moves a card to review and clears the selection', () => {
    const e = ev();
    component.selectedId.set('app-1');
    component.moveToReview('app-1', e);
    expect(e.stopPropagation).toHaveBeenCalled();
    expect(mockSvc.moveToReview).toHaveBeenCalledWith('app-1');
    expect(component.selectedId()).toBeNull();
  });

  it('approves a card, clears selection, and emits the id', () => {
    const emitted: string[] = [];
    component.applicationApproved.subscribe((id) => emitted.push(id));
    component.approve('app-1', ev());
    expect(mockSvc.approve).toHaveBeenCalledWith('app-1');
    expect(component.selectedId()).toBeNull();
    expect(emitted).toEqual(['app-1']);
  });

  it('opens the rejection form with an empty reason', () => {
    component.rejectReason.set('stale');
    component.startReject('app-1', ev());
    expect(component.rejectingId()).toBe('app-1');
    expect(component.rejectReason()).toBe('');
  });

  it('confirms a rejection with its reason and emits', () => {
    const emitted: string[] = [];
    component.applicationRejected.subscribe((id) => emitted.push(id));
    component.rejectingId.set('app-1');
    component.rejectReason.set('Rendimento insuficiente');
    component.confirmReject('app-1', ev());
    expect(mockSvc.reject).toHaveBeenCalledWith('app-1', 'Rendimento insuficiente');
    expect(component.rejectingId()).toBeNull();
    expect(component.selectedId()).toBeNull();
    expect(emitted).toEqual(['app-1']);
  });

  it('emits createLease without touching the service', () => {
    const emitted: string[] = [];
    component.createLease.subscribe((id) => emitted.push(id));
    component.emitApproved('app-1', ev());
    expect(emitted).toEqual(['app-1']);
    expect(mockSvc.approve).not.toHaveBeenCalled();
  });

  // ── display helpers ─────────────────────────────────────────────────────────────

  it('builds up to two uppercase initials from a name', () => {
    expect(component.initials('Ana Ferreira')).toBe('AF');
    expect(component.initials('João Pedro Silva')).toBe('JP');
  });

  it('maps known employment types and falls back to the raw value', () => {
    expect(component.employmentShort('employed')).toBe('Empregado');
    expect(component.employmentShort('self-employed')).toBe('Independente');
    expect(component.employmentShort('freelancer')).toBe('freelancer');
  });

  it('renders a dash for a missing date', () => {
    expect(component.formatDate(undefined)).toBe('—');
  });
});
