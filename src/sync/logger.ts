export interface SyncLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

export class ConsoleSyncLogger implements SyncLogger {
  constructor(private verbose: boolean = false) {}

  info(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  warn(message: string): void {
    if (this.verbose) {
      console.warn(message);
    }
  }

  error(message: string, error?: unknown): void {
    // We usually want to log errors even if not verbose,
    // but following the current logic in engine.ts:
    // Some errors were logged unconditionally, others were conditional.
    // Let's look closer at engine.ts again.
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
}

export class NoopSyncLogger implements SyncLogger {
  info(_message: string): void {}
  warn(_message: string): void {}
  error(_message: string, _error?: unknown): void {}
}
