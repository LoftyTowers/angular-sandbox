import { animate, query, style, transition, trigger } from '@angular/animations';

export const routeTransitionAnimation = trigger('routeTransition', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({
          opacity: 0,
          transform: 'translateY(6px)',
        }),
      ],
      { optional: true },
    ),
    query(
      ':leave',
      [
        animate(
          '140ms ease-out',
          style({
            opacity: 0,
          }),
        ),
      ],
      { optional: true },
    ),
    query(
      ':enter',
      [
        animate(
          '180ms ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
          }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);
