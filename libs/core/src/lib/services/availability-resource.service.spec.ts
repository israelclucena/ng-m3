import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AvailabilityResourceService } from './availability-resource.service';

interface RawResponse {
  propertyId: string;
  bookedRanges: Array<{ start: string; end: string }>;
  lastUpdated: string;
}

function rawResponse(overrides: Partial<RawResponse> = {}): RawResponse {
  return {
    propertyId: 'p1',
    bookedRanges: [
      { start: '2026-06-01T00:00:00Z', end: '2026-06-07T00:00:00Z' },
      { start: '2026-06-15T00:00:00Z', end: '2026-06-20T00:00:00Z' },
    ],
    lastUpdated: '2026-05-25T10:00:00Z',
    ...overrides,
  };
}

async function settle(): Promise<void> {
  // Two microtask flushes + a synchronous tick covers Angular's effect scheduler
  // and the resource() loader transition.
  await Promise.resolve();
  await Promise.resolve();
  TestBed.tick();
  await Promise.resolve();
}

describe('AvailabilityResourceService', () => {
  let service: AvailabilityResourceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AvailabilityResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stop();
    // Drain any pending requests so verify() doesn't complain about
    // the constructor-time empty-URL load or in-flight polling loads.
    for (const req of httpMock.match(() => true)) {
      try { req.flush(rawResponse({ propertyId: '' })); } catch { /* already handled */ }
    }
    httpMock.verify();
  });

  it('initial state: empty bookedRanges, no error, lastUpdated null', () => {
    expect(service.bookedRanges()).toEqual([]);
    expect(service.hasError()).toBe(false);
    expect(service.lastUpdated()).toBeNull();
  });

  it('asState() exposes the public surface with snapshot field', () => {
    const state = service.asState();
    expect(state.bookedRanges).toBe(service.bookedRanges);
    expect(state.loading).toBe(service.loading);
    expect(state.lastUpdated).toBe(service.lastUpdated);
    expect(state.hasError).toBe(service.hasError);
    expect(state.snapshot).toBe(service.snapshot);
    expect(typeof state.refresh).toBe('function');
  });

  it('watch(propertyId) triggers a GET /api/availability/<id>', async () => {
    service.watch('p1');
    await settle();

    const req = httpMock.expectOne('/api/availability/p1');
    expect(req.request.method).toBe('GET');
    req.flush(rawResponse({ propertyId: 'p1' }));
  });

  it('watch(propertyId, _, apiBase) honors the custom base URL', async () => {
    service.watch('p9', 0, '/v2');
    await settle();

    const req = httpMock.expectOne('/v2/availability/p9');
    req.flush(rawResponse({ propertyId: 'p9' }));
  });

  it('bookedRanges() maps response strings to Date objects', async () => {
    service.watch('p1');
    await settle();
    httpMock.expectOne('/api/availability/p1').flush(rawResponse());
    await settle();

    const ranges = service.bookedRanges();
    expect(ranges.length).toBe(2);
    expect(ranges[0].start).toBeInstanceOf(Date);
    expect(ranges[0].end).toBeInstanceOf(Date);
    expect(ranges[0].start.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('lastUpdated is set from the response after a successful fetch', async () => {
    service.watch('p1');
    await settle();
    httpMock
      .expectOne('/api/availability/p1')
      .flush(rawResponse({ lastUpdated: '2026-05-25T11:30:00Z' }));
    await settle();
    await settle();

    expect(service.lastUpdated()).toBe('2026-05-25T11:30:00Z');
  });

  it('snapshot() exposes ResourceSnapshot with success status after fetch', async () => {
    service.watch('p1');
    await settle();
    httpMock.expectOne('/api/availability/p1').flush(rawResponse());
    await settle();

    const snap = service.snapshot();
    expect(snap.status).toBe('success');
    expect(snap.isLoading).toBe(false);
    expect(snap.error).toBeNull();
    expect(typeof snap.timestamp).toBe('number');
    expect(Array.isArray(snap.data)).toBe(true);
  });

  it('hasError() becomes true when all retries are exhausted', async () => {
    jest.useFakeTimers();
    try {
      service.watch('p1');
      await settle();
      // First attempt
      httpMock.expectOne('/api/availability/p1').error(
        new ProgressEvent('error'),
        { status: 500, statusText: 'Server Error' },
      );
      // The createHttpResource wrapper retries once with a 200ms back-off
      await Promise.resolve();
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      await Promise.resolve();
      TestBed.tick();
      await Promise.resolve();
      // Retry attempt
      httpMock.expectOne('/api/availability/p1').error(
        new ProgressEvent('error'),
        { status: 500, statusText: 'Server Error' },
      );
      await Promise.resolve();
      await Promise.resolve();
      TestBed.tick();
      await Promise.resolve();
    } finally {
      jest.useRealTimers();
    }

    expect(service.hasError()).toBe(true);
  });

  it('refresh() triggers a re-fetch of the same URL', async () => {
    service.watch('p1');
    await settle();
    httpMock.expectOne('/api/availability/p1').flush(rawResponse());
    await settle();

    service.refresh();
    await settle();
    httpMock.expectOne('/api/availability/p1').flush(rawResponse());
  });

  it('watch with pollIntervalMs registers a setInterval that is cleared on stop()', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    try {
      service.watch('p1', 5000);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

      service.stop();
      expect(clearIntervalSpy).toHaveBeenCalled();
    } finally {
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    }
  });

  it('combinedWith(other) returns a Signal<ResourceSnapshot>', () => {
    const other = TestBed.inject(AvailabilityResourceService);
    const combined = service.combinedWith(other);

    expect(typeof combined).toBe('function');
    const snap = combined();
    expect(snap).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        isLoading: expect.any(Boolean),
        timestamp: expect.any(Number),
      }),
    );
  });
});
