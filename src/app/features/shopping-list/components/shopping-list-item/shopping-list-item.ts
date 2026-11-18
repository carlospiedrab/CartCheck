import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { formatQuantity } from '../../models/quantity-rules';
import { ShoppingItem } from '../../models/shopping-item.model';

@Component({
  selector: 'li[app-shopping-list-item]',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule],
  host: {
    class:
      'flex min-h-[60px] items-center gap-2 rounded-[14px] border border-line bg-surface py-1.5 pr-2 pl-1',
  },
  template: `
    @let current = item();
    <mat-checkbox
      class="cc-item-checkbox min-w-0 flex-1"
      [checked]="current.purchased"
      (change)="purchasedChange.emit($event.checked)"
    >
      <span class="flex min-w-0 flex-col gap-0.5 py-1">
        <span
          data-testid="item-name"
          class="text-base break-words"
          [class.font-semibold]="!current.purchased"
          [class.text-ink]="!current.purchased"
          [class.font-medium]="current.purchased"
          [class.text-ink-faint]="current.purchased"
          [class.line-through]="current.purchased"
          [class.decoration-2]="current.purchased"
        >
          {{ current.name }}
        </span>
        <span
          data-testid="item-quantity"
          class="text-[13px]"
          [class.text-ink-muted]="!current.purchased"
          [class.text-ink-faint]="current.purchased"
          [class.line-through]="current.purchased"
        >
          {{ quantityLabel() }}
        </span>
      </span>
    </mat-checkbox>
    <button
      matIconButton
      type="button"
      class="cc-icon-button-danger shrink-0"
      [attr.aria-label]="'Eliminar ' + current.name"
      (click)="remove.emit()"
    >
      <mat-icon>delete</mat-icon>
    </button>
  `,
})
export class ShoppingListItem {
  readonly item = input.required<ShoppingItem>();
  /** Emite el nuevo estado de la casilla. */
  readonly purchasedChange = output<boolean>();
  readonly remove = output<void>();

  protected readonly quantityLabel = computed(
    () => `${formatQuantity(this.item().quantity)} · ${this.item().unit}`,
  );
}
