import { describe, expect, it } from 'vitest';
import {
  DEVICE_ID_KEY,
  getOrCreateDeviceId,
  isDeviceId,
  resetDeviceId,
  shortDeviceId,
} from './deviceId';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

describe('device id', () => {
  it('creates a dev_<uuid> id once and reuses it', () => {
    const storage = memoryStorage();
    const first = getOrCreateDeviceId(storage);
    expect(first.isNew).toBe(true);
    expect(isDeviceId(first.id)).toBe(true);
    expect(storage.data.get(DEVICE_ID_KEY)).toBe(first.id);

    const second = getOrCreateDeviceId(storage);
    expect(second).toEqual({ id: first.id, isNew: false, persisted: true });
  });

  it('replaces malformed stored values', () => {
    const storage = memoryStorage();
    storage.setItem(DEVICE_ID_KEY, 'garbage');
    expect(getOrCreateDeviceId(storage).isNew).toBe(true);
  });

  it('falls back to a stable in-memory id without storage', () => {
    resetDeviceId(null);
    const a = getOrCreateDeviceId(null);
    const b = getOrCreateDeviceId(null);
    expect(a.persisted).toBe(false);
    expect(b.id).toBe(a.id);
    expect(b.isNew).toBe(false);
  });

  it('falls back to memory when writing fails', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    expect(getOrCreateDeviceId(storage).persisted).toBe(false);
  });

  it('resets the id', () => {
    const storage = memoryStorage();
    const first = getOrCreateDeviceId(storage);
    resetDeviceId(storage);
    expect(getOrCreateDeviceId(storage).id).not.toBe(first.id);
  });

  it('shortens ids for display', () => {
    expect(shortDeviceId('dev_3f2a0000-0000-4000-8000-000000009c1b')).toBe('dev_3f2a…9c1b');
  });
});
