/**
 * Anonymous, per-browser device id.
 *
 * Uses the same localStorage key and `dev_<uuid>` format as the Fireweave web SDK, so when
 * release 2 adds Fireweave, returning visitors keep the same id (and the same rollout bucket).
 */
export const DEVICE_ID_KEY = 'fireweave.device-id';
const PREFIX = 'dev_';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

let memoryId: string | null = null;

function safeLocalStorage(): KeyValueStore | null {
  try {
    const storage = window.localStorage;
    const probe = '__nasa_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null; // private mode, blocked storage, SSR
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function isDeviceId(value: unknown): value is string {
  return typeof value === 'string' && /^dev_[0-9a-f-]{36}$/i.test(value);
}

export type DeviceIdentity = { id: string; isNew: boolean; persisted: boolean };

export function getOrCreateDeviceId(
  storage: KeyValueStore | null = safeLocalStorage(),
): DeviceIdentity {
  if (!storage) {
    const isNew = memoryId === null;
    memoryId ??= `${PREFIX}${uuid()}`;
    return { id: memoryId, isNew, persisted: false };
  }
  const existing = storage.getItem(DEVICE_ID_KEY);
  if (isDeviceId(existing)) return { id: existing, isNew: false, persisted: true };

  const id = `${PREFIX}${uuid()}`;
  try {
    storage.setItem(DEVICE_ID_KEY, id);
    return { id, isNew: true, persisted: true };
  } catch {
    memoryId = id;
    return { id, isNew: true, persisted: false };
  }
}

export function resetDeviceId(storage: KeyValueStore | null = safeLocalStorage()): void {
  memoryId = null;
  try {
    storage?.removeItem(DEVICE_ID_KEY);
  } catch {
    // ignore
  }
}

/** Short form for display, e.g. "dev_3f2a…9c1b". */
export function shortDeviceId(id: string): string {
  const raw = id.replace(PREFIX, '');
  return `${PREFIX}${raw.slice(0, 4)}…${raw.slice(-4)}`;
}
