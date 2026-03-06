import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastMessage, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.css',
  animations: [
    trigger('toastMotion', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  private readonly toastService = inject(ToastService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private lastAnnouncedToastId = 0;

  protected readonly toasts = this.toastService.toasts;

  constructor() {
    effect(() => {
      const nextToast = this.toasts().find((toast) => toast.id > this.lastAnnouncedToastId);
      if (!nextToast) {
        return;
      }

      this.lastAnnouncedToastId = nextToast.id;
      void this.liveAnnouncer.announce(
        nextToast.message,
        nextToast.tone === 'error' ? 'assertive' : 'polite',
      );
    });
  }

  protected trackById(_: number, toast: ToastMessage): number {
    return toast.id;
  }

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
