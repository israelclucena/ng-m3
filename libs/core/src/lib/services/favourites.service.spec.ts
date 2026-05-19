import { TestBed } from '@angular/core/testing';
import { FavouritesService } from './favourites.service';

const STORAGE_KEY = 'iu_favourites_v1';

describe('FavouritesService', () => {
  let storage: Record<string, string>;
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;
  let storageListener: ((e: StorageEvent) => void) | undefined;
  let originalAddEventListener: typeof window.addEventListener;

  beforeEach(() => {
    storage = {};
    storageListener = undefined;

    getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((k: string) => storage[k] ?? null);
    setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((k: string, v: string) => {
        storage[k] = String(v);
      });

    // Capture the 'storage' listener so we can dispatch synthetic events
    originalAddEventListener = window.addEventListener.bind(window);
    jest.spyOn(window, 'addEventListener').mockImplementation((type: string, cb: EventListenerOrEventListenerObject) => {
      if (type === 'storage') {
        storageListener = cb as (e: StorageEvent) => void;
      } else {
        originalAddEventListener(type as keyof WindowEventMap, cb);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createService = (): FavouritesService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(FavouritesService);
    // Flush the persistence effect()
    TestBed.tick();
    return svc;
  };

  it('starts empty when localStorage has nothing', () => {
    const service = createService();
    expect(service.ids()).toEqual([]);
    expect(service.count()).toBe(0);
    expect(service.hasAny()).toBe(false);
  });

  it('loads previously persisted favourites on construction', () => {
    storage[STORAGE_KEY] = JSON.stringify(['p1', 'p2', 'p3']);
    const service = createService();
    expect(service.ids().sort()).toEqual(['p1', 'p2', 'p3']);
    expect(service.count()).toBe(3);
    expect(service.hasAny()).toBe(true);
  });

  it('falls back to empty when stored payload is not an array', () => {
    storage[STORAGE_KEY] = JSON.stringify({ not: 'an array' });
    const service = createService();
    expect(service.ids()).toEqual([]);
  });

  it('falls back to empty when stored payload is malformed JSON', () => {
    storage[STORAGE_KEY] = '{not-json';
    const service = createService();
    expect(service.ids()).toEqual([]);
  });

  it('add() inserts a new id and persists', () => {
    const service = createService();
    service.add('p1');
    TestBed.tick();
    expect(service.isFavourited('p1')).toBe(true);
    expect(service.count()).toBe(1);
    expect(storage[STORAGE_KEY]).toBe(JSON.stringify(['p1']));
  });

  it('add() is idempotent for the same id', () => {
    const service = createService();
    service.add('p1');
    service.add('p1');
    expect(service.count()).toBe(1);
  });

  it('coerces numeric ids to strings', () => {
    const service = createService();
    service.add(42);
    expect(service.isFavourited(42)).toBe(true);
    expect(service.isFavourited('42')).toBe(true);
    expect(service.ids()).toEqual(['42']);
  });

  it('remove() drops an existing id and persists', () => {
    const service = createService();
    service.add('p1');
    service.add('p2');
    service.remove('p1');
    TestBed.tick();
    expect(service.isFavourited('p1')).toBe(false);
    expect(service.isFavourited('p2')).toBe(true);
    expect(JSON.parse(storage[STORAGE_KEY])).toEqual(['p2']);
  });

  it('remove() is a no-op when id is not present', () => {
    const service = createService();
    service.add('p1');
    expect(() => service.remove('nope')).not.toThrow();
    expect(service.ids()).toEqual(['p1']);
  });

  it('toggle() adds when absent and returns true', () => {
    const service = createService();
    const result = service.toggle('p1');
    expect(result).toBe(true);
    expect(service.isFavourited('p1')).toBe(true);
  });

  it('toggle() removes when present and returns false', () => {
    const service = createService();
    service.add('p1');
    const result = service.toggle('p1');
    expect(result).toBe(false);
    expect(service.isFavourited('p1')).toBe(false);
  });

  it('clearAll() wipes state and persists empty array', () => {
    const service = createService();
    service.add('p1');
    service.add('p2');
    service.clearAll();
    TestBed.tick();
    expect(service.count()).toBe(0);
    expect(JSON.parse(storage[STORAGE_KEY])).toEqual([]);
  });

  it('filterFavourited returns only items whose id is favourited', () => {
    const service = createService();
    service.add('a');
    service.add('c');
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    expect(service.filterFavourited(items)).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('filterFavourited handles numeric ids via string coercion', () => {
    const service = createService();
    service.add(1);
    service.add(3);
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(service.filterFavourited(items)).toEqual([{ id: 1 }, { id: 3 }]);
  });

  it('count and hasAny are reactive to add/remove', () => {
    const service = createService();
    expect(service.hasAny()).toBe(false);
    service.add('p1');
    expect(service.hasAny()).toBe(true);
    expect(service.count()).toBe(1);
    service.remove('p1');
    expect(service.hasAny()).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('syncs in from a cross-tab storage event with a valid array', () => {
    const service = createService();
    expect(storageListener).toBeDefined();
    storageListener!({
      key: STORAGE_KEY,
      newValue: JSON.stringify(['x1', 'x2']),
    } as StorageEvent);
    expect(service.ids().sort()).toEqual(['x1', 'x2']);
  });

  it('ignores cross-tab storage events for unrelated keys', () => {
    const service = createService();
    service.add('p1');
    storageListener!({
      key: 'something-else',
      newValue: JSON.stringify(['x1']),
    } as StorageEvent);
    expect(service.ids()).toEqual(['p1']);
  });

  it('ignores cross-tab storage events with malformed payloads', () => {
    const service = createService();
    service.add('p1');
    storageListener!({
      key: STORAGE_KEY,
      newValue: '{not-json',
    } as StorageEvent);
    expect(service.ids()).toEqual(['p1']);
  });

  it('ignores cross-tab storage events with non-array payloads', () => {
    const service = createService();
    service.add('p1');
    storageListener!({
      key: STORAGE_KEY,
      newValue: JSON.stringify({ not: 'array' }),
    } as StorageEvent);
    expect(service.ids()).toEqual(['p1']);
  });

  it('swallows localStorage write failures (quota / private mode)', () => {
    const service = createService();
    setItemSpy.mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => {
      service.add('p1');
      TestBed.tick();
    }).not.toThrow();
    expect(service.isFavourited('p1')).toBe(true);
  });

  it('returns empty when localStorage read throws', () => {
    getItemSpy.mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const service = createService();
    expect(service.ids()).toEqual([]);
  });
});
