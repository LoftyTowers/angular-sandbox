import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { WorkshopCatalogService } from '../../../core/services/workshop-catalog.service';
import { Workshop } from '../../../models/workshop.model';

interface CatalogState {
  workshops: readonly Workshop[];
  tags: readonly string[];
  loading: boolean;
  error: string | null;
}

const initialCatalogState: CatalogState = {
  workshops: [],
  tags: [],
  loading: false,
  error: null,
};

@Injectable()
export class CatalogStore {
  private readonly catalogService = inject(WorkshopCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadRequests = new Subject<void>();
  private readonly state = signal<CatalogState>(initialCatalogState);

  readonly workshops = computed(() => this.state().workshops);
  readonly tags = computed(() => this.state().tags);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.loadRequests
      .pipe(
        tap(() => this.patchState({ loading: true, error: null })),
        switchMap(() =>
          this.loadCatalogData().pipe(
            map((catalogData) => ({ kind: 'success' as const, catalogData })),
            catchError(() => of({ kind: 'failure' as const })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.kind === 'failure') {
          this.patchState({
            loading: false,
            error: 'Unable to load workshops right now. Please refresh and try again.',
          });
          return;
        }

        this.patchState({
          workshops: result.catalogData.workshops,
          tags: result.catalogData.tags,
          loading: false,
          error: null,
        });
      });
  }

  load(): void {
    this.loadRequests.next();
  }

  private patchState(patch: Partial<CatalogState>): void {
    this.state.update((state) => ({
      ...state,
      ...patch,
    }));
  }

  private loadCatalogData(): Observable<{
    tags: readonly string[];
    workshops: readonly Workshop[];
  }> {
    return this.catalogService
      .getTags()
      .pipe(
        switchMap((tags) =>
          this.catalogService.getWorkshops().pipe(map((workshops) => ({ tags, workshops }))),
        ),
      );
  }
}
