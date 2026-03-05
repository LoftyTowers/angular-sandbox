import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [PageTitleComponent, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/catalog';
  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });
  protected loginError = '';

  protected signIn(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError = '';
    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        void this.router.navigateByUrl(this.returnUrl);
      },
      error: () => {
        this.loginError = 'Invalid credentials. Try demo@workshops.test or admin@workshops.test.';
      },
    });
  }
}
