import { Injectable, signal, computed } from '@angular/core';

export type ViewingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type ViewingType = 'in_person' | 'virtual';

export interface ViewingSlot {
  id: string;
  propertyId: string;
  propertyAddress: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  date: string;        // ISO date YYYY-MM-DD
  time: string;        // HH:MM
  durationMin: number;
  type: ViewingType;
  status: ViewingStatus;
  notes?: string;
  meetLink?: string;
  createdAt: string;
}

export interface RequestViewingPayload {
  propertyId: string;
  propertyAddress: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  date: string;
  time: string;
  durationMin?: number;
  type?: ViewingType;
  notes?: string;
}

const MOCK_VIEWINGS: ViewingSlot[] = [
  {
    id: 'v001',
    propertyId: 'prop-001',
    propertyAddress: 'Rua Augusta 45, Lisboa',
    tenantId: 'tenant-001',
    tenantName: 'Ana Silva',
    tenantEmail: 'ana.silva@email.com',
    date: '2026-04-05',
    time: '10:00',
    durationMin: 45,
    type: 'in_person',
    status: 'confirmed',
    notes: 'First-time renter, interested in 1-year lease',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'v002',
    propertyId: 'prop-002',
    propertyAddress: 'Avenida Liberdade 120, Lisboa',
    tenantId: 'tenant-002',
    tenantName: 'Carlos Mendes',
    tenantEmail: 'carlos@email.com',
    date: '2026-04-06',
    time: '14:30',
    durationMin: 30,
    type: 'virtual',
    status: 'pending',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'v003',
    propertyId: 'prop-001',
    propertyAddress: 'Rua Augusta 45, Lisboa',
    tenantId: 'tenant-003',
    tenantName: 'Sofia Costa',
    tenantEmail: 'sofia.costa@email.com',
    date: '2026-04-07',
    time: '11:00',
    durationMin: 45,
    type: 'in_person',
    status: 'pending',
    createdAt: '2026-04-02T09:00:00Z',
  },
  {
    id: 'v004',
    propertyId: 'prop-003',
    propertyAddress: 'Bairro Alto 8, Lisboa',
    tenantId: 'tenant-004',
    tenantName: 'Miguel Ferreira',
    tenantEmail: 'miguel@email.com',
    date: '2026-03-30',
    time: '16:00',
    durationMin: 30,
    type: 'in_person',
    status: 'completed',
    createdAt: '2026-03-25T14:00:00Z',
  },
  {
    id: 'v005',
    propertyId: 'prop-002',
    propertyAddress: 'Avenida Liberdade 120, Lisboa',
    tenantId: 'tenant-005',
    tenantName: 'Rita Oliveira',
    tenantEmail: 'rita@email.com',
    date: '2026-04-03',
    time: '09:30',
    durationMin: 45,
    type: 'in_person',
    status: 'cancelled',
    notes: 'Tenant cancelled — found another property',
    createdAt: '2026-04-01T07:00:00Z',
  },
];

/** ViewingSchedulerService — manages property viewing appointments. */
@Injectable({ providedIn: 'root' })
export class ViewingSchedulerService {
  private _viewings = signal<ViewingSlot[]>(MOCK_VIEWINGS);
  private _filter = signal<ViewingStatus | 'all'>('all');

  readonly viewings = this._viewings.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly filtered = computed(() => {
    const f = this._filter();
    return f === 'all'
      ? this._viewings()
      : this._viewings().filter(v => v.status === f);
  });

  readonly upcoming = computed(() =>
    this._viewings().filter(v => v.status === 'pending' || v.status === 'confirmed')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  );

  readonly kpis = computed(() => {
    const all = this._viewings();
    return {
      pending: all.filter(v => v.status === 'pending').length,
      confirmed: all.filter(v => v.status === 'confirmed').length,
      completed: all.filter(v => v.status === 'completed').length,
      cancelled: all.filter(v => v.status === 'cancelled').length,
      total: all.length,
    };
  });

  /**
   * Request a new property viewing.
   * @param payload - viewing request details
   */
  request(payload: RequestViewingPayload): ViewingSlot {
    const slot: ViewingSlot = {
      id: `v${Date.now()}`,
      propertyId: payload.propertyId,
      propertyAddress: payload.propertyAddress,
      tenantId: payload.tenantId,
      tenantName: payload.tenantName,
      tenantEmail: payload.tenantEmail,
      date: payload.date,
      time: payload.time,
      durationMin: payload.durationMin ?? 45,
      type: payload.type ?? 'in_person',
      status: 'pending',
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };
    this._viewings.update(v => [slot, ...v]);
    return slot;
  }

  /**
   * Confirm a pending viewing.
   * @param id - viewing slot id
   */
  confirm(id: string): void {
    this._viewings.update(vs =>
      vs.map(v => v.id === id ? { ...v, status: 'confirmed' as ViewingStatus } : v)
    );
  }

  /**
   * Cancel a viewing.
   * @param id - viewing slot id
   */
  cancel(id: string): void {
    this._viewings.update(vs =>
      vs.map(v => v.id === id ? { ...v, status: 'cancelled' as ViewingStatus } : v)
    );
  }

  /**
   * Mark a viewing as completed.
   * @param id - viewing slot id
   */
  complete(id: string): void {
    this._viewings.update(vs =>
      vs.map(v => v.id === id ? { ...v, status: 'completed' as ViewingStatus } : v)
    );
  }

  /**
   * Mark a viewing as no-show.
   * @param id - viewing slot id
   */
  markNoShow(id: string): void {
    this._viewings.update(vs =>
      vs.map(v => v.id === id ? { ...v, status: 'no_show' as ViewingStatus } : v)
    );
  }

  /** Set list filter. */
  setFilter(f: ViewingStatus | 'all'): void {
    this._filter.set(f);
  }
}
