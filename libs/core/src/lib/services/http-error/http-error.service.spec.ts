import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpErrorService } from './http-error.service';

describe('HttpErrorService', () => {
  let service: HttpErrorService;
  let routerNavigate: jest.Mock;
  let routerUrl: string;

  const makeError = (over: Partial<{ status: number; error: unknown; url: string | null }> = {}) =>
    new HttpErrorResponse({
      status: over.status ?? 500,
      error: over.error,
      url: over.url ?? 'https://api.example.com/x',
    });

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    routerUrl = '/dashboard';
    routerNavigate = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: routerNavigate,
            get url() { return routerUrl; },
          },
        },
      ],
    });
    service = TestBed.inject(HttpErrorService);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('starts with no error and zero count', () => {
    expect(service.lastError()).toBeNull();
    expect(service.errorCount()).toBe(0);
  });

  it('handleHttpError populates lastError and increments errorCount', () => {
    service.handleHttpError(makeError({ status: 404 }));
    const info = service.lastError();
    expect(info).not.toBeNull();
    expect(info!.status).toBe(404);
    expect(info!.url).toBe('https://api.example.com/x');
    expect(info!.timestamp).toBeInstanceOf(Date);
    expect(service.errorCount()).toBe(1);

    service.handleHttpError(makeError({ status: 500 }));
    expect(service.errorCount()).toBe(2);
  });

  it('prefers server-provided error.message when present', () => {
    service.handleHttpError(makeError({ status: 422, error: { message: 'NIF inválido' } }));
    expect(service.lastError()!.message).toBe('NIF inválido');
  });

  it('maps known status codes to user-facing messages', () => {
    const cases: Array<[number, string]> = [
      [0,   'Network error — check your connection.'],
      [400, 'Bad request. Please check your input.'],
      [401, 'Session expired. Please log in again.'],
      [403, 'You don\'t have permission to do this.'],
      [404, 'The requested resource was not found.'],
      [409, 'Conflict — the resource may already exist.'],
      [422, 'Validation error. Please check your input.'],
      [429, 'Too many requests. Please slow down.'],
      [500, 'Server error. Please try again later.'],
      [503, 'Service unavailable. Please try again shortly.'],
    ];
    for (const [status, expected] of cases) {
      service.handleHttpError(makeError({ status }));
      expect(service.lastError()!.message).toBe(expected);
    }
  });

  it('falls back to a generic message for unknown status codes', () => {
    service.handleHttpError(makeError({ status: 418 }));
    expect(service.lastError()!.message).toBe('Unexpected error (418).');
  });

  it('navigates to /auth/login on 401 when not already in auth area', () => {
    routerUrl = '/dashboard';
    service.handleHttpError(makeError({ status: 401 }));
    expect(routerNavigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('does NOT redirect on 401 when already inside /auth', () => {
    routerUrl = '/auth/login';
    service.handleHttpError(makeError({ status: 401 }));
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('logs server errors (>= 500) via console.error', () => {
    service.handleHttpError(makeError({ status: 503 }));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('clearError resets lastError but preserves errorCount', () => {
    service.handleHttpError(makeError({ status: 500 }));
    expect(service.errorCount()).toBe(1);
    service.clearError();
    expect(service.lastError()).toBeNull();
    expect(service.errorCount()).toBe(1);
  });
});
