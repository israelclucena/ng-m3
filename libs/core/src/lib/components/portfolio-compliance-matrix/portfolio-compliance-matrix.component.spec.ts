import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioComplianceMatrixComponent } from './portfolio-compliance-matrix.component';
import {
  PortfolioMockService,
  type ComplianceState,
  type PortfolioProperty,
} from '../../services/portfolio-mock.service';

/** Mirror of the component's private lease-flag derivation. */
function leaseFlag(p: PortfolioProperty): 'ok' | 'escalation_due' | 'ending' {
  if (p.lease.status === 'escalation_due') return 'escalation_due';
  if (p.lease.status === 'ending') return 'ending';
  return 'ok';
}

/** Mirror of the component's private worst-of-two-states helper. */
function worst(states: ComplianceState[]): ComplianceState {
  if (states.includes('expired')) return 'expired';
  if (states.includes('warning')) return 'warning';
  return 'ok';
}

describe('PortfolioComplianceMatrixComponent', () => {
  let fixture: ComponentFixture<PortfolioComplianceMatrixComponent>;
  let component: PortfolioComplianceMatrixComponent;
  let portfolio: PortfolioMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComplianceMatrixComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioComplianceMatrixComponent);
    component = fixture.componentInstance;
    portfolio = TestBed.inject(PortfolioMockService);
    fixture.detectChanges();
  });

  // ── rows ────────────────────────────────────────────────────────────────────

  it('builds one compliance row per portfolio property', () => {
    expect(component.rows().length).toBe(portfolio.properties().length);
    expect(component.rows().length).toBe(8);
  });

  it('maps each row state straight from the mock certificate/insurance/lease state', () => {
    const props = portfolio.properties();
    component.rows().forEach((r, i) => {
      const p = props[i];
      expect(r.energy).toBe(p.energy.state);
      expect(r.insurance).toBe(p.insurance.state);
      expect(r.lease).toBe(leaseFlag(p));
      expect(r.worst).toBe(worst([p.energy.state, p.insurance.state]));
    });
  });

  // ── aggregate counters ────────────────────────────────────────────────────────

  it('counts OK cells per dimension mirroring the mock', () => {
    const props = portfolio.properties();
    expect(component.energyOk()).toBe(props.filter((p) => p.energy.state === 'ok').length);
    expect(component.insuranceOk()).toBe(props.filter((p) => p.insurance.state === 'ok').length);
    expect(component.leaseOk()).toBe(props.filter((p) => leaseFlag(p) === 'ok').length);
  });

  it('derives OK rates as count / total', () => {
    const total = component.rows().length;
    expect(component.energyOkRate()).toBeCloseTo(component.energyOk() / total, 6);
    expect(component.insuranceOkRate()).toBeCloseTo(component.insuranceOk() / total, 6);
    expect(component.leaseOkRate()).toBeCloseTo(component.leaseOk() / total, 6);
  });

  it('computes overall OK rate as fully-compliant (worst ok AND lease ok) share', () => {
    const total = component.rows().length;
    const fully = component.rows().filter((r) => r.worst === 'ok' && r.lease === 'ok').length;
    expect(component.overallOkRate()).toBeCloseTo(fully / total, 6);
  });

  // ── priority actions ──────────────────────────────────────────────────────────

  it('surfaces an action for every non-compliant cell', () => {
    const props = portfolio.properties();
    let expected = 0;
    for (const p of props) {
      if (p.energy.state !== 'ok') expected++;
      if (p.insurance.state !== 'ok') expected++;
      if (p.lease.status === 'escalation_due' || p.lease.status === 'ending') expected++;
    }
    expect(component.actions().length).toBe(expected);
  });

  it('classifies expired certificates/insurance as critical and the rest as soon', () => {
    const props = portfolio.properties();
    const expectedCritical =
      props.filter((p) => p.energy.state === 'expired').length +
      props.filter((p) => p.insurance.state === 'expired').length;
    expect(component.criticalActions()).toBe(expectedCritical);
    expect(component.soonActions()).toBe(component.actions().length - expectedCritical);
  });

  it('sorts all critical actions ahead of the soon ones', () => {
    const severities = component.actions().map((a) => a.severity);
    const lastCritical = severities.lastIndexOf('critical');
    const firstSoon = severities.indexOf('soon');
    if (lastCritical >= 0 && firstSoon >= 0) {
      expect(lastCritical).toBeLessThan(firstSoon);
    }
  });

  // ── label helpers ─────────────────────────────────────────────────────────────

  it('labels compliance states in Portuguese', () => {
    expect(component.stateLabel('ok')).toBe('OK');
    expect(component.stateLabel('warning')).toBe('Aviso');
    expect(component.stateLabel('expired')).toBe('Expirado');
  });

  it('labels lease flags and maps them to a cell colour state', () => {
    expect(component.leaseLabel('ok')).toBe('OK');
    expect(component.leaseLabel('escalation_due')).toBe('Actualizar');
    expect(component.leaseLabel('ending')).toBe('Termina');
    expect(component.leaseStateColor('ok')).toBe('ok');
    expect(component.leaseStateColor('escalation_due')).toBe('warning');
    expect(component.leaseStateColor('ending')).toBe('warning');
  });

  // ── empty portfolio ───────────────────────────────────────────────────────────

  it('handles an empty portfolio without dividing by zero', () => {
    portfolio.properties.set([]);
    fixture.detectChanges();
    expect(component.rows()).toEqual([]);
    expect(component.energyOkRate()).toBe(0);
    expect(component.insuranceOkRate()).toBe(0);
    expect(component.leaseOkRate()).toBe(0);
    expect(component.overallOkRate()).toBe(0);
    expect(component.actions()).toEqual([]);
  });

  // ── DOM smoke ─────────────────────────────────────────────────────────────────

  it('renders the property count in the subtitle', () => {
    const subtitle: HTMLElement = fixture.nativeElement.querySelector('.pcm-subtitle');
    expect(subtitle.textContent).toContain('8 propriedades');
  });

  it('renders one table body row per property', () => {
    const rows = fixture.nativeElement.querySelectorAll('.pcm-table tbody tr');
    expect(rows.length).toBe(component.rows().length);
  });

  it('renders one action item per pending action', () => {
    const items = fixture.nativeElement.querySelectorAll('.pcm-action-item');
    expect(items.length).toBe(component.actions().length);
  });

  it('shows the empty-state message only when there are no actions', () => {
    expect(fixture.nativeElement.querySelector('.pcm-empty')).toBeNull();
    portfolio.properties.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pcm-empty')).not.toBeNull();
  });
});
