import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [PageTitleComponent],
  templateUrl: './admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {}
