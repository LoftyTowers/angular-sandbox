import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [PageTitleComponent],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/catalog';

  protected signIn(): void {
    this.auth.login();
    void this.router.navigateByUrl(this.returnUrl);
  }
}
