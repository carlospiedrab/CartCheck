import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { ShoppingListStore } from '../../data/shopping-list.store';
import { ShoppingListPage } from './shopping-list-page';

describe('ShoppingListPage', () => {
  let fixture: ComponentFixture<ShoppingListPage>;
  let store: ShoppingListStore;
  let element: HTMLElement;

  const buttonByText = (root: ParentNode, text: string): HTMLButtonElement => {
    const found = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === text,
    );
    if (!found) throw new Error(`No se encontró el botón "${text}"`);
    return found;
  };

  const openDialog = (): HTMLElement => {
    const dialog = document.querySelector<HTMLElement>('mat-dialog-container');
    if (!dialog) throw new Error('No hay diálogo abierto');
    return dialog;
  };

  beforeEach(async () => {
    localStorage.clear();
    // Sin animaciones, el diálogo se cierra (y emite afterClosed) de forma síncrona.
    TestBed.configureTestingModule({
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
    fixture = TestBed.createComponent(ShoppingListPage);
    store = TestBed.inject(ShoppingListStore);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('muestra el estado vacío y desactiva "Limpiar lista"', () => {
    expect(element.textContent).toContain('Tu lista está vacía');
    expect(buttonByText(element, 'Limpiar lista').disabled).toBe(true);
    expect(element.textContent).toContain('0 de 0 comprados');
  });

  it('pide confirmación antes de limpiar y solo borra al confirmar', async () => {
    store.add({ name: 'Pan', quantity: 1, unit: 'Unidad' });
    store.add({ name: 'Leche', quantity: 2, unit: 'Unidad' });
    await fixture.whenStable();
    expect(element.textContent).toContain('0 de 2 comprados');

    buttonByText(element, 'Limpiar lista').click();
    await fixture.whenStable();
    expect(openDialog().textContent).toContain('Se eliminarán 2 productos');

    buttonByText(openDialog(), 'Cancelar').click();
    await fixture.whenStable();
    expect(document.querySelector('mat-dialog-container')).toBeNull();
    expect(store.total()).toBe(2);

    buttonByText(element, 'Limpiar lista').click();
    await fixture.whenStable();
    buttonByText(openDialog(), 'Limpiar lista').click();
    await fixture.whenStable();

    expect(store.isEmpty()).toBe(true);
    expect(element.textContent).toContain('Tu lista está vacía');
  });
});
