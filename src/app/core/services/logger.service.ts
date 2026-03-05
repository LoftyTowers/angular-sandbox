import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';
import { MONITORING_HOOK, MonitoringHook } from '../monitoring/monitoring-hook';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: Record<string, unknown> | null;
  stack: string | null;
}

const PROD_RING_BUFFER_CAPACITY = 250;

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly monitoringHook = inject<MonitoringHook>(MONITORING_HOOK);
  private readonly ringBuffer: LogEntry[] = [];
  private readonly isProduction = this.appConfig.environmentName === 'production';

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.log('error', message, context, error);
    this.monitoringHook.captureException(error ?? message, context);
  }

  captureError(error: unknown, context?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : 'Unhandled application error.';
    this.log('error', message, context, error);
    this.monitoringHook.captureException(error, context);
  }

  getLogs(): readonly LogEntry[] {
    return [...this.ringBuffer];
  }

  exportLogs(): string {
    return JSON.stringify(this.ringBuffer, null, 2);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ?? null,
      stack: error instanceof Error ? (error.stack ?? null) : null,
    };

    if (this.isProduction) {
      this.pushToRingBuffer(entry);
      return;
    }

    this.writeToConsole(entry, error);
  }

  private pushToRingBuffer(entry: LogEntry): void {
    this.ringBuffer.push(entry);
    if (this.ringBuffer.length > PROD_RING_BUFFER_CAPACITY) {
      this.ringBuffer.shift();
    }
  }

  private writeToConsole(entry: LogEntry, error?: unknown): void {
    const consoleRef = globalThis['console'];
    if (!consoleRef) {
      return;
    }

    const payload = entry.context ? [entry.message, entry.context] : [entry.message];

    switch (entry.level) {
      case 'debug':
        consoleRef.debug?.(...payload);
        return;
      case 'info':
        consoleRef.info?.(...payload);
        return;
      case 'warn':
        consoleRef.warn?.(...payload);
        return;
      case 'error':
        if (error !== undefined) {
          consoleRef.error?.(...payload, error);
          return;
        }

        consoleRef.error?.(...payload);
    }
  }
}
