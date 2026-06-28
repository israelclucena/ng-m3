import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsuranceTrackerComponent } from './insurance-tracker.component';
import {
  InsuranceTrackerService,
  InsurancePolicy,
  InsuranceType,
} from '../../services/insurance-tracker.service';

/** Policy fixture, overridable per test. */
function policyInput(
  over: Partial<Omit<InsurancePolicy, 'id'>> = {},
): Omit<InsurancePolicy, 'id'> {
  return {
    propertyId: 'p1',
    insurer: 'Fidelidade',
    policyNumber: 'POL-1',
    type: 'multirriscos' as InsuranceType,
    startDate: '2025-06-15',
    endDate: '2027-06-15',
    premium: 320,
    ...over,
  };
}

describe('InsuranceTrackerComponent', () => {
  let fixture: ComponentFixture<InsuranceTrackerComponent>;
  let component: InsuranceTrackerComponent;
  let service: InsuranceTrackerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsuranceTrackerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InsuranceTrackerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(InsuranceTrackerService);
    service.reset();
    // Pin "today" so status assertions are deterministic.
    service.today.set('2026-06-15');
    fixture.detectChanges();
  });

  // ── status derivation ─────────────────────────────────────────────────────────

  it('classifies an active policy (>30 days remaining)', () => {
    const p = service.addPolicy(policyInput({ endDate: '2027-06-15' }));
    expect(component['daysLeft'](p)).toBe(365);
    expect(component['statusOf'](p)).toBe('active');
    expect(component['statusLine'](p)).toBe('365 dias restantes');
  });

  it('classifies a policy expiring within 30 days', () => {
    const p = service.addPolicy(policyInput({ endDate: '2026-07-01' }));
    expect(component['statusOf'](p)).toBe('expiring');
    expect(component['statusLine'](p)).toContain('Expira em');
  });

  it('classifies an expired policy', () => {
    const p = service.addPolicy(policyInput({ endDate: '2026-06-01' }));
    expect(component['statusOf'](p)).toBe('expired');
    expect(component['statusLine'](p)).toContain('Expirada há');
  });

  it('reports "Expira hoje" when the end date is today', () => {
    const p = service.addPolicy(policyInput({ endDate: '2026-06-15' }));
    expect(component['daysLeft'](p)).toBe(0);
    expect(component['statusLine'](p)).toBe('Expira hoje');
  });

  // ── tab-driven list ───────────────────────────────────────────────────────────

  it('currentList() follows the active tab', () => {
    service.addPolicy(policyInput({ policyNumber: 'A', endDate: '2027-06-15' })); // active
    service.addPolicy(policyInput({ policyNumber: 'E', endDate: '2026-06-01' })); // expired

    component['tab'].set('active');
    expect(component['currentList']().map((p) => p.policyNumber)).toEqual(['A']);

    component['tab'].set('expired');
    expect(component['currentList']().map((p) => p.policyNumber)).toEqual(['E']);
  });

  it('empty copy changes with the selected tab', () => {
    component['tab'].set('active');
    expect(component['emptyTitle']()).toBe('Sem apólices activas');
    component['tab'].set('expiring');
    expect(component['emptyTitle']()).toBe('Nenhuma apólice a expirar');
    expect(component['emptyHint']()).toContain('30 dias');
  });

  // ── draft + submit ──────────────────────────────────────────────────────────────

  it('canSubmit() requires all fields and a positive premium', () => {
    component['openForm']();
    expect(component['canSubmit']()).toBe(false);

    component['draft'].set({
      propertyId: 'p1',
      insurer: 'Ageas',
      policyNumber: 'POL-9',
      type: 'rc',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      premium: 200,
    });
    expect(component['canSubmit']()).toBe(true);
  });

  it('setField / setType / setPremium mutate the draft', () => {
    component['openForm']();
    component['setField']('insurer', { target: { value: 'Tranquilidade' } } as unknown as Event);
    expect(component['draft']().insurer).toBe('Tranquilidade');

    component['setType']({ target: { value: 'conteudo' } } as unknown as Event);
    expect(component['draft']().type).toBe('conteudo');

    component['setPremium']({ target: { value: '450' } } as unknown as Event);
    expect(component['draft']().premium).toBe(450);
  });

  it('setPremium clamps invalid input to 0', () => {
    component['openForm']();
    component['setPremium']({ target: { value: 'abc' } } as unknown as Event);
    expect(component['draft']().premium).toBe(0);
  });

  it('submit adds a policy and closes the form when valid', () => {
    component['openForm']();
    component['draft'].set({
      propertyId: 'p2',
      insurer: 'Ageas',
      policyNumber: 'POL-NEW',
      type: 'rc',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      premium: 150,
    });
    component['submit']({ preventDefault() {} } as unknown as Event);

    expect(service.policies().some((p) => p.policyNumber === 'POL-NEW')).toBe(true);
    expect(component['formOpen']()).toBe(false);
  });

  it('submit is a no-op when the draft is invalid', () => {
    component['openForm']();
    component['submit']({ preventDefault() {} } as unknown as Event);
    expect(service.policies().length).toBe(0);
  });

  // ── renew ─────────────────────────────────────────────────────────────────────

  it('renew extends the policy end date by one year', () => {
    const p = service.addPolicy(policyInput({ endDate: '2026-07-01' }));
    component['renew'](p);
    const updated = service.policies().find((x) => x.id === p.id)!;
    expect(updated.endDate).toBe('2027-07-01');
  });

  // ── labels + DOM ──────────────────────────────────────────────────────────────

  it('typeLabel maps insurance type codes to PT labels', () => {
    expect(component['typeLabel']('multirriscos')).toBe('Multirriscos');
    expect(component['typeLabel']('rc')).toBe('Resp. Civil');
    expect(component['typeLabel']('conteudo')).toBe('Conteúdo');
  });

  it('header subtitle reflects the live policy counts', () => {
    service.addPolicy(policyInput({ endDate: '2027-06-15' })); // active
    service.addPolicy(policyInput({ endDate: '2026-07-01' })); // expiring (also active)
    service.addPolicy(policyInput({ endDate: '2026-06-01' })); // expired
    fixture.detectChanges();
    const subtitle: HTMLElement = fixture.nativeElement.querySelector('.it-subtitle');
    expect(subtitle.textContent).toContain('2 activas');
    expect(subtitle.textContent).toContain('1 a expirar');
    expect(subtitle.textContent).toContain('1 expiradas');
  });
});
