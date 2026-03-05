import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, defer, timer } from 'rxjs';
import { retry, shareReplay } from 'rxjs/operators';
import { Workshop } from '../../models/workshop.model';

@Injectable({ providedIn: 'root' })
export class WorkshopCatalogService {
  private readonly http = inject(HttpClient);
  private readonly workshopsRequest$ = defer(() =>
    this.http.get<readonly Workshop[]>('/workshops'),
  ).pipe(
    retry({
      count: 2,
      delay: (_error, retryAttempt) => timer(retryAttempt * 250),
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  private readonly tagsRequest$ = defer(() => this.http.get<readonly string[]>('/tags')).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getWorkshops(): Observable<readonly Workshop[]> {
    return this.workshopsRequest$;
  }

  getWorkshopById(workshopId: string): Observable<Workshop> {
    return this.http.get<Workshop>(`/workshops/${encodeURIComponent(workshopId)}`);
  }

  getTags(): Observable<readonly string[]> {
    return this.tagsRequest$;
  }
}
