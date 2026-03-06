import { Workshop } from '../../models/workshop.model';

const WORKSHOP_SEEDS: readonly Workshop[] = [
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
  {
    id: 'ws-accessibility-by-default',
    title: 'Accessibility by Default',
    level: 'Intermediate',
    durationHours: 3,
    price: 119,
    tags: ['frontend', 'a11y', 'angular'],
    description: 'Ship inclusive interfaces using practical accessibility heuristics and testing.',
  },
];

const SYNTHETIC_WORKSHOP_COUNT = 1200;

function buildSyntheticWorkshops(): readonly Workshop[] {
  return Array.from({ length: SYNTHETIC_WORKSHOP_COUNT }, (_, index) => {
    const seed = WORKSHOP_SEEDS[index % WORKSHOP_SEEDS.length]!;
    const sequence = index + 1;

    return {
      id: `${seed.id}-${sequence}`,
      title: `${seed.title} ${sequence}`,
      level: seed.level,
      durationHours: seed.durationHours,
      price: seed.price + (sequence % 5) * 5,
      tags: [...seed.tags],
      description: seed.description,
    };
  });
}

export const MOCK_WORKSHOPS: readonly Workshop[] = [
  ...WORKSHOP_SEEDS,
  ...buildSyntheticWorkshops(),
];

export const MOCK_TAGS: readonly string[] = Array.from(
  new Set(MOCK_WORKSHOPS.flatMap((workshop) => workshop.tags)),
).sort((first, second) => first.localeCompare(second));
