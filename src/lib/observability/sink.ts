/** The minimal surface the app needs from an observability backend. */
export type ObservabilitySink = {
  setUser(user: { id: string }): void;
  clearUser(): void;
  setGlobal(key: string, value: string | number | boolean): void;
  action(name: string, context: Record<string, unknown>): void;
  log(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown>): void;
};

type Call = {
  [K in keyof ObservabilitySink]: [K, Parameters<ObservabilitySink[K]>];
}[keyof ObservabilitySink];

/**
 * Buffers calls until the real backend has loaded (it is imported lazily to keep the
 * initial bundle small), then replays them. If observability is disabled, calls are dropped.
 */
export class BufferedSink implements ObservabilitySink {
  private target: ObservabilitySink | null = null;
  private buffer: Call[] = [];
  private disabled = false;
  private static readonly MAX_BUFFER = 200;

  attach(target: ObservabilitySink) {
    this.target = target;
    for (const [method, args] of this.buffer) {
      (target[method] as (...a: unknown[]) => void)(...args);
    }
    this.buffer = [];
  }

  disable() {
    this.disabled = true;
    this.buffer = [];
  }

  private call(entry: Call) {
    if (this.disabled) return;
    if (this.target) {
      try {
        (this.target[entry[0]] as (...a: unknown[]) => void)(...entry[1]);
      } catch {
        // observability must never break the app
      }
      return;
    }
    if (this.buffer.length < BufferedSink.MAX_BUFFER) this.buffer.push(entry);
  }

  setUser(user: { id: string }) {
    this.call(['setUser', [user]]);
  }
  clearUser() {
    this.call(['clearUser', []]);
  }
  setGlobal(key: string, value: string | number | boolean) {
    this.call(['setGlobal', [key, value]]);
  }
  action(name: string, context: Record<string, unknown>) {
    this.call(['action', [name, context]]);
  }
  log(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown>) {
    this.call(['log', [level, message, context]]);
  }
}
