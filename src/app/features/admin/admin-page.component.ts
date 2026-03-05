import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { FileDownloadService } from '../../core/services/file-download.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { IfRoleDirective } from '../../shared/directives/if-role.directive';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [PageTitleComponent, IfRoleDirective],
  templateUrl: './admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {
  private readonly logger = inject(LoggerService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly appConfig = inject(APP_CONFIG);

  protected readonly isProduction = this.appConfig.environmentName === 'production';
  protected readonly exportedMessage = signal<string | null>(null);

  protected exportLogs(): void {
    const logs = this.logger.exportLogs();
    this.fileDownload.downloadTextFile(`workshop-app-logs-${Date.now()}.json`, logs);
    this.exportedMessage.set(`Exported ${this.logger.getLogs().length} log entries.`);
  }
}
