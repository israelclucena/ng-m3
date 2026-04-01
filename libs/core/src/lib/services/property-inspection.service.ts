import { Injectable, signal, computed } from '@angular/core';

/** Type of property inspection */
export type InspectionType = 'move-in' | 'move-out' | 'routine' | 'emergency';

/** Condition rating for a room */
export type RoomCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

/** State of the inspection report */
export type InspectionStatus = 'draft' | 'in-progress' | 'completed' | 'signed';

/** Room-level inspection record */
export interface InspectionRoom {
  id: string;
  name: string;
  condition: RoomCondition;
  notes: string;
  /** Photo file references or URLs */
  photos: string[];
}

/** Full inspection report for a property */
export interface InspectionReport {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  landlordId: string;
  type: InspectionType;
  scheduledDate: string;
  completedDate?: string;
  rooms: InspectionRoom[];
  overallCondition?: RoomCondition;
  inspectorNotes: string;
  tenantSigned: boolean;
  landlordSigned: boolean;
  status: InspectionStatus;
}

/** Payload to create a new inspection report */
export interface CreateInspectionPayload {
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  landlordId: string;
  type: InspectionType;
  scheduledDate: string;
  /** Room names — service builds InspectionRoom objects */
  rooms: string[];
}

/**
 * PropertyInspectionService — manages property inspection lifecycle.
 * Supports move-in, move-out, routine, and emergency inspections with
 * per-room condition tracking and dual-signature completion flow.
 */
@Injectable({ providedIn: 'root' })
export class PropertyInspectionService {
  readonly reports = signal<InspectionReport[]>(this._seed());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly completedReports = computed(() =>
    this.reports().filter(r => r.status === 'completed' || r.status === 'signed')
  );

  readonly pendingReports = computed(() =>
    this.reports().filter(r => r.status === 'draft' || r.status === 'in-progress')
  );

  /**
   * Create a new blank inspection report.
   * @param payload Inspection details and room name list
   */
  create(payload: CreateInspectionPayload): InspectionReport {
    const report: InspectionReport = {
      id: `insp-${Date.now()}`,
      propertyId: payload.propertyId,
      propertyTitle: payload.propertyTitle,
      tenantId: payload.tenantId,
      landlordId: payload.landlordId,
      type: payload.type,
      scheduledDate: payload.scheduledDate,
      rooms: payload.rooms.map((name, i) => ({
        id: `room-${i}`,
        name,
        condition: 'good',
        notes: '',
        photos: [],
      })),
      inspectorNotes: '',
      tenantSigned: false,
      landlordSigned: false,
      status: 'draft',
    };
    this.reports.update(list => [report, ...list]);
    return report;
  }

  /**
   * Update a room's condition or notes within a report.
   * @param reportId Target report
   * @param roomId   Target room within the report
   * @param patch    Fields to update on the room
   */
  updateRoom(reportId: string, roomId: string, patch: Partial<InspectionRoom>): void {
    this.reports.update(list =>
      list.map(r => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          status: r.status === 'draft' ? ('in-progress' as InspectionStatus) : r.status,
          rooms: r.rooms.map(room =>
            room.id === roomId ? { ...room, ...patch } : room
          ),
        };
      })
    );
  }

  /**
   * Mark an inspection as completed with inspector notes.
   * Calculates overall condition from worst room.
   * @param reportId Target report
   * @param notes    Inspector summary notes
   */
  complete(reportId: string, notes: string): void {
    const overall = this._calcOverall(reportId);
    this.reports.update(list =>
      list.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: 'completed' as InspectionStatus,
              completedDate: new Date().toISOString().split('T')[0],
              inspectorNotes: notes,
              overallCondition: overall,
            }
          : r
      )
    );
  }

  /**
   * Record a signature for tenant or landlord.
   * Both signed → status becomes 'signed'.
   * @param reportId Target report
   * @param role     Who is signing
   */
  sign(reportId: string, role: 'tenant' | 'landlord'): void {
    this.reports.update(list =>
      list.map(r => {
        if (r.id !== reportId) return r;
        const updated: InspectionReport = { ...r };
        if (role === 'tenant') updated.tenantSigned = true;
        if (role === 'landlord') updated.landlordSigned = true;
        if (updated.tenantSigned && updated.landlordSigned) {
          updated.status = 'signed';
        }
        return updated;
      })
    );
  }

  private _calcOverall(reportId: string): RoomCondition {
    const report = this.reports().find(r => r.id === reportId);
    if (!report) return 'good';
    const order: RoomCondition[] = ['excellent', 'good', 'fair', 'poor', 'damaged'];
    return report.rooms.reduce<RoomCondition>((worst, room) => {
      return order.indexOf(room.condition) > order.indexOf(worst) ? room.condition : worst;
    }, 'excellent');
  }

  private _seed(): InspectionReport[] {
    return [
      {
        id: 'insp-001',
        propertyId: 'prop-001',
        propertyTitle: 'Apartamento T2 — Baixa-Chiado',
        tenantId: 'tenant-001',
        landlordId: 'landlord-001',
        type: 'move-in',
        scheduledDate: '2026-01-01',
        completedDate: '2026-01-01',
        rooms: [
          { id: 'r1', name: 'Living Room', condition: 'excellent', notes: 'Freshly painted, no marks', photos: [] },
          { id: 'r2', name: 'Bedroom', condition: 'good', notes: 'Minor scuff on door frame', photos: [] },
          { id: 'r3', name: 'Bathroom', condition: 'good', notes: '', photos: [] },
          { id: 'r4', name: 'Kitchen', condition: 'excellent', notes: 'New appliances installed', photos: [] },
        ],
        overallCondition: 'good',
        inspectorNotes: 'Property in excellent condition. Tenant acknowledged all items.',
        tenantSigned: true,
        landlordSigned: true,
        status: 'signed',
      },
      {
        id: 'insp-002',
        propertyId: 'prop-001',
        propertyTitle: 'Apartamento T2 — Baixa-Chiado',
        tenantId: 'tenant-001',
        landlordId: 'landlord-001',
        type: 'routine',
        scheduledDate: '2026-04-05',
        rooms: [
          { id: 'r1', name: 'Living Room', condition: 'good', notes: '', photos: [] },
          { id: 'r2', name: 'Bedroom', condition: 'good', notes: '', photos: [] },
          { id: 'r3', name: 'Bathroom', condition: 'fair', notes: 'Grout needs cleaning around shower', photos: [] },
          { id: 'r4', name: 'Kitchen', condition: 'good', notes: '', photos: [] },
        ],
        inspectorNotes: '',
        tenantSigned: false,
        landlordSigned: false,
        status: 'in-progress',
      },
    ];
  }
}
