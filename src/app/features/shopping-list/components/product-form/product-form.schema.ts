import { maxLength, min, required, schema, validate } from '@angular/forms/signals';
import { formatQuantity, INITIAL_QUANTITY, quantityRuleFor } from '../../models/quantity-rules';
import { DEFAULT_UNIT, PRODUCT_NAME_MAX_LENGTH, Unit } from '../../models/shopping-item.model';

export interface ProductFormModel {
  name: string;
  /** `null` cuando el campo está vacío o el texto no es un número. */
  quantity: number | null;
  unit: Unit;
}

export function createInitialProductFormModel(unit: Unit = DEFAULT_UNIT): ProductFormModel {
  return { name: '', quantity: INITIAL_QUANTITY, unit };
}

export const productFormSchema = schema<ProductFormModel>((path) => {
  required(path.name, { message: 'Escribe el nombre del producto' });
  maxLength(path.name, PRODUCT_NAME_MAX_LENGTH, {
    message: `Máximo ${PRODUCT_NAME_MAX_LENGTH} caracteres`,
  });
  validate(path.name, ({ value }) =>
    value() !== value().trim()
      ? { kind: 'whitespace', message: 'Quita los espacios al inicio o al final' }
      : null,
  );

  required(path.quantity, { message: 'Ingresa una cantidad' });
  validate(path.quantity, ({ value }) => {
    const quantity = value();
    return quantity !== null && quantity <= 0
      ? { kind: 'positive', message: 'La cantidad debe ser mayor que 0' }
      : null;
  });
  min(path.quantity, ({ valueOf }) => quantityRuleFor(valueOf(path.unit)).min, {
    message: ({ valueOf }) =>
      `La cantidad mínima es ${formatQuantity(quantityRuleFor(valueOf(path.unit)).min)}`,
    when: ({ value }) => (value() ?? 0) > 0,
  });
});
