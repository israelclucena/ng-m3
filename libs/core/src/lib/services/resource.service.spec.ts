import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { createHttpResource, ResourceState } from './resource.service';
import { signal } from '@angular/core';

describe('createHttpResource', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a resource with initial idle status', () => {
    TestBed.runInInjectionContext(() => {
      const res: ResourceState<string[]> = createHttpResource<string[]>('/api/test');
      // Before first resolution, status is loading or idle
      expect(['idle', 'loading']).toContain(res.status());
      expect(res.error()).toBeNull();
    });
  });

  it('should expose reload() method', () => {
    TestBed.runInInjectionContext(() => {
      const res = createHttpResource<string[]>('/api/test');
      expect(typeof res.reload).toBe('function');
    });
  });

  it('should accept a static URL string', () => {
    TestBed.runInInjectionContext(() => {
      const res = createHttpResource<{ id: number }>('/api/items');
      expect(res.data()).toBeUndefined();
    });
  });

  it('should accept a Signal<string> URL', () => {
    TestBed.runInInjectionContext(() => {
      const url = signal('/api/items');
      const res = createHttpResource<{ id: number }>(url);
      expect(res.status()).toBeDefined();
    });
  });

  it('should accept a defaultValue option', () => {
    TestBed.runInInjectionContext(() => {
      const res = createHttpResource<string[]>('/api/items', { defaultValue: [] });
      // defaultValue should appear before load completes
      expect(res.data()).toEqual([]);
    });
  });
});
