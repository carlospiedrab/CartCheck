import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShoppingItem } from '../../models/shopping-item.model';
import { ShoppingListItem } from './shopping-list-item';

@Component({
  imports: [ShoppingListItem],
  template: `
    <ul>
      <li
        app-shopping-list-item
        [item]="item()"
        (purchasedChange)="onPurchasedChange($event)"
        (remove)="removed = removed + 1"
      ></li>
    </ul>
  `,
})
class HostComponent {
  readonly item = signal<ShoppingItem>({
    id: '1',
    name: 'Pechuga de pollo',
    quantity: 1.5,
    unit: 'Kilos',
    purchased: false,
    createdAt: 0,
  });
  readonly changes: boolean[] = [];
  removed = 0;

  onPurchasedChange(purchased: boolean): void {
    this.changes.push(purchased);
    this.item.update((item) => ({ ...item, purchased }));
  }
}

describe('ShoppingListItem', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let element: HTMLElement;

  const query = <T extends Element>(selector: string): T => {
    const found = element.querySelector<T>(selector);
    if (!found) throw new Error(`No se encontró ${selector}`);
    return found;
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('muestra nombre, cantidad y unidad', () => {
    expect(query('[data-testid="item-name"]').textContent?.trim()).toBe('Pechuga de pollo');
    expect(query('[data-testid="item-quantity"]').textContent?.trim()).toBe('1.5 · Kilos');
  });

  it('tacha y atenúa el texto al marcar la casilla y lo restaura al desmarcarla', async () => {
    const checkbox = query<HTMLInputElement>('input[type="checkbox"]');
    const name = query('[data-testid="item-name"]');
    const quantity = query('[data-testid="item-quantity"]');
    expect(name.classList).not.toContain('line-through');

    checkbox.click();
    await fixture.whenStable();

    expect(host.changes).toEqual([true]);
    expect(checkbox.checked).toBe(true);
    expect(name.classList).toContain('line-through');
    expect(name.classList).toContain('text-ink-faint');
    expect(quantity.classList).toContain('line-through');

    checkbox.click();
    await fixture.whenStable();

    expect(host.changes).toEqual([true, false]);
    expect(name.classList).not.toContain('line-through');
    expect(name.classList).toContain('text-ink');
  });

  it('el botón eliminar tiene aria-label y emite el evento', async () => {
    const button = query<HTMLButtonElement>('button[aria-label="Eliminar Pechuga de pollo"]');
    button.click();
    await fixture.whenStable();
    expect(host.removed).toBe(1);
  });
});
