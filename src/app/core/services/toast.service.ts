import { Injectable, OnDestroy, computed, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastOptions {
  tone?: ToastTone;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 3500;

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private readonly sequence = signal(0);
  private readonly state = signal<readonly ToastMessage[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = computed(() => this.state());

  info(message: string, durationMs?: number): number {
    return this.show(
      message,
      durationMs === undefined ? { tone: 'info' } : { tone: 'info', durationMs },
    );
  }

  success(message: string, durationMs?: number): number {
    return this.show(
      message,
      durationMs === undefined ? { tone: 'success' } : { tone: 'success', durationMs },
    );
  }

  error(message: string, durationMs?: number): number {
    return this.show(
      message,
      durationMs === undefined ? { tone: 'error' } : { tone: 'error', durationMs },
    );
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.state.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  ngOnDestroy(): void {
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
  }

  private show(message: string, options?: ToastOptions): number {
    const id = this.sequence() + 1;
    this.sequence.set(id);
    const toast: ToastMessage = {
      id,
      message,
      tone: options?.tone ?? 'info',
    };

    this.state.update((toasts) => [...toasts, toast]);
    this.startTimer(id, options?.durationMs ?? DEFAULT_DURATION_MS);
    return id;
  }

  private startTimer(id: number, durationMs: number): void {
    this.clearTimer(id);
    const timerId = setTimeout(() => this.dismiss(id), Math.max(durationMs, 0));
    this.timers.set(id, timerId);
  }

  private clearTimer(id: number): void {
    const timerId = this.timers.get(id);
    if (!timerId) {
      return;
    }

    clearTimeout(timerId);
    this.timers.delete(id);
  }
}
