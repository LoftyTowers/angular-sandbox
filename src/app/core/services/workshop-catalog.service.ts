import { Injectable } from '@angular/core';
import { Workshop } from '../../models/workshop.model';

@Injectable({ providedIn: 'root' })
export class WorkshopCatalogService {
  private readonly workshops: Workshop[] = [
    {
      id: 'ws-angular-fundamentals',
      title: 'Angular Fundamentals',
      level: 'Beginner',
      durationHours: 3,
      price: 99,
      tags: ['frontend', 'angular', 'beginner'],
      description: 'Build core Angular skills with standalone components and modern routing.',
    },
    {
      id: 'ws-rxjs-practice',
      title: 'RxJS in Practice',
      level: 'Intermediate',
      durationHours: 4,
      price: 149,
      tags: ['rxjs', 'reactive', 'frontend'],
      description: 'Design robust reactive pipelines for real-world UI and API flows.',
    },
    {
      id: 'ws-performance-toolkit',
      title: 'Performance Toolkit',
      level: 'Advanced',
      durationHours: 5,
      price: 199,
      tags: ['performance', 'advanced', 'angular'],
      description: 'Diagnose and optimize Angular apps with practical profiling techniques.',
    },
  ];

  getWorkshops(tag?: string | null): Workshop[] {
    if (!tag) {
      return this.workshops;
    }

    return this.workshops.filter((workshop) => workshop.tags.includes(tag));
  }

  getWorkshopById(workshopId: string): Workshop | undefined {
    return this.workshops.find((workshop) => workshop.id === workshopId);
  }
}
