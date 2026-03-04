export interface Workshop {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationHours: number;
  price: number;
}
