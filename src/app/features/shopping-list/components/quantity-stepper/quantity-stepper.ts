import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  linkedSignal,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import {
  decrementQuantity,
  formatQuantity,
  incrementQuantity,
  isAtMinimum,
  parseQuantity,
  QuantityRule,
} from '../../models/quantity-rules';

let nextId = 0;

/**
 * Control − [cantidad] + compatible con Signal Forms (`[formField]`).
 * El paso llega por `step`; el mínimo lo enlaza automáticamente `[formField]` desde la regla
 * `min()` del esquema (si no hay ninguna, se usa el propio paso).
 */
@Component({
  selector: 'app-quantity-stepper',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  host: { class: 'block' },
  template: `
    <div class="flex items-start gap-1">
      <button
        matIconButton
        type="button"
        class="cc-icon-button-stepper shrink-0"
        aria-label="Disminuir cantidad"
        [attr.aria-controls]="inputId"
        [disabled]="disabled() || atMinimum()"
        (click)="decrease()"
      >
        <mat-icon>remove</mat-icon>
      </button>

      <mat-form-field class="min-w-0 flex-1">
        <mat-label>{{ label() }}</mat-label>
        <input
          #quantityInput
          matInput
          type="text"
          inputmode="decimal"
          autocomplete="off"
          class="text-center text-base! font-semibold"
          [id]="inputId"
          [name]="name()"
          [value]="draft()"
          [disabled]="disabled()"
          [errorStateMatcher]="errorStateMatcher"
          (input)="onInput(quantityInput.value)"
          (blur)="onBlur()"
          (keydown.arrowup)="onArrow($event, 1)"
          (keydown.arrowdown)="onArrow($event, -1)"
        />
        @if (showError()) {
          <mat-error>{{ errors()[0]?.message }}</mat-error>
        }
      </mat-form-field>

      <button
        matIconButton
        type="button"
        class="cc-icon-button-stepper shrink-0"
        aria-label="Aumentar cantidad"
        [attr.aria-controls]="inputId"
        [disabled]="disabled()"
        (click)="increase()"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
})
export class QuantityStepper implements FormValueControl<number | null> {
  // Contrato FormValueControl (lo enlaza [formField]).
  readonly value = model<number | null>(null);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly name = input('');
  readonly min = input<number | undefined>(undefined);
  readonly touch = output<void>();

  // Entradas propias.
  readonly step = input.required<number>();
  readonly label = input('Cantidad');

  protected readonly inputId = `cc-quantity-${nextId++}`;
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('quantityInput');

  private readonly rule = computed<QuantityRule>(() => ({
    step: this.step(),
    min: this.min() ?? this.step(),
  }));
  protected readonly atMinimum = computed(() => isAtMinimum(this.value(), this.rule()));
  protected readonly showError = computed(
    () => this.invalid() && this.touched() && this.errors().length > 0,
  );

  /**
   * Texto que muestra el campo. Se deriva del valor, pero conserva lo que el usuario escribe
   * mientras represente el mismo número (así "1," o "1.50" no se reescriben al teclear).
   */
  protected readonly draft = linkedSignal<number | null, string>({
    source: this.value,
    computation: (value, previous) => {
      if (previous !== undefined && parseQuantity(previous.value) === value) {
        return previous.value;
      }
      return value === null ? '' : formatQuantity(value);
    },
  });

  protected readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.showError(),
  };

  /**
   * `matInput` solo recalcula su estado de error por sí mismo cuando tiene un control de
   * formularios propio. Aquí el control es el componente host, así que se sincroniza a mano.
   */
  private readonly matInput = viewChild.required(MatInput);
  private readonly syncErrorState = effect(() => {
    this.showError();
    this.matInput().updateErrorState();
  });

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  protected onInput(text: string): void {
    this.draft.set(text);
    this.value.set(parseQuantity(text));
  }

  protected onBlur(): void {
    const value = this.value();
    if (value !== null) {
      this.draft.set(formatQuantity(value));
    }
    this.touch.emit();
  }

  protected onArrow(event: Event, direction: 1 | -1): void {
    event.preventDefault();
    if (direction === 1) {
      this.increase();
    } else {
      this.decrease();
    }
  }

  protected increase(): void {
    if (!this.disabled()) {
      this.value.set(incrementQuantity(this.value(), this.rule()));
    }
  }

  protected decrease(): void {
    if (!this.disabled()) {
      this.value.set(decrementQuantity(this.value(), this.rule()));
    }
  }
}
