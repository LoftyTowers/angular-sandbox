import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Workshop } from '../../models/workshop.model';
import { WorkshopCatalogService } from '../services/workshop-catalog.service';

export const workshopDetailsResolver: ResolveFn<Workshop | RedirectCommand> = (route) => {
  const workshopId = route.paramMap.get('workshopId');
  const router = inject(Router);
  const catalog = inject(WorkshopCatalogService);

  if (!workshopId) {
    return new RedirectCommand(router.parseUrl('/catalog'));
  }

  return of(workshopId).pipe(
    switchMap((id) => catalog.getWorkshopById(id)),
    catchError(() => of(new RedirectCommand(router.parseUrl('/catalog')))),
  );
};
