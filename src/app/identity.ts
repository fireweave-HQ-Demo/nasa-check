import { getOrCreateDeviceId, resetDeviceId, type DeviceIdentity } from '@/lib/identity/deviceId';
import { setUser, track } from '@/lib/observability';

let current: DeviceIdentity | null = null;

/**
 * Resolve the anonymous device id and tell observability who this is.
 * `?reset-id=1` mints a fresh id (handy for demoing a "new visitor").
 * Release 2: the same id is passed to Fireweave's start({ deviceId }).
 */
export function initIdentity(location: Location = window.location): DeviceIdentity {
  const url = new URL(location.href);
  if (url.searchParams.get('reset-id') === '1') {
    resetDeviceId();
    url.searchParams.delete('reset-id');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }

  current = getOrCreateDeviceId();
  setUser({ id: current.id });
  track('app_loaded', { device_id_new: current.isNew, storage_persisted: current.persisted });
  return current;
}

export function currentDeviceId(): string | null {
  return current?.id ?? null;
}
