import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  captureError(error: unknown): void {
    void error;
    // Placeholder for remote logging integration.
  }
}
