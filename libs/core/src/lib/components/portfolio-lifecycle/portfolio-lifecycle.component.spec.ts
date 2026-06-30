import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PortfolioLifecycleWidgetComponent,
  type LifecycleStage,
} from './portfolio-lifecycle.component';
import {
  PortfolioMockService,
  type LeaseStatus,
} from '../../services/portfolio-mock.service';

/** Mirror of the component's private `stageFromLease` helper. */
function expectedStage(status: LeaseStatus): LifecycleStage {
  if (status === 'new') return 'move-in';
  if (status === 'ending') return 'move-out';
  return 'steady';
}

describe('PortfolioLifecycleWidgetComponent', () => {
  let fixture: ComponentFixture<PortfolioLifecycleWidgetComponent>;
  let component: PortfolioLifecycleWidgetComponent;
  let portfolio: PortfolioMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioLifecycleWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioLifecycleWidgetComponent);
    component = fixture.componentInstance;
    portfolio = TestBed.inject(PortfolioMockService);
    fixture.detectChanges();
  });

  // ── per-row derivation ──────────────────────────────────────────────────────

  it('builds one lifecycle row per portfolio property', () => {
    expect(component.rows().length).toBe(portfolio.properties().length);
    expect(component.rows().length).toBe(8);
  });

  it('derives the stage deterministically from lease.status', () => {
    const props = portfolio.properties();
    component.rows().forEach((row, i) => {
      expect(row.stage).toBe(expectedStage(props[i].lease.status));
    });
  });

  it('move-in rows carry a partial checklist bucket; others are complete', () => {
    for (const row of component.rows()) {
      if (row.stage === 'move-in') {
        expect([0.3, 0.55, 0.8]).toContain(row.moveInPct);
      } else {
        expect(row.moveInPct).toBe(1);
      }
    }
  });

  it('move-in rows never carry an inventory delta or deduction', () => {
    for (const row of component.rows()) {
      if (row.stage === 'move-in') {
        expect(row.inventoryDeltaCount).toBe(0);
        expect(row.worstSeverity).toBe('unchanged');
        expect(row.suggestedDeduction).toBe(0);
      }
    }
  });

  it('move-out deductions follow the worst severity (loss/damage billable, wear free)', () => {
    for (const row of component.rows()) {
      if (row.stage !== 'move-out') continue;
      if (row.worstSeverity === 'wear') {
        expect(row.suggestedDeduction).toBe(0);
      } else {
        expect(row.suggestedDeduction).toBeGreaterThan(0);
      }
    }
  });

  // ── KPIs ────────────────────────────────────────────────────────────────────

  it('counts only ending leases as active move-outs (1 in the mock set)', () => {
    const expected = portfolio
      .properties()
      .filter((p) => p.lease.status === 'ending').length;
    expect(component.moveOutActiveCount()).toBe(expected);
    expect(component.moveOutActiveCount()).toBe(1);
  });

  it('inventoryDeltaCount equals the number of rows with a delta', () => {
    const expected = component.rows().filter((r) => r.inventoryDeltaCount > 0).length;
    expect(component.inventoryDeltaCount()).toBe(expected);
  });

  it('moveInCompletionPct is the mean over rows (move-out/steady count as 1)', () => {
    const rows = component.rows();
    const ref =
      rows.reduce((acc, r) => acc + (r.stage === 'move-in' ? r.moveInPct : 1), 0) /
      rows.length;
    expect(component.moveInCompletionPct()).toBeCloseTo(ref, 6);
  });

  it('totalSuggestedDeduction equals the sum of per-row deductions', () => {
    const ref = component
      .rows()
      .reduce((acc, r) => acc + r.suggestedDeduction, 0);
    expect(component.totalSuggestedDeduction()).toBeCloseTo(ref, 6);
  });

  // ── label helpers ─────────────────────────────────────────────────────────

  it('maps stage labels', () => {
    expect(component.stageLabel('move-in')).toBe('Move-in');
    expect(component.stageLabel('move-out')).toBe('Move-out');
    expect(component.stageLabel('steady')).toBe('Steady');
  });

  it('maps severity labels', () => {
    expect(component.severityLabel('unchanged')).toBe('Sem delta');
    expect(component.severityLabel('wear')).toBe('Desgaste');
    expect(component.severityLabel('damage')).toBe('Estrago');
    expect(component.severityLabel('loss')).toBe('Perda');
  });

  // ── empty portfolio ─────────────────────────────────────────────────────────

  it('handles an empty portfolio without dividing by zero', () => {
    portfolio.properties.set([]);
    fixture.detectChanges();

    expect(component.rows()).toEqual([]);
    expect(component.moveOutActiveCount()).toBe(0);
    expect(component.inventoryDeltaCount()).toBe(0);
    expect(component.moveInCompletionPct()).toBe(0);
    expect(component.totalSuggestedDeduction()).toBe(0);
  });

  // ── DOM smoke ───────────────────────────────────────────────────────────────

  it('renders the property count in the subtitle', () => {
    const subtitle: HTMLElement =
      fixture.nativeElement.querySelector('.pl-subtitle');
    expect(subtitle.textContent).toContain('8 propriedades');
  });
});
