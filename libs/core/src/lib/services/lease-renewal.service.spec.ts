import { TestBed } from '@angular/core/testing';
import { LeaseRenewalService, type LeaseRenewal } from './lease-renewal.service';

describe('LeaseRenewalService', () => {
  let service: LeaseRenewalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaseRenewalService);
  });

  it('seeds with 4 mock renewals covering each status (expiring_soon, offer_sent, accepted, declined)', () => {
    expect(service.renewals().length).toBe(4);
    const statuses = service.renewals().map(r => r.status).sort();
    expect(statuses).toEqual(['accepted', 'declined', 'expiring_soon', 'offer_sent']);
  });

  it('filter defaults to "all" and filtered() returns every record', () => {
    expect(service.filter()).toBe('all');
    expect(service.filtered().length).toBe(service.renewals().length);
  });

  it('setFilter narrows filtered() to a single status', () => {
    service.setFilter('accepted');
    expect(service.filter()).toBe('accepted');
    expect(service.filtered().every(r => r.status === 'accepted')).toBe(true);
    expect(service.filtered().length).toBe(1);
  });

  it('kpis counts records per terminal status', () => {
    const k = service.kpis();
    expect(k.expiringSoon).toBe(1);
    expect(k.offerSent).toBe(1);
    expect(k.accepted).toBe(1);
    expect(k.declined).toBe(1);
  });

  it('kpis.urgent counts expiring_soon/offer_sent with daysUntilExpiry ≤ 30', () => {
    // Mock seed: rn001 offer_sent / 29d, rn002 expiring_soon / 43d
    // → only rn001 qualifies (≤30 + status filter)
    expect(service.kpis().urgent).toBe(1);
  });

  it('sendOffer transitions a renewal to offer_sent and recomputes rentChangePercent', () => {
    service.sendOffer('rn002', {
      leaseId: 'lease-002',
      proposedEndDate: '2027-05-15',
      proposedMonthlyRent: 1890, // +5% on 1800
      notes: 'Slight bump',
    });
    const updated = service.renewals().find(r => r.id === 'rn002') as LeaseRenewal;
    expect(updated.status).toBe('offer_sent');
    expect(updated.proposedMonthlyRent).toBe(1890);
    expect(updated.rentChangePercent).toBeCloseTo(5, 1);
    expect(updated.offerSentAt).toBeDefined();
    expect(updated.notes).toBe('Slight bump');
  });

  it('sendOffer keeps existing notes when payload omits notes', () => {
    const before = service.renewals().find(r => r.id === 'rn002') as LeaseRenewal;
    const originalNotes = before.notes;
    service.sendOffer('rn002', {
      leaseId: 'lease-002',
      proposedEndDate: '2027-05-15',
      proposedMonthlyRent: 1800,
    });
    const after = service.renewals().find(r => r.id === 'rn002') as LeaseRenewal;
    expect(after.notes).toBe(originalNotes);
  });

  it('accept moves a renewal to accepted and stamps respondedAt', () => {
    service.accept('rn001');
    const r = service.renewals().find(x => x.id === 'rn001') as LeaseRenewal;
    expect(r.status).toBe('accepted');
    expect(r.respondedAt).toBeDefined();
  });

  it('decline moves a renewal to declined with optional reason', () => {
    service.decline('rn001', 'Tenant moving abroad');
    const r = service.renewals().find(x => x.id === 'rn001') as LeaseRenewal;
    expect(r.status).toBe('declined');
    expect(r.declineReason).toBe('Tenant moving abroad');
    expect(r.respondedAt).toBeDefined();
  });

  it('mutator on unknown id is a no-op', () => {
    const before = service.renewals();
    service.accept('does-not-exist');
    service.decline('also-fake');
    service.sendOffer('nope', { leaseId: 'x', proposedEndDate: '2030-01-01', proposedMonthlyRent: 9999 });
    expect(service.renewals()).toEqual(before);
  });

  it('urgency classifies by daysUntilExpiry buckets (high ≤30, medium ≤60, low >60)', () => {
    const high: LeaseRenewal = { ...service.renewals()[0], daysUntilExpiry: 10 };
    const med: LeaseRenewal = { ...service.renewals()[0], daysUntilExpiry: 45 };
    const low: LeaseRenewal = { ...service.renewals()[0], daysUntilExpiry: 120 };
    expect(service.urgency(high)).toBe('high');
    expect(service.urgency(med)).toBe('medium');
    expect(service.urgency(low)).toBe('low');
  });
});
