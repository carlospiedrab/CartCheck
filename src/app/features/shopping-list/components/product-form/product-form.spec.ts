import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { NewShoppingItem } from '../../models/shopping-item.model';
import { ProductForm } from './product-form';

@Component({
  imports: [ProductForm],
  template: `<app-product-form (add)="added.push($event)" />`,
})
class HostComponent {
  readonly added: NewShoppingItem[] = [];
}

describe('ProductForm', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let element: HTMLElement;
  let loader: HarnessLoader;

  const nameInput = (): HTMLInputElement =>
    element.querySelector<HTMLInputElement>('input[placeholder^="Ej."]')!;
  const quantityInput = (): HTMLInputElement =>
    element.querySelector<HTMLInputElement>('app-quantity-stepper input')!;
  const button = (label: string): HTMLButtonElement =>
    element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const errors = (): string[] =>
    Array.from(element.querySelectorAll('mat-error')).map((e) => e.textContent?.trim() ?? '');

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.requestSubmit();
    await fixture.whenStable();
  }

  async function selectUnit(unit: string): Promise<void> {
    const select = await loader.getHarness(MatSelectHarness);
    await select.clickOptions({ text: unit });
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  describe('validaciones', () => {
    it('no envía con el producto vacío y muestra el error', async () => {
      await submit();
      expect(host.added).toEqual([]);
      expect(errors()).toContain('Escribe el nombre del producto');
    });

    it('rechaza espacios al inicio o al final', async () => {
      await type(nameInput(), ' Leche ');
      await submit();
      expect(host.added).toEqual([]);
      expect(errors()).toContain('Quita los espacios al inicio o al final');
    });

    it('rechaza más de 60 caracteres', async () => {
      await type(nameInput(), 'a'.repeat(61));
      await submit();
      expect(host.added).toEqual([]);
      expect(errors()).toContain('Máximo 60 caracteres');
    });

    it('rechaza cantidad vacía, 0 o negativa', async () => {
      await type(nameInput(), 'Leche');

      await type(quantityInput(), '');
      await submit();
      expect(errors()).toContain('Ingresa una cantidad');

      await type(quantityInput(), '0');
      await submit();
      expect(errors()).toContain('La cantidad debe ser mayor que 0');

      await type(quantityInput(), '-2');
      await submit();
      expect(errors()).toContain('La cantidad debe ser mayor que 0');

      expect(host.added).toEqual([]);
    });

    it('exige el mínimo de la unidad', async () => {
      await type(nameInput(), 'Leche');
      await type(quantityInput(), '0.5');
      await submit();
      expect(host.added).toEqual([]);
      expect(errors()).toContain('La cantidad mínima es 1');
    });
  });

  describe('envío', () => {
    it('emite el producto, limpia el nombre, reinicia la cantidad y enfoca Producto', async () => {
      await type(nameInput(), 'Leche');
      await type(quantityInput(), '3');
      await submit();

      expect(host.added).toEqual([{ name: 'Leche', quantity: 3, unit: 'Unidad' }]);
      expect(nameInput().value).toBe('');
      expect(quantityInput().value).toBe('1');
      expect(document.activeElement).toBe(nameInput());
      expect(errors()).toEqual([]);
    });

    it('acepta coma decimal en unidades de peso', async () => {
      await selectUnit('Kilos');
      await type(nameInput(), 'Pollo');
      await type(quantityInput(), '1,5');
      await submit();
      expect(host.added).toEqual([{ name: 'Pollo', quantity: 1.5, unit: 'Kilos' }]);
    });
  });

  describe('selector de cantidad', () => {
    it('incrementa de 1 en 1 en Unidad y desactiva − en el mínimo', async () => {
      expect(quantityInput().value).toBe('1');
      expect(button('Disminuir cantidad').disabled).toBe(true);

      button('Aumentar cantidad').click();
      await fixture.whenStable();
      expect(quantityInput().value).toBe('2');
      expect(button('Disminuir cantidad').disabled).toBe(false);

      button('Disminuir cantidad').click();
      await fixture.whenStable();
      expect(quantityInput().value).toBe('1');
      expect(button('Disminuir cantidad').disabled).toBe(true);
    });

    it('usa pasos de 0.5 en Kilos con mínimo 0.5', async () => {
      await selectUnit('Kilos');
      expect(button('Disminuir cantidad').disabled).toBe(false);

      button('Disminuir cantidad').click();
      await fixture.whenStable();
      expect(quantityInput().value).toBe('0.5');
      expect(button('Disminuir cantidad').disabled).toBe(true);

      button('Aumentar cantidad').click();
      button('Aumentar cantidad').click();
      await fixture.whenStable();
      expect(quantityInput().value).toBe('1.5');
    });

    it('ajusta la cantidad al cambiar a una unidad con otro incremento', async () => {
      await selectUnit('Kilos');
      button('Aumentar cantidad').click();
      await fixture.whenStable();
      expect(quantityInput().value).toBe('1.5');

      await selectUnit('Unidad');
      expect(quantityInput().value).toBe('2');
    });
  });
});
