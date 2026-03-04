import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { Workshop } from '../../models/workshop.model';
import { WorkshopCatalogService } from '../services/workshop-catalog.service';

export const workshopDetailsResolver: ResolveFn<Workshop> = (route) => {
  const workshopId = route.paramMap.get('workshopId');
  const router = inject(Router);
  const catalog = inject(WorkshopCatalogService);

  if (!workshopId) {
    return new RedirectCommand(router.parseUrl('/catalog'));
  }

  const workshop = catalog.getWorkshopById(workshopId);
  if (!workshop) {
    return new RedirectCommand(router.parseUrl('/catalog'));
  }

  return workshop;
};
