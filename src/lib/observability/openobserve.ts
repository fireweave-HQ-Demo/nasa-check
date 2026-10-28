import { openobserveLogs } from '@openobserve/browser-logs';
import { openobserveRum } from '@openobserve/browser-rum';
import type { ObservabilityConfig } from '@/lib/config';
import type { ObservabilitySink } from './sink';

export type OpenObserveOptions = ObservabilityConfig & {
  service: string;
  env: string;
  version: string;
};

/** Initialise OpenObserve RUM (with session replay) and browser logs. Loaded lazily. */
export function createOpenObserveSink(options: OpenObserveOptions): ObservabilitySink {
  const common = {
    clientToken: options.clientToken,
    site: options.site,
    organizationIdentifier: options.organizationIdentifier,
    service: options.service,
    env: options.env,
    version: options.version,
    apiVersion: 'v1',
    insecureHTTP: false,
  };

  openobserveRum.init({
    ...common,
    applicationId: options.applicationId,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    defaultPrivacyLevel: 'mask-user-input',
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
  });
  openobserveRum.startSessionReplayRecording();

  openobserveLogs.init({
    ...common,
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });

  return {
    setUser: (user) => {
      openobserveRum.setUser(user);
      openobserveLogs.setUser(user);
    },
    clearUser: () => {
      openobserveRum.clearUser();
      openobserveLogs.clearUser();
    },
    setGlobal: (key, value) => {
      openobserveRum.setGlobalContextProperty(key, value);
      openobserveLogs.setGlobalContextProperty(key, value);
    },
    action: (name, context) => openobserveRum.addAction(name, context),
    log: (level, message, context) => openobserveLogs.logger[level](message, context),
  };
}
