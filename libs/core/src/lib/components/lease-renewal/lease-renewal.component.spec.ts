import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaseRenewalComponent } from './lease-renewal.component';
import { LeaseRenewalService, LeaseRenewal } from '../../services/lease-renewal.service';

describe('LeaseRenewalComponent', () => {
  let fixture: ComponentFixture<LeaseRenewalComponent>;
  let component: LeaseRenewalComponent;
  let service: LeaseRenewalService;

  const find = (id: string): LeaseRenewal =>
    service.renewals().find(r => r.id === id)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseRenewalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaseRenewalComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(LeaseRenewalService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    expect(fixture.nativeElement.querySelector('.lr-title').textContent)
      .toContain('Lease Renewals');
  });

  // ── KPI rendering (mock seed) ───────────────────────────────────────────────

  it('should render KPI counts derived from the seed data', () => {
    const k = service.kpis();
    expect(k.expiringSoon).toBe(1);
    expect(k.offerSent).toBe(1);
    expect(k.accepted).toBe(1);
    expect(k.declined).toBe(1);
    const nums = Array.from(
      fixture.nativeElement.querySelectorAll('.lr-kpi-num'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(nums).toEqual(['1', '1', '1', '1']);
  });

  it('should show the urgent banner in landlord mode when leases are urgent', () => {
    component.mode = 'landlord';
    fixture.detectChanges();
    expect(service.kpis().urgent).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.lr-urgent-banner')).toBeTruthy();
  });

  // ── statusLabel helper ──────────────────────────────────────────────────────

  it('should map known renewal statuses to human labels', () => {
    expect(component.statusLabel('expiring_soon')).toBe('Expiring Soon');
    expect(component.statusLabel('offer_sent')).toBe('Offer Sent');
    expect(component.statusLabel('accepted')).toBe('Accepted');
    expect(component.statusLabel('declined')).toBe('Declined');
    expect(component.statusLabel('expired')).toBe('Expired');
  });

  it('should pass through an unknown status', () => {
    expect(component.statusLabel('weird')).toBe('weird');
  });

  // ── Filtering ───────────────────────────────────────────────────────────────

  it('should narrow the list when a status filter is applied', () => {
    service.setFilter('accepted');
    expect(service.filtered().length).toBe(1);
    expect(service.filtered()[0].status).toBe('accepted');

    service.setFilter('all');
    expect(service.filtered().length).toBe(4);
  });

  // ── Offer form open/submit ──────────────────────────────────────────────────

  it('should open the inline offer form pre-filled from the renewal', () => {
    const r = find('rn002'); // expiring_soon
    component.sendOffer(r);

    expect(component.offerFormId()).toBe('rn002');
    expect(component.offerDate()).toBe(r.proposedEndDate);
    expect(component.offerRent()).toBe(r.proposedMonthlyRent);
  });

  it('should submit an offer, recompute rent change, and close the form', () => {
    const r = find('rn002'); // current 1800
    component.sendOffer(r);
    component.offerRent.set(1900);
    component.submitOffer(r);

    const updated = find('rn002');
    expect(updated.status).toBe('offer_sent');
    expect(updated.proposedMonthlyRent).toBe(1900);
    expect(updated.rentChangePercent).toBe(5.6); // (1900-1800)/1800 ≈ 5.6%
    expect(component.offerFormId()).toBeNull();
  });

  it('should fall back to the renewal values when the form fields are empty', () => {
    const r = find('rn002');
    component.offerDate.set('');
    component.offerRent.set(0);
    component.submitOffer(r);

    const updated = find('rn002');
    expect(updated.proposedMonthlyRent).toBe(r.proposedMonthlyRent);
    expect(updated.proposedEndDate).toBe(r.proposedEndDate);
  });

  // ── Tenant actions via service ──────────────────────────────────────────────

  it('should accept an offer and stamp the response', () => {
    service.accept('rn001');
    expect(find('rn001').status).toBe('accepted');
    expect(find('rn001').respondedAt).toBeTruthy();
  });

  it('should decline an offer with a reason', () => {
    service.decline('rn001', 'Moving abroad');
    expect(find('rn001').status).toBe('declined');
    expect(find('rn001').declineReason).toBe('Moving abroad');
  });

  // ── urgency helper ──────────────────────────────────────────────────────────

  it('should classify urgency by days until expiry', () => {
    expect(service.urgency({ daysUntilExpiry: 10 } as LeaseRenewal)).toBe('high');
    expect(service.urgency({ daysUntilExpiry: 45 } as LeaseRenewal)).toBe('medium');
    expect(service.urgency({ daysUntilExpiry: 90 } as LeaseRenewal)).toBe('low');
  });
});
