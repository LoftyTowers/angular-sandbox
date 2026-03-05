import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { routeTransitionAnimation } from '../../core/animations/route-transition.animation';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css',
  animations: [routeTransitionAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayoutComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  protected readonly navigationInProgress = signal(false);
  protected readonly isAuthenticated = this.auth.isAuthenticated;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigationInProgress.set(true);
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigationInProgress.set(false);
      }
    });
  }

  protected routeKey(outlet: RouterOutlet): string {
    return outlet.activatedRouteData['animation'] as string;
  }

  protected signOut(): void {
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigate(['/account/login']);
      },
    });
  }
}
