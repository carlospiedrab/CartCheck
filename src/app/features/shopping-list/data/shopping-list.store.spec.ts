import { TestBed } from '@angular/core/testing';
import { ShoppingItem } from '../models/shopping-item.model';
import {
  isShoppingItem,
  SHOPPING_LIST_STORAGE,
  SHOPPING_LIST_STORAGE_KEY,
  ShoppingListStore,
} from './shopping-list.store';

function createStore(storage: Storage | null = localStorage): ShoppingListStore {
  TestBed.configureTestingModule({
    providers: [{ provide: SHOPPING_LIST_STORAGE, useValue: storage }],
  });
  return TestBed.inject(ShoppingListStore);
}

function savedItems(): unknown {
  const raw = localStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

const validItem: ShoppingItem = {
  id: 'a1',
  name: 'Leche',
  quantity: 2,
  unit: 'Unidad',
  purchased: false,
  createdAt: 1_700_000_000_000,
};

describe('ShoppingListStore', () => {
  beforeEach(() => localStorage.clear());

  describe('acciones', () => {
    it('empieza vacío', () => {
      const store = createStore();
      expect(store.items()).toEqual([]);
      expect(store.isEmpty()).toBe(true);
    });

    it('agrega un producto con id, nombre recortado y sin comprar', () => {
      const store = createStore();
      const added = store.add({ name: '  Arroz ', quantity: 1.5, unit: 'Kilos' });

      expect(added).not.toBeNull();
      expect(store.items()).toHaveLength(1);
      const [item] = store.items();
      expect(item).toMatchObject({ name: 'Arroz', quantity: 1.5, unit: 'Kilos', purchased: false });
      expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(typeof item.createdAt).toBe('number');
    });

    it('genera ids únicos y conserva el orden de inserción', () => {
      const store = createStore();
      store.add({ name: 'Pan', quantity: 1, unit: 'Paquete' });
      store.add({ name: 'Leche', quantity: 2, unit: 'Unidad' });

      const [first, second] = store.items();
      expect(first.name).toBe('Pan');
      expect(second.name).toBe('Leche');
      expect(first.id).not.toBe(second.id);
    });

    it('no agrega productos inválidos', () => {
      const store = createStore();
      expect(store.add({ name: '   ', quantity: 1, unit: 'Unidad' })).toBeNull();
      expect(store.add({ name: 'Pan', quantity: 0, unit: 'Unidad' })).toBeNull();
      expect(store.add({ name: 'Pan', quantity: -1, unit: 'Unidad' })).toBeNull();
      expect(store.isEmpty()).toBe(true);
    });

    it('marca y desmarca un producto sin mutar el estado anterior', () => {
      const store = createStore();
      const item = store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' })!;
      const before = store.items();

      store.togglePurchased(item.id);
      expect(store.items()[0].purchased).toBe(true);
      expect(before[0].purchased).toBe(false);
      expect(store.items()).not.toBe(before);

      store.togglePurchased(item.id);
      expect(store.items()[0].purchased).toBe(false);
    });

    it('elimina un producto por id', () => {
      const store = createStore();
      const pan = store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' })!;
      store.add({ name: 'Leche', quantity: 1, unit: 'Unidad' });

      store.remove(pan.id);
      expect(store.items().map((i) => i.name)).toEqual(['Leche']);
    });

    it('limpia toda la lista', () => {
      const store = createStore();
      store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' });
      store.add({ name: 'Leche', quantity: 1, unit: 'Unidad' });

      store.clear();
      expect(store.items()).toEqual([]);
      expect(store.isEmpty()).toBe(true);
    });
  });

  describe('computed', () => {
    it('calcula total, comprados, progreso e isEmpty', () => {
      const store = createStore();
      expect(store.progress()).toBe(0);

      const a = store.add({ name: 'A', quantity: 1, unit: 'Unidad' })!;
      store.add({ name: 'B', quantity: 1, unit: 'Unidad' });
      store.add({ name: 'C', quantity: 1, unit: 'Unidad' });
      store.togglePurchased(a.id);

      expect(store.total()).toBe(3);
      expect(store.purchasedCount()).toBe(1);
      expect(store.progress()).toBe(33);
      expect(store.isEmpty()).toBe(false);

      store.items().forEach((item) => {
        if (!item.purchased) store.togglePurchased(item.id);
      });
      expect(store.progress()).toBe(100);
    });
  });

  describe('persistencia', () => {
    it('guarda los cambios en localStorage', () => {
      const store = createStore();
      store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' });
      TestBed.tick();

      expect(savedItems()).toEqual([expect.objectContaining({ name: 'Pan', quantity: 1 })]);

      store.clear();
      TestBed.tick();
      expect(savedItems()).toEqual([]);
    });

    it('restaura la lista guardada', () => {
      localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify([validItem]));
      const store = createStore();
      expect(store.items()).toEqual([validItem]);
    });

    it.each([
      ['JSON corrupto', '{no es json'],
      ['un objeto en vez de un array', JSON.stringify({ items: [validItem] })],
      ['un número', '42'],
      ['null', 'null'],
    ])('ignora %s', (_label, raw) => {
      localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, raw);
      const store = createStore();
      expect(store.items()).toEqual([]);
    });

    it('descarta los elementos con forma inválida y conserva los válidos', () => {
      const invalid = [
        { ...validItem, id: 'b', quantity: 0 },
        { ...validItem, id: 'c', unit: 'Litros' },
        { ...validItem, id: 'd', purchased: 'sí' },
        { ...validItem, id: '', name: 'Sin id' },
        { ...validItem, id: 'e', name: '   ' },
        { ...validItem, id: 'f', name: 'x'.repeat(61) },
        'texto',
        null,
      ];
      localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify([validItem, ...invalid]));

      const store = createStore();
      expect(store.items()).toEqual([validItem]);
    });

    it('no se rompe si el almacenamiento lanza errores o no existe', () => {
      const failing = {
        getItem: () => {
          throw new Error('bloqueado');
        },
        setItem: () => {
          throw new Error('cuota');
        },
      } as unknown as Storage;

      const store = createStore(failing);
      store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' });
      expect(() => TestBed.tick()).not.toThrow();
      expect(store.total()).toBe(1);
    });

    it('funciona en memoria sin almacenamiento', () => {
      const store = createStore(null);
      store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' });
      TestBed.tick();
      expect(store.total()).toBe(1);
    });
  });

  it('isShoppingItem valida la forma completa', () => {
    expect(isShoppingItem(validItem)).toBe(true);
    expect(isShoppingItem({ ...validItem, createdAt: 'ayer' })).toBe(false);
    expect(isShoppingItem({ ...validItem, quantity: Number.NaN })).toBe(false);
  });
});
