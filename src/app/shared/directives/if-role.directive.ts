import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/auth/auth.models';

@Directive({
  selector: '[appIfRole]',
  standalone: true,
})
export class IfRoleDirective {
  readonly appIfRole = input.required<UserRole>();

  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);
  private hasView = false;

  constructor() {
    effect(() => {
      const requiredRole = this.appIfRole();
      const canShow = this.authService.currentRole() === requiredRole;

      if (canShow && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!canShow && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
