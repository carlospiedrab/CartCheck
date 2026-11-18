import { Component, computed, output, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  INITIAL_QUANTITY,
  quantityRuleFor,
  snapQuantityToUnit,
} from '../../models/quantity-rules';
import { isUnit, NewShoppingItem, UNITS } from '../../models/shopping-item.model';
import { QuantityStepper } from '../quantity-stepper/quantity-stepper';
import {
  createInitialProductFormModel,
  ProductFormModel,
  productFormSchema,
} from './product-form.schema';

@Component({
  selector: 'app-product-form',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    QuantityStepper,
  ],
  host: { class: 'block' },
  template: `
    <form
      [formRoot]="productForm"
      novalidate
      aria-label="Agregar producto"
      class="cc-form-fields flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 pt-5 md:p-5 md:pt-6"
    >
      @let nameField = productForm.name();
      <mat-form-field>
        <mat-label>Producto</mat-label>
        <input
          matInput
          [formField]="productForm.name"
          placeholder="Ej. Leche, pan, arroz…"
          autocomplete="off"
          enterkeyhint="done"
        />
        <mat-error>{{ nameField.errors()[0]?.message }}</mat-error>
      </mat-form-field>

      <div class="grid grid-cols-[minmax(0,8fr)_minmax(0,5fr)] gap-2.5">
        <app-quantity-stepper [formField]="productForm.quantity" [step]="step()" />

        <mat-form-field>
          <mat-label>Unidad</mat-label>
          <mat-select [formField]="productForm.unit" (selectionChange)="onUnitChange($event.value)">
            @for (unit of units; track unit) {
              <mat-option [value]="unit">{{ unit }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <button matButton="filled" type="submit" class="cc-button-primary w-full">
        <mat-icon>add</mat-icon>
        Agregar
      </button>
    </form>
  `,
})
export class ProductForm {
  /** Producto válido listo para agregarse a la lista. */
  readonly add = output<NewShoppingItem>();

  protected readonly units = UNITS;

  private readonly model = signal<ProductFormModel>(createInitialProductFormModel());

  protected readonly productForm = form(this.model, productFormSchema, {
    submission: {
      action: async () => {
        this.submitValid();
        return undefined;
      },
      onInvalid: () => this.focusFirstInvalid(),
    },
  });

  protected readonly step = computed(() => quantityRuleFor(this.model().unit).step);

  /** Ajusta la cantidad al nuevo incremento (ej. 1.5 → 2 al pasar a `Unidad`). */
  protected onUnitChange(value: unknown): void {
    if (!isUnit(value)) {
      return;
    }
    this.model.update((current) => ({
      ...current,
      unit: value,
      quantity: snapQuantityToUnit(current.quantity, value),
    }));
  }

  private submitValid(): void {
    const { name, quantity, unit } = this.model();
    if (quantity === null) {
      return;
    }
    this.add.emit({ name, quantity, unit });
    this.model.update((current) => ({ ...current, name: '', quantity: INITIAL_QUANTITY }));
    this.productForm().reset();
    this.productForm.name().focusBoundControl();
  }

  private focusFirstInvalid(): void {
    if (this.productForm.name().invalid()) {
      this.productForm.name().focusBoundControl();
    } else if (this.productForm.quantity().invalid()) {
      this.productForm.quantity().focusBoundControl();
    }
  }
}
