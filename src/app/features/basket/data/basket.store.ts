import { Injectable, computed, signal } from '@angular/core';
import { BasketItem } from '../../../models/basket-item.model';
import { Workshop } from '../../../models/workshop.model';

interface BasketState {
  items: readonly BasketItem[];
}

interface BasketTotals {
  totalQuantity: number;
  subtotal: number;
}

const initialBasketState: BasketState = {
  items: [],
};

@Injectable({ providedIn: 'root' })
export class BasketStore {
  private readonly state = signal<BasketState>(initialBasketState);

  readonly items = computed(() => this.state().items);
  readonly totals = computed<BasketTotals>(() => calculateTotals(this.state().items));
  readonly totalQuantity = computed(() => this.totals().totalQuantity);
  readonly subtotal = computed(() => this.totals().subtotal);

  addWorkshop(workshop: Workshop, quantity = 1): void {
    if (quantity < 1) {
      return;
    }

    this.state.update((state) => ({
      ...state,
      items: addWorkshopToItems(state.items, workshop, quantity),
    }));
  }

  updateQuantity(workshopId: string, quantity: number): void {
    this.state.update((state) => ({
      ...state,
      items: updateWorkshopQuantity(state.items, workshopId, quantity),
    }));
  }

  removeWorkshop(workshopId: string): void {
    this.state.update((state) => ({
      ...state,
      items: state.items.filter((item) => item.workshop.id !== workshopId),
    }));
  }
}

function addWorkshopToItems(
  items: readonly BasketItem[],
  workshop: Workshop,
  quantity: number,
): readonly BasketItem[] {
  const existing = items.find((item) => item.workshop.id === workshop.id);
  if (!existing) {
    return [...items, { workshop, quantity }];
  }

  return items.map((item) =>
    item.workshop.id === workshop.id ? { ...item, quantity: item.quantity + quantity } : item,
  );
}

function updateWorkshopQuantity(
  items: readonly BasketItem[],
  workshopId: string,
  quantity: number,
): readonly BasketItem[] {
  if (quantity < 1) {
    return items.filter((item) => item.workshop.id !== workshopId);
  }

  return items.map((item) => (item.workshop.id === workshopId ? { ...item, quantity } : item));
}

function calculateTotals(items: readonly BasketItem[]): BasketTotals {
  return items.reduce(
    (totals, item) => ({
      totalQuantity: totals.totalQuantity + item.quantity,
      subtotal: totals.subtotal + item.quantity * item.workshop.price,
    }),
    { totalQuantity: 0, subtotal: 0 },
  );
}
