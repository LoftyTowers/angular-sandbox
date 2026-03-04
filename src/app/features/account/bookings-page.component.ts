import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [PageTitleComponent],
  templateUrl: './bookings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsPageComponent {}
