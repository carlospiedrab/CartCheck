import { computed, effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import {
  isUnit,
  NewShoppingItem,
  PRODUCT_NAME_MAX_LENGTH,
  ShoppingItem,
} from '../models/shopping-item.model';

export const SHOPPING_LIST_STORAGE_KEY = 'cartcheck.items.v1';

/** Almacenamiento usado para persistir la lista. `null` si no está disponible (SSR, modo privado…). */
export const SHOPPING_LIST_STORAGE = new InjectionToken<Storage | null>('SHOPPING_LIST_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

@Injectable({ providedIn: 'root' })
export class ShoppingListStore {
  private readonly storage = inject(SHOPPING_LIST_STORAGE);
  private readonly state = signal<readonly ShoppingItem[]>(this.restore());

  readonly items = this.state.asReadonly();
  readonly total = computed(() => this.state().length);
  readonly purchasedCount = computed(() => this.state().filter((item) => item.purchased).length);
  /** Porcentaje (0–100, entero) de productos comprados. */
  readonly progress = computed(() => {
    const total = this.total();
    return total === 0 ? 0 : Math.round((this.purchasedCount() / total) * 100);
  });
  readonly isEmpty = computed(() => this.total() === 0);

  /** Efecto secundario: persiste cada cambio de la lista. */
  private readonly persist = effect(() => {
    const items = this.state();
    try {
      this.storage?.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Cuota llena o almacenamiento bloqueado: la app sigue funcionando en memoria.
    }
  });

  add(input: NewShoppingItem): ShoppingItem | null {
    const name = input.name.trim();
    if (!name || !(input.quantity > 0)) {
      return null;
    }
    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name,
      quantity: input.quantity,
      unit: input.unit,
      purchased: false,
      createdAt: Date.now(),
    };
    this.state.update((items) => [...items, item]);
    return item;
  }

  togglePurchased(id: string): void {
    this.state.update((items) =>
      items.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item)),
    );
  }

  remove(id: string): void {
    this.state.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.state.set([]);
  }

  private restore(): readonly ShoppingItem[] {
    try {
      const raw = this.storage?.getItem(SHOPPING_LIST_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isShoppingItem) : [];
    } catch {
      return [];
    }
  }
}

/** Valida la forma de un elemento leído del almacenamiento. */
export function isShoppingItem(value: unknown): value is ShoppingItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const { id, name, quantity, unit, purchased, createdAt } = {
    id: record['id'],
    name: record['name'],
    quantity: record['quantity'],
    unit: record['unit'],
    purchased: record['purchased'],
    createdAt: record['createdAt'],
  };
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.length <= PRODUCT_NAME_MAX_LENGTH &&
    typeof quantity === 'number' &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    isUnit(unit) &&
    typeof purchased === 'boolean' &&
    typeof createdAt === 'number' &&
    Number.isFinite(createdAt)
  );
}
