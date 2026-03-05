import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  protected readonly toasts = this.toastService.toasts;

  protected trackById(_: number, toast: ToastMessage): number {
    return toast.id;
  }

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
