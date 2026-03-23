/**
 * AvailabilityResourceService — visual demo story.
 *
 * Since services don't render, we showcase the service via a thin
 * wrapper component that calls watch() and displays the derived signals.
 * In a real app, you'd inject AvailabilityResourceService in your
 * property detail page and pass `availSvc.bookedRanges()` to
 * <iu-property-availability>.
 *
 * Feature flag: AVAILABILITY_REALTIME
 */
import type { Meta, StoryObj } from '@storybook/angular';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { AvailabilityResourceService } from './availability-resource.service';

// ─── Demo wrapper component ───────────────────────────────────────────────────

@Component({
  selector: 'iu-avail-demo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideHttpClient()],
  template: `
    <div style="padding:24px;font-family:'Google Sans',sans-serif;max-width:540px">
      <h3 style="margin:0 0 4px">AvailabilityResourceService</h3>
      <p style="color:#666;font-size:13px;margin:0 0 20px">
        Demonstrates the signal-driven availability service (Sprint 028 — AVAILABILITY_REALTIME).
        The service wraps <code>createHttpResource()</code> with auto-polling.
      </p>

      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button (click)="startWatching()" style="padding:8px 16px;border-radius:20px;border:none;background:#6750A4;color:#fff;cursor:pointer">
          Watch prop-001
        </button>
        <button (click)="stopWatching()" style="padding:8px 16px;border-radius:20px;border:1.5px solid #ccc;background:none;cursor:pointer">
          Stop
        </button>
        <button (click)="manualRefresh()" style="padding:8px 16px;border-radius:20px;border:1.5px solid #ccc;background:none;cursor:pointer">
          Manual Refresh
        </button>
      </div>

      <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px">
          <span style="color:#666">Loading:</span>
          <strong>{{ svc.loading() }}</strong>

          <span style="color:#666">Error:</span>
          <strong [style.color]="svc.hasError() ? 'red' : 'inherit'">{{ svc.hasError() }}</strong>

          <span style="color:#666">Booked ranges:</span>
          <strong>{{ svc.bookedRanges().length }}</strong>

          <span style="color:#666">Last updated:</span>
          <strong>{{ svc.lastUpdated() ?? '—' }}</strong>
        </div>
      </div>

      @if (svc.bookedRanges().length > 0) {
        <div>
          <h4 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#666">
            Booked Ranges
          </h4>
          @for (r of svc.bookedRanges(); track r.start.toISOString()) {
            <div style="padding:8px 12px;background:white;border-radius:8px;margin-bottom:6px;font-size:13px;border:1px solid #e0e0e0">
              {{ r.start | date:'dd MMM' }} → {{ r.end | date:'dd MMM yyyy' }}
            </div>
          }
        </div>
      } @else {
        <div style="text-align:center;color:#999;padding:20px;background:#f5f5f5;border-radius:12px;font-size:13px">
          No data yet — click "Watch prop-001" to start
        </div>
      }

      <div style="margin-top:20px;padding:12px;background:#EEF2FF;border-radius:8px;font-size:12px;color:#3730a3">
        <strong>Note:</strong> This story doesn't make real HTTP requests (no backend running).
        The service signals will show <em>loading → error</em> after timeout.
        In production, point the API base to your availability endpoint.
      </div>
    </div>
  `,
})
class AvailabilityDemoComponent implements OnInit, OnDestroy {
  readonly svc = inject(AvailabilityResourceService);

  ngOnInit()    { this.startWatching(); }
  ngOnDestroy() { this.svc.stop(); }

  startWatching()  { this.svc.watch('prop-001', 0, '/api'); }
  stopWatching()   { this.svc.stop(); }
  manualRefresh()  { this.svc.refresh(); }
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<AvailabilityDemoComponent> = {
  title: 'Sprint 028/AvailabilityResourceService',
  component: AvailabilityDemoComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**AvailabilityResourceService** wraps \`createHttpResource()\` (Sprint 027)
with property-specific polling, derived signals, and an auto-refresh mechanism.

### Usage
\`\`\`ts
readonly availSvc = inject(AvailabilityResourceService);

ngOnInit() {
  // Poll every 30 seconds
  this.availSvc.watch(this.propertyId(), 30_000);
}

ngOnDestroy() {
  this.availSvc.stop();
}
\`\`\`

### Template
\`\`\`html
<iu-property-availability
  [propertyId]="propertyId"
  [bookedDates]="availSvc.bookedRanges()"
/>
\`\`\`

Feature flag: \`AVAILABILITY_REALTIME\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AvailabilityDemoComponent>;

/** Default demo — shows service state signals in real time */
export const Default: Story = {};

/** WithPollInterval — describes how polling is configured (no visual difference in Storybook) */
export const WithPollInterval: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Polling configuration example:
\`availSvc.watch('prop-123', 30_000)\` — refreshes every 30 s.
Call \`availSvc.stop()\` in \`ngOnDestroy\` to clear the interval.
        `,
      },
    },
  },
};
