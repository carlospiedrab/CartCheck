import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ShoppingListStore } from '../../data/shopping-list.store';
import {
  ConfirmClearDialog,
  ConfirmClearDialogData,
} from '../confirm-clear-dialog/confirm-clear-dialog';
import { ListHeader } from '../list-header/list-header';
import { ProductForm } from '../product-form/product-form';
import { ShoppingListItem } from '../shopping-list-item/shopping-list-item';

@Component({
  selector: 'app-shopping-list-page',
  imports: [ListHeader, MatButtonModule, ProductForm, ShoppingListItem],
  host: { class: 'block' },
  template: `
    <div class="mx-auto w-full max-w-xl px-5 pt-7 pb-8 md:max-w-2xl md:px-8 md:pt-10 lg:max-w-6xl">
      <app-list-header
        [purchased]="store.purchasedCount()"
        [total]="store.total()"
        [progress]="store.progress()"
      />

      <main
        class="mt-4 md:mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start lg:gap-10"
      >
        <section aria-labelledby="add-title" class="lg:sticky lg:top-6">
          <h2 id="add-title" class="sr-only">Agregar producto</h2>
          <app-product-form (add)="store.add($event)" />
        </section>

        <section aria-labelledby="list-title" class="pt-5 md:pt-8 lg:pt-0">
          <div class="flex items-center justify-between gap-3 pb-2 md:pb-3">
            <h2
              #listTitle
              id="list-title"
              tabindex="-1"
              class="m-0 text-base font-bold outline-none"
            >
              Mi lista
            </h2>
            <button
              matButton="outlined"
              type="button"
              class="cc-button-danger-outlined"
              [disabled]="store.isEmpty()"
              (click)="confirmClear()"
            >
              Limpiar lista
            </button>
          </div>

          <ul class="m-0 flex list-none flex-col gap-2 p-0" aria-labelledby="list-title">
            @for (item of store.items(); track item.id) {
              <li
                app-shopping-list-item
                [item]="item"
                (purchasedChange)="store.togglePurchased(item.id)"
                (remove)="remove(item.id)"
              ></li>
            } @empty {
              <li
                class="mt-8 rounded-2xl border-[1.5px] border-dashed border-line-strong px-5 py-8 text-center text-[15px] text-ink-muted"
              >
                Tu lista está vacía. Agrega tu primer producto
                <span class="lg:hidden">arriba</span
                ><span class="hidden lg:inline">con el formulario</span>.
              </li>
            }
          </ul>
        </section>
      </main>
    </div>
  `,
})
export class ShoppingListPage {
  protected readonly store = inject(ShoppingListStore);
  private readonly dialog = inject(MatDialog);
  private readonly listTitle = viewChild.required<ElementRef<HTMLElement>>('listTitle');

  protected remove(id: string): void {
    this.store.remove(id);
    // El botón eliminado desaparece: se mueve el foco a un punto estable para no perderlo.
    this.listTitle().nativeElement.focus();
  }

  protected confirmClear(): void {
    this.dialog
      .open<ConfirmClearDialog, ConfirmClearDialogData, boolean>(ConfirmClearDialog, {
        data: { count: this.store.total() },
        maxWidth: '360px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.clear();
          this.listTitle().nativeElement.focus();
        }
      });
  }
}
