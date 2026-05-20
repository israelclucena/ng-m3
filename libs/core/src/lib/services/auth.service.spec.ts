import { TestBed } from '@angular/core/testing';
import {
  AuthService,
  type LoginCredentials,
  type RegisterData,
} from './auth.service';

describe('AuthService', () => {
  const createService = (): AuthService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(AuthService);
  };

  // The service uses real setTimeout under the hood (800/1000 ms). We swap to
  // fake timers and advance manually so tests stay fast and deterministic.
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Drive a pending promise that's blocked on setTimeout. */
  const flush = async (ms: number) => {
    jest.advanceTimersByTime(ms);
    // Yield to the microtask queue so the await resolves.
    await Promise.resolve();
    await Promise.resolve();
  };

  // ── Initial state ────────────────────────────────────────────────────────

  it('starts unauthenticated with no user, no error, not loading', () => {
    const svc = createService();
    expect(svc.user()).toBeNull();
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.loading()).toBe(false);
    expect(svc.authError()).toBeNull();
    expect(svc.displayName()).toBe('');
    expect(svc.initials()).toBe('');
  });

  // ── login() ──────────────────────────────────────────────────────────────

  it('login flips loading=true while pending and back to false on completion', async () => {
    const svc = createService();
    const pending = svc.login({ email: 'a@b.com', password: 'secret123' });
    expect(svc.loading()).toBe(true);
    await flush(800);
    const result = await pending;
    expect(result.success).toBe(true);
    expect(svc.loading()).toBe(false);
  });

  it('login with valid credentials sets a tenant user and clears error', async () => {
    const svc = createService();
    const p = svc.login({ email: 'jane.doe@example.com', password: 'secret123' });
    await flush(800);
    const result = await p;

    expect(result).toEqual({ success: true });
    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.user()).not.toBeNull();
    expect(svc.user()!.email).toBe('jane.doe@example.com');
    expect(svc.user()!.role).toBe('tenant');
    expect(svc.user()!.id).toMatch(/^user_\d+$/);
    expect(svc.authError()).toBeNull();
  });

  it('login derives display name from email local-part', async () => {
    const svc = createService();
    const p = svc.login({ email: 'maria.santos@example.com', password: 'secret123' });
    await flush(800);
    await p;
    expect(svc.displayName()).toBe('Maria Santos');
    expect(svc.initials()).toBe('MS');
  });

  it('login derives single-name initials when email local-part is one token', async () => {
    const svc = createService();
    const p = svc.login({ email: 'joao@example.com', password: 'secret123' });
    await flush(800);
    await p;
    expect(svc.displayName()).toBe('Joao');
    expect(svc.initials()).toBe('J');
  });

  it('login rejects empty email', async () => {
    const svc = createService();
    const p = svc.login({ email: '', password: 'secret123' });
    await flush(800);
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Email e password são obrigatórios');
    expect(svc.authError()).toBe('Email e password são obrigatórios');
    expect(svc.isAuthenticated()).toBe(false);
  });

  it('login rejects empty password', async () => {
    const svc = createService();
    const p = svc.login({ email: 'a@b.com', password: '' });
    await flush(800);
    const result = await p;
    expect(result.success).toBe(false);
    expect(svc.authError()).toBe('Email e password são obrigatórios');
  });

  it('login rejects short password (<6 chars) with localised message', async () => {
    const svc = createService();
    const p = svc.login({ email: 'a@b.com', password: '12345' });
    await flush(800);
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Password incorrecta');
    expect(svc.authError()).toBe('Password incorrecta');
    expect(svc.isAuthenticated()).toBe(false);
  });

  it('login clears previous error before starting a new attempt', async () => {
    const svc = createService();
    // First: failed attempt
    const fail = svc.login({ email: 'a@b.com', password: '' });
    await flush(800);
    await fail;
    expect(svc.authError()).not.toBeNull();

    // Second: pending attempt should clear the error immediately
    const retry = svc.login({ email: 'a@b.com', password: 'secret123' });
    expect(svc.authError()).toBeNull();
    await flush(800);
    await retry;
  });

  // ── register() ───────────────────────────────────────────────────────────

  it('register with valid data creates a user with the chosen role', async () => {
    const svc = createService();
    const data: RegisterData = {
      name: '  Ana Silva  ',
      email: 'ANA@Example.COM',
      password: 'longpass1',
      role: 'landlord',
    };
    const p = svc.register(data);
    expect(svc.loading()).toBe(true);
    await flush(1000);
    const result = await p;

    expect(result).toEqual({ success: true });
    expect(svc.loading()).toBe(false);
    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.user()!.name).toBe('Ana Silva'); // trimmed
    expect(svc.user()!.email).toBe('ana@example.com'); // lowercased + trimmed
    expect(svc.user()!.role).toBe('landlord');
  });

  it('register rejects when any required field is empty', async () => {
    const svc = createService();
    const p = svc.register({ name: '', email: 'a@b.com', password: 'longpass1', role: 'tenant' });
    await flush(1000);
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Todos os campos são obrigatórios');
    expect(svc.isAuthenticated()).toBe(false);
  });

  it('register rejects password shorter than 8 chars', async () => {
    const svc = createService();
    const p = svc.register({ name: 'X', email: 'a@b.com', password: 'short1', role: 'tenant' });
    await flush(1000);
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.error).toBe('A password deve ter pelo menos 8 caracteres');
    expect(svc.authError()).toBe('A password deve ter pelo menos 8 caracteres');
  });

  it('register sets role=tenant when chosen', async () => {
    const svc = createService();
    const p = svc.register({ name: 'Pedro', email: 'p@x.com', password: 'longpass1', role: 'tenant' });
    await flush(1000);
    await p;
    expect(svc.user()!.role).toBe('tenant');
  });

  // ── logout() ─────────────────────────────────────────────────────────────

  it('logout clears user and any pending error', async () => {
    const svc = createService();
    const p = svc.login({ email: 'a@b.com', password: 'secret123' });
    await flush(800);
    await p;
    expect(svc.isAuthenticated()).toBe(true);

    // Seed an error to confirm it's wiped too
    const f = svc.login({ email: '', password: '' });
    await flush(800);
    await f;
    expect(svc.authError()).not.toBeNull();

    svc.logout();
    expect(svc.user()).toBeNull();
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.authError()).toBeNull();
  });

  it('logout from an already-unauthenticated state is a safe no-op', () => {
    const svc = createService();
    expect(() => svc.logout()).not.toThrow();
    expect(svc.isAuthenticated()).toBe(false);
  });

  // ── clearError() ─────────────────────────────────────────────────────────

  it('clearError nulls the error signal without touching the user', async () => {
    const svc = createService();
    const p = svc.login({ email: '', password: '' });
    await flush(800);
    await p;
    expect(svc.authError()).not.toBeNull();

    svc.clearError();
    expect(svc.authError()).toBeNull();
    expect(svc.user()).toBeNull();
  });

  // ── Computed reactivity ──────────────────────────────────────────────────

  it('initials handles names with more than two words by taking only the first two', async () => {
    const svc = createService();
    const p = svc.register({
      name: 'Ana Maria Beatriz Costa',
      email: 'ana@x.com',
      password: 'longpass1',
      role: 'tenant',
    });
    await flush(1000);
    await p;
    expect(svc.initials()).toBe('AM');
  });

  it('initials returns empty string when user has empty name', () => {
    const svc = createService();
    expect(svc.initials()).toBe('');
  });

  it('isAuthenticated is reactive to logout', async () => {
    const svc = createService();
    const seen: boolean[] = [];
    seen.push(svc.isAuthenticated());

    const p = svc.login({ email: 'a@b.com', password: 'secret123' });
    await flush(800);
    await p;
    seen.push(svc.isAuthenticated());

    svc.logout();
    seen.push(svc.isAuthenticated());

    expect(seen).toEqual([false, true, false]);
  });

  it('login does not overwrite a successful session when the next attempt fails', async () => {
    const svc = createService();
    const p = svc.login({ email: 'a@b.com', password: 'secret123' });
    await flush(800);
    await p;
    const userBefore = svc.user();

    const fail = svc.login({ email: 'a@b.com', password: '' });
    await flush(800);
    await fail;

    // _user is only set on success branch — the prior session survives a failed retry
    expect(svc.user()).toBe(userBefore);
    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.authError()).toBe('Email e password são obrigatórios');
  });

  it('exhaustive credential matrix: only well-formed credentials authenticate', async () => {
    const svc = createService();
    const cases: Array<[LoginCredentials, boolean]> = [
      [{ email: 'a@b.com', password: 'secret123' }, true],
      [{ email: 'a@b.com', password: '123456' }, true],
      [{ email: 'a@b.com', password: '12345' }, false],
      [{ email: '', password: 'secret123' }, false],
      [{ email: 'a@b.com', password: '' }, false],
    ];
    for (const [creds, expectSuccess] of cases) {
      svc.logout();
      svc.clearError();
      const p = svc.login(creds);
      await flush(800);
      const r = await p;
      expect(r.success).toBe(expectSuccess);
    }
  });
});
