import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { IfRoleDirective } from '../../shared/directives/if-role.directive';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [PageTitleComponent, IfRoleDirective],
  templateUrl: './admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {}
