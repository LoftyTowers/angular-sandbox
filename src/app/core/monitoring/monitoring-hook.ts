import { InjectionToken, Provider } from '@angular/core';

export interface MonitoringHook {
  captureException(error: unknown, context?: Record<string, unknown>): void;
}

class NoopMonitoringHook implements MonitoringHook {
  captureException(error: unknown, context?: Record<string, unknown>): void {
    void error;
    void context;
    // Intentionally empty. Real integrations (e.g. Sentry) can implement this contract later.
  }
}

export const MONITORING_HOOK = new InjectionToken<MonitoringHook>('MONITORING_HOOK', {
  providedIn: 'root',
  factory: () => new NoopMonitoringHook(),
});

export function provideMonitoringHook(): Provider {
  return {
    provide: MONITORING_HOOK,
    useClass: NoopMonitoringHook,
  };
}
