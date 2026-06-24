import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PropertyInspectionComponent } from './property-inspection.component';
import {
  PropertyInspectionService,
  type InspectionReport,
} from '../../services/property-inspection.service';

/** Build an inspection report, overridable per test. */
function report(over: Partial<InspectionReport> = {}): InspectionReport {
  return {
    id: 'insp-1',
    propertyId: 'prop-1',
    propertyTitle: 'T2 — Baixa',
    tenantId: 'tenant-1',
    landlordId: 'landlord-1',
    type: 'routine',
    scheduledDate: '2026-04-01',
    rooms: [
      { id: 'r1', name: 'Living Room', condition: 'good', notes: '', photos: [] },
    ],
    inspectorNotes: '',
    tenantSigned: false,
    landlordSigned: false,
    status: 'in-progress',
    ...over,
  };
}

describe('PropertyInspectionComponent', () => {
  let fixture: ComponentFixture<PropertyInspectionComponent>;
  let component: PropertyInspectionComponent;
  let mockSvc: {
    reports: ReturnType<typeof signal<InspectionReport[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    updateRoom: jest.Mock;
    complete: jest.Mock;
    sign: jest.Mock;
  };

  /** Access a protected member without leaking `any` across the suite. */
  function call<T = unknown>(name: string, ...args: unknown[]): T {
    return (component as unknown as Record<string, (...a: unknown[]) => T>)[name](...args);
  }

  beforeEach(async () => {
    mockSvc = {
      reports: signal<InspectionReport[]>([report()]),
      loading: signal(false),
      updateRoom: jest.fn(),
      complete: jest.fn(),
      sign: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PropertyInspectionComponent],
      providers: [{ provide: PropertyInspectionService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyInspectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / notesBuffers ──────────────────────────────────────────────────

  it('seeds an empty notes buffer for every report on init', () => {
    const buffers = (component as unknown as { notesBuffers: Record<string, string> }).notesBuffers;
    expect(buffers['insp-1']).toBe('');
  });

  // ── isEditable ───────────────────────────────────────────────────────────────

  it('treats draft and in-progress reports as editable', () => {
    expect(call<boolean>('isEditable', report({ status: 'draft' }))).toBe(true);
    expect(call<boolean>('isEditable', report({ status: 'in-progress' }))).toBe(true);
  });

  it('treats completed and signed reports as read-only', () => {
    expect(call<boolean>('isEditable', report({ status: 'completed' }))).toBe(false);
    expect(call<boolean>('isEditable', report({ status: 'signed' }))).toBe(false);
  });

  // ── formatType ───────────────────────────────────────────────────────────────

  it('title-cases each hyphen-separated segment of the type', () => {
    expect(call<string>('formatType', 'move-in')).toBe('Move-In');
    expect(call<string>('formatType', 'move-out')).toBe('Move-Out');
    expect(call<string>('formatType', 'routine')).toBe('Routine');
  });

  // ── typeIcon ─────────────────────────────────────────────────────────────────

  it('maps known inspection types to their icons', () => {
    expect(call<string>('typeIcon', 'move-in')).toBe('move_to_inbox');
    expect(call<string>('typeIcon', 'emergency')).toBe('emergency');
  });

  it('falls back to a default icon for an unknown type', () => {
    expect(call<string>('typeIcon', 'unknown')).toBe('fact_check');
  });

  // ── delegation to the service ────────────────────────────────────────────────

  it('delegates a room condition change to the service', () => {
    call('onConditionChange', 'insp-1', 'r1', 'poor');
    expect(mockSvc.updateRoom).toHaveBeenCalledWith('insp-1', 'r1', { condition: 'poor' });
  });

  it('delegates a room notes change to the service', () => {
    call('onNotesChange', 'insp-1', 'r1', 'cracked tile');
    expect(mockSvc.updateRoom).toHaveBeenCalledWith('insp-1', 'r1', { notes: 'cracked tile' });
  });

  it('completes a report with its buffered notes, then clears the buffer', () => {
    const buffers = (component as unknown as { notesBuffers: Record<string, string> }).notesBuffers;
    buffers['insp-1'] = 'All rooms inspected';

    call('onComplete', 'insp-1');

    expect(mockSvc.complete).toHaveBeenCalledWith('insp-1', 'All rooms inspected');
    expect(buffers['insp-1']).toBe('');
  });
});
