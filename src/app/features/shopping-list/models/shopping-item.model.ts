/** Unidades de medida disponibles, en el orden en que se muestran en el selector. */
export const UNITS = ['Unidad', 'Paquete', 'Libras', 'Kilos'] as const;

export type Unit = (typeof UNITS)[number];

export const DEFAULT_UNIT: Unit = 'Unidad';

/** Longitud máxima del nombre de un producto. */
export const PRODUCT_NAME_MAX_LENGTH = 60;

export interface ShoppingItem {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly unit: Unit;
  readonly purchased: boolean;
  /** Marca de tiempo (ms desde epoch) en que se agregó el producto. */
  readonly createdAt: number;
}

/** Datos que aporta el usuario al agregar un producto. */
export type NewShoppingItem = Pick<ShoppingItem, 'name' | 'quantity' | 'unit'>;

export function isUnit(value: unknown): value is Unit {
  return typeof value === 'string' && (UNITS as readonly string[]).includes(value);
}
