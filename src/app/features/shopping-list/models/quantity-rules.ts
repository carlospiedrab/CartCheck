import { Unit } from './shopping-item.model';

export interface QuantityRule {
  /** Incremento de los botones − / +. */
  readonly step: number;
  /** Valor mínimo permitido (nunca 0 ni negativo). */
  readonly min: number;
}

/** Única fuente de verdad de las reglas de cantidad por unidad. */
export const QUANTITY_RULES: Readonly<Record<Unit, QuantityRule>> = {
  Unidad: { step: 1, min: 1 },
  Paquete: { step: 1, min: 1 },
  Libras: { step: 0.5, min: 0.5 },
  Kilos: { step: 0.5, min: 0.5 },
};

/** Cantidad con la que arranca el formulario y a la que vuelve tras agregar. */
export const INITIAL_QUANTITY = 1;

export function quantityRuleFor(unit: Unit): QuantityRule {
  return QUANTITY_RULES[unit];
}

/** Redondea a 2 decimales para evitar errores de coma flotante (0.1 + 0.2). */
export function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

export function incrementQuantity(value: number | null, rule: QuantityRule): number {
  if (value === null || !Number.isFinite(value)) {
    return rule.min;
  }
  return Math.max(rule.min, roundQuantity(value + rule.step));
}

export function decrementQuantity(value: number | null, rule: QuantityRule): number {
  if (value === null || !Number.isFinite(value)) {
    return rule.min;
  }
  return Math.max(rule.min, roundQuantity(value - rule.step));
}

export function isAtMinimum(value: number | null, rule: QuantityRule): boolean {
  return value !== null && Number.isFinite(value) && value <= rule.min;
}

/**
 * Ajusta una cantidad al valor válido más cercano para la unidad indicada:
 * múltiplo del incremento y nunca por debajo del mínimo (ej. 1.5 → 2 al pasar a `Unidad`).
 * Un valor vacío o inválido se mantiene para que lo reporte la validación.
 */
export function snapQuantityToUnit(value: number | null, unit: Unit): number | null {
  if (value === null || !Number.isFinite(value)) {
    return value;
  }
  const { step, min } = quantityRuleFor(unit);
  return Math.max(min, roundQuantity(Math.round(value / step) * step));
}

/** Formato de cantidad para mostrar: "1.5", "2". */
export function formatQuantity(value: number): string {
  return String(roundQuantity(value));
}

/** Convierte el texto escrito por el usuario en número; acepta coma decimal ("1,5"). */
export function parseQuantity(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
