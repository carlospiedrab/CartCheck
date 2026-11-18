import {
  decrementQuantity,
  formatQuantity,
  incrementQuantity,
  isAtMinimum,
  parseQuantity,
  QUANTITY_RULES,
  quantityRuleFor,
  snapQuantityToUnit,
} from './quantity-rules';
import { UNITS } from './shopping-item.model';

describe('reglas de cantidad', () => {
  it('define incremento y mínimo para cada unidad', () => {
    expect(Object.keys(QUANTITY_RULES).sort()).toEqual([...UNITS].sort());
    expect(quantityRuleFor('Unidad')).toEqual({ step: 1, min: 1 });
    expect(quantityRuleFor('Paquete')).toEqual({ step: 1, min: 1 });
    expect(quantityRuleFor('Libras')).toEqual({ step: 0.5, min: 0.5 });
    expect(quantityRuleFor('Kilos')).toEqual({ step: 0.5, min: 0.5 });
  });

  describe('incremento', () => {
    it('suma 1 en Unidad y Paquete', () => {
      expect(incrementQuantity(1, quantityRuleFor('Unidad'))).toBe(2);
      expect(incrementQuantity(3, quantityRuleFor('Paquete'))).toBe(4);
    });

    it('suma 0.5 en Libras y Kilos sin errores de coma flotante', () => {
      const rule = quantityRuleFor('Kilos');
      let value = 0.5;
      for (let i = 0; i < 5; i++) value = incrementQuantity(value, rule);
      expect(value).toBe(3);
      expect(incrementQuantity(1, quantityRuleFor('Libras'))).toBe(1.5);
    });

    it('parte del mínimo si el valor está vacío', () => {
      expect(incrementQuantity(null, quantityRuleFor('Kilos'))).toBe(0.5);
    });
  });

  describe('decremento y mínimo', () => {
    it('resta el incremento de la unidad', () => {
      expect(decrementQuantity(3, quantityRuleFor('Unidad'))).toBe(2);
      expect(decrementQuantity(2, quantityRuleFor('Kilos'))).toBe(1.5);
    });

    it('nunca baja del mínimo (ni a 0 ni a negativo)', () => {
      expect(decrementQuantity(1, quantityRuleFor('Unidad'))).toBe(1);
      expect(decrementQuantity(0.5, quantityRuleFor('Libras'))).toBe(0.5);
      expect(decrementQuantity(1.3, quantityRuleFor('Unidad'))).toBe(1);
    });

    it('indica cuándo se alcanzó el mínimo', () => {
      expect(isAtMinimum(1, quantityRuleFor('Unidad'))).toBe(true);
      expect(isAtMinimum(2, quantityRuleFor('Unidad'))).toBe(false);
      expect(isAtMinimum(1, quantityRuleFor('Kilos'))).toBe(false);
      expect(isAtMinimum(0.5, quantityRuleFor('Kilos'))).toBe(true);
      expect(isAtMinimum(null, quantityRuleFor('Kilos'))).toBe(false);
    });
  });

  describe('ajuste al cambiar de unidad', () => {
    it('redondea al valor válido más cercano', () => {
      expect(snapQuantityToUnit(1.5, 'Unidad')).toBe(2);
      expect(snapQuantityToUnit(2.5, 'Paquete')).toBe(3);
      expect(snapQuantityToUnit(1.3, 'Libras')).toBe(1.5);
      expect(snapQuantityToUnit(1.2, 'Kilos')).toBe(1);
    });

    it('respeta el mínimo de la nueva unidad', () => {
      expect(snapQuantityToUnit(0.5, 'Unidad')).toBe(1);
      expect(snapQuantityToUnit(0.2, 'Kilos')).toBe(0.5);
    });

    it('no cambia los valores que ya encajan', () => {
      expect(snapQuantityToUnit(2, 'Kilos')).toBe(2);
      expect(snapQuantityToUnit(3, 'Unidad')).toBe(3);
    });

    it('deja los valores vacíos para que los reporte la validación', () => {
      expect(snapQuantityToUnit(null, 'Unidad')).toBeNull();
    });
  });

  it('interpreta y formatea cantidades', () => {
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity(' 2 ')).toBe(2);
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('abc')).toBeNull();
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(2)).toBe('2');
  });
});
